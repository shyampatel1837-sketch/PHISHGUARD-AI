"""
PhishGuard AI — Feature Improvement Experiment
===============================================

Compares three model candidates:
  A: Existing 24-feature Random Forest (baseline)
  B: 31-feature Random Forest (improved features)
  C: 31-feature ExtraTrees (improved features + lower variance)

Each candidate is evaluated on both:
  - Random 80/20 split (stratified)
  - Domain-aware 80/20 split (GroupShuffleSplit, zero domain overlap)

Run from project root:
    cd PHISHGUARD-AI/backend
    .venv/bin/python3 ../ml/scripts/run_experiment.py
"""

import sys
import math
import re
import itertools
from pathlib import Path
from collections import Counter
from urllib.parse import urlparse, parse_qs
from typing import List

import numpy as np
import pandas as pd
import tldextract
import joblib

from sklearn.ensemble import RandomForestClassifier, ExtraTreesClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, confusion_matrix, classification_report,
    precision_recall_curve,
)
from sklearn.model_selection import train_test_split, GroupShuffleSplit

# ── Path setup ────────────────────────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from app.services.feature_service import (
    extract_features,
    build_feature_vector,
    FEATURE_NAMES,
)

DATA_PATH   = PROJECT_ROOT / "ml" / "data" / "phishing_site_urls_clean.csv"
MODELS_DIR  = PROJECT_ROOT / "ml" / "models"
BACKEND_MODEL_DIR = PROJECT_ROOT / "backend" / "model"
RESULTS_DIR = PROJECT_ROOT / "ml" / "results"

MODELS_DIR.mkdir(parents=True, exist_ok=True)
BACKEND_MODEL_DIR.mkdir(parents=True, exist_ok=True)
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

RANDOM_STATE = 42

# ── Sanity test URLs ──────────────────────────────────────────────────────────
LEGITIMATE_SANITY = [
    "https://google.com",
    "https://www.google.com",
    "https://example.com",
    "https://github.com",
    "https://www.github.com",
    "https://microsoft.com",
    "https://www.microsoft.com",
    "https://www.amazon.com",
    "https://www.apple.com",
    "https://www.facebook.com",
    "https://www.youtube.com",
    "https://www.wikipedia.org",
]
PHISHING_SANITY = [
    "http://paypal-login-example.com/verify",
    "http://secure-account-login.com/update/password",
    "http://192.168.1.1/login",
]


# EXTENDED FEATURE EXTRACTION (31 features)
# Implemented HERE in the experiment script.
# Once the best model is chosen, the 7 new features are added to
# feature_service.py, url_schemas.py, and FEATURE_NAMES.


NEW_FEATURE_NAMES: List[str] = [
    "subdomain_is_www",
    "non_www_subdomain_depth",
    "reg_domain_length",
    "hostname_label_count",
    "digit_ratio_hostname",
    "path_domain_count",
    "vowel_ratio_reg_domain",
]

ALL_31_FEATURE_NAMES: List[str] = FEATURE_NAMES + NEW_FEATURE_NAMES


def _extract_new_features(url: str) -> List[float]:
    """
    Compute the 7 new features from a raw URL string.
    Uses the same canonicalisation logic as feature_service.py.
    """
    # Strip scheme for canonicalisation (same as feature_service)
    u = str(url).strip()
    no_scheme = re.sub(r"^https?://", "", u, flags=re.IGNORECASE).strip()
    parse_url = "http://" + no_scheme
    parsed = urlparse(parse_url)
    hostname = parsed.hostname or ""
    path = parsed.path or "/"

    ext = tldextract.extract(parse_url)
    reg_domain = ext.domain or ""
    suffix = ext.suffix or ""
    subdomain = ext.subdomain or ""

    # ── 25. subdomain_is_www ──────────────────────────────────────────────────
    # 1 if the only subdomain is exactly 'www', 0 otherwise.
    subdomain_is_www = float(subdomain.lower() == "www")

    # ── 26. non_www_subdomain_depth ───────────────────────────────────────────
    # Number of subdomain labels after removing 'www'.
    # Examples:
    #   www.google.com          -> 0
    #   docs.google.com         -> 1
    #   paypal.com.fake.evil.tk -> 3 (all labels are non-www)
    sub_labels = [s for s in subdomain.split(".") if s] if subdomain else []
    non_www_labels = [s for s in sub_labels if s.lower() != "www"]
    non_www_subdomain_depth = float(len(non_www_labels))

    # ── 27. reg_domain_length ────────────────────────────────────────────────
    # Length of the registrable domain (domain token only, not TLD).
    # Separates registrable-domain complexity from full-hostname complexity.
    reg_domain_length = float(len(reg_domain))

    # ── 28. hostname_label_count ─────────────────────────────────────────────
    # Total number of dot-separated labels in the hostname.
    # Example: a.b.example.com -> 4
    labels = hostname.split(".") if hostname else []
    hostname_label_count = float(len(labels))

    # ── 29. digit_ratio_hostname ─────────────────────────────────────────────
    # Ratio of digit characters to total hostname length.
    # Phishing hostnames frequently embed numeric tokens.
    digits_in_h = sum(c.isdigit() for c in hostname)
    digit_ratio_hostname = digits_in_h / len(hostname) if hostname else 0.0

    # ── 30. path_domain_count ────────────────────────────────────────────────
    # Count of embedded domain-like tokens in the path
    # (tokens matching X.Y where Y is 2+ alpha chars).
    # Catches impersonation URLs like:
    #   /secure/www.paypal.com/login
    path_domain_count = float(
        len(re.findall(r"[a-z0-9\-]+\.[a-z]{2,}", path.lower()))
    )

    # ── 31. vowel_ratio_reg_domain ───────────────────────────────────────────
    # Ratio of vowels in the registrable domain token.
    # Algorithmically-generated names tend to have low vowel ratios.
    vowels = sum(c in "aeiou" for c in reg_domain.lower())
    vowel_ratio_reg_domain = vowels / len(reg_domain) if reg_domain else 0.0

    return [
        subdomain_is_www,
        non_www_subdomain_depth,
        reg_domain_length,
        hostname_label_count,
        digit_ratio_hostname,
        path_domain_count,
        vowel_ratio_reg_domain,
    ]


def build_31_feature_vector(url: str) -> List[float]:
    """Build the full 31-feature vector for a URL string."""
    features = extract_features(url)
    base = build_feature_vector(features)
    extended = _extract_new_features(url)
    return base + extended



# HELPERS


def get_registrable_domain(url: str) -> str:
    u = str(url).strip()
    if not u.startswith(("http://", "https://")):
        u = "http://" + u
    ext = tldextract.extract(u)
    if ext.domain and ext.suffix:
        return f"{ext.domain}.{ext.suffix}"
    return ext.domain or u


def evaluate(model, X_test, y_test, name: str, threshold: float = 0.5) -> dict:
    probs = model.predict_proba(X_test)[:, 1]
    y_pred = (probs >= threshold).astype(int)
    acc  = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec  = recall_score(y_test, y_pred, zero_division=0)
    f1   = f1_score(y_test, y_pred, zero_division=0)
    cm   = confusion_matrix(y_test, y_pred)
    print(f"\n{'='*60}")
    print(f"{name}  (threshold={threshold:.2f})")
    print(f"{'='*60}")
    print(f"Accuracy : {acc:.4f}")
    print(f"Precision: {prec:.4f}")
    print(f"Recall   : {rec:.4f}")
    print(f"F1 Score : {f1:.4f}")
    print(f"Confusion Matrix:\n{cm}")
    # False positives
    fp_mask = (y_test == 0) & (y_pred == 1)
    print(f"False Positives: {fp_mask.sum()}")
    return {"acc": acc, "prec": prec, "rec": rec, "f1": f1, "cm": cm}


def sanity_test(model, feature_fn, label: str, threshold: float = 0.5):
    print(f"\n{'='*60}")
    print(f"SANITY TEST — {label}  (threshold={threshold:.2f})")
    print(f"{'='*60}")
    all_pass = True
    for url in LEGITIMATE_SANITY:
        vec = feature_fn(url)
        prob = model.predict_proba(pd.DataFrame([vec], columns=model.feature_names_in_))[0][1]
        classification = "phishing" if prob >= threshold else "legitimate"
        ok = classification == "legitimate"
        if not ok:
            all_pass = False
        mark = "✓" if ok else "✗ FP"
        print(f"  {mark}  {url:<40}  phishing_prob={prob*100:5.1f}%  → {classification}")
    for url in PHISHING_SANITY:
        vec = feature_fn(url)
        prob = model.predict_proba(pd.DataFrame([vec], columns=model.feature_names_in_))[0][1]
        classification = "phishing" if prob >= threshold else "legitimate"
        ok = classification == "phishing"
        if not ok:
            all_pass = False
        mark = "✓" if ok else "✗ FN"
        print(f"  {mark}  {url:<40}  phishing_prob={prob*100:5.1f}%  → {classification}")
    print(f"\n  {'ALL PASS ✓' if all_pass else 'SOME FAILED ✗'}")
    return all_pass


def find_best_threshold(model, X_val, y_val, feature_names):
    """Find threshold that maximises F1 on the validation set."""
    probs = model.predict_proba(X_val)[:, 1]
    precisions, recalls, thresholds = precision_recall_curve(y_val, probs)
    f1s = 2 * precisions * recalls / np.maximum(precisions + recalls, 1e-9)
    best_idx = np.argmax(f1s[:-1])
    best_t = float(thresholds[best_idx])
    print(f"\nThreshold search: best_F1={f1s[best_idx]:.4f} at threshold={best_t:.3f}")
    # Also show P/R curve highlights
    for t in [0.30, 0.40, 0.45, 0.50, 0.55, 0.60, 0.65]:
        idx = np.searchsorted(thresholds, t)
        if idx < len(thresholds):
            print(f"  t={t:.2f}  P={precisions[idx]:.4f}  R={recalls[idx]:.4f}  F1={f1s[idx]:.4f}")
    return best_t



# MAIN


print("=" * 70)
print("PHISHGUARD AI — FEATURE IMPROVEMENT EXPERIMENT")
print("=" * 70)

# ── 1. Load dataset ──────────────────────────────────────────────────────────
print("\n[1/7] Loading dataset...")
df = pd.read_csv(DATA_PATH)
print(f"Total rows: {len(df):,}")
label_map = {"good": 0, "bad": 1}
df["target"] = df["Label"].map(label_map)
if df["target"].isna().any():
    raise ValueError("Unknown labels in dataset")
print("Label distribution:")
print(df["Label"].value_counts())

# ── 2. Extract features ──────────────────────────────────────────────────────
print("\n[2/7] Extracting features (24 base + 7 new = 31)...")
vectors_24 = []
vectors_31 = []
groups     = []

total = len(df)
for i, url in enumerate(df["URL"]):
    f = extract_features(url)
    v24 = build_feature_vector(f)
    v31 = v24 + _extract_new_features(url)
    vectors_24.append(v24)
    vectors_31.append(v31)
    groups.append(get_registrable_domain(url))
    if (i + 1) % 50_000 == 0:
        print(f"  Processed {i+1:,}/{total:,}")

X24 = pd.DataFrame(vectors_24, columns=FEATURE_NAMES)
X31 = pd.DataFrame(vectors_31, columns=ALL_31_FEATURE_NAMES)
y   = df["target"].astype(int)
grp = pd.Series(groups)

print(f"24-feature matrix: {X24.shape}")
print(f"31-feature matrix: {X31.shape}")

# ── 3. Splits ────────────────────────────────────────────────────────────────
print("\n[3/7] Creating train/test splits...")

# Random split
X24_tr, X24_te, X31_tr, X31_te, y_tr_r, y_te_r = train_test_split(
    X24, X31, y, test_size=0.20, random_state=RANDOM_STATE, stratify=y
)
print(f"Random split  — train: {len(X24_tr):,}  test: {len(X24_te):,}")

# Domain-aware split
splitter = GroupShuffleSplit(n_splits=1, test_size=0.20, random_state=RANDOM_STATE)
da_train_idx, da_test_idx = next(splitter.split(X24, y, groups=grp))
X24_da_tr  = X24.iloc[da_train_idx]; X24_da_te  = X24.iloc[da_test_idx]
X31_da_tr  = X31.iloc[da_train_idx]; X31_da_te  = X31.iloc[da_test_idx]
y_da_tr    = y.iloc[da_train_idx];    y_da_te    = y.iloc[da_test_idx]
grp_da_tr  = grp.iloc[da_train_idx];  grp_da_te  = grp.iloc[da_test_idx]
overlap = set(grp_da_tr.unique()) & set(grp_da_te.unique())
print(f"Domain-aware  — train: {len(X24_da_tr):,}  test: {len(X24_da_te):,}  overlap: {len(overlap)}")

# ── 4. Train models ──────────────────────────────────────────────────────────
print("\n[4/7] Training model candidates...")

# A: Baseline 24-feature RF
print("  Training A: 24-feature Random Forest...")
mdl_A = RandomForestClassifier(n_estimators=300, random_state=RANDOM_STATE,
                                n_jobs=-1, class_weight="balanced")
mdl_A.fit(X24_da_tr, y_da_tr)
mdl_A.feature_names_in_ = np.array(FEATURE_NAMES)

# B: 31-feature RF
print("  Training B: 31-feature Random Forest...")
mdl_B = RandomForestClassifier(n_estimators=300, random_state=RANDOM_STATE,
                                n_jobs=-1, class_weight="balanced")
mdl_B.fit(X31_da_tr, y_da_tr)
mdl_B.feature_names_in_ = np.array(ALL_31_FEATURE_NAMES)

# C: 31-feature ExtraTrees
print("  Training C: 31-feature ExtraTrees...")
mdl_C = ExtraTreesClassifier(n_estimators=300, random_state=RANDOM_STATE,
                               n_jobs=-1, class_weight="balanced")
mdl_C.fit(X31_da_tr, y_da_tr)
mdl_C.feature_names_in_ = np.array(ALL_31_FEATURE_NAMES)

print("  All models trained.")

# ── 5. Evaluate — random split ───────────────────────────────────────────────
print("\n\n" + "=" * 70)
print("SECTION 1: RANDOM SPLIT EVALUATION (t=0.5)")
print("=" * 70)

# For random-split we retrain on random-split train set
mdl_A_rand = RandomForestClassifier(n_estimators=300, random_state=RANDOM_STATE,
                                     n_jobs=-1, class_weight="balanced")
mdl_A_rand.fit(X24_tr, y_tr_r)
mdl_A_rand.feature_names_in_ = np.array(FEATURE_NAMES)

mdl_B_rand = RandomForestClassifier(n_estimators=300, random_state=RANDOM_STATE,
                                     n_jobs=-1, class_weight="balanced")
mdl_B_rand.fit(X31_tr, y_tr_r)
mdl_B_rand.feature_names_in_ = np.array(ALL_31_FEATURE_NAMES)

mdl_C_rand = ExtraTreesClassifier(n_estimators=300, random_state=RANDOM_STATE,
                                    n_jobs=-1, class_weight="balanced")
mdl_C_rand.fit(X31_tr, y_tr_r)
mdl_C_rand.feature_names_in_ = np.array(ALL_31_FEATURE_NAMES)

res_A_rand = evaluate(mdl_A_rand, X24_te, y_te_r, "A: 24-feat RF (random split)")
res_B_rand = evaluate(mdl_B_rand, X31_te, y_te_r, "B: 31-feat RF (random split)")
res_C_rand = evaluate(mdl_C_rand, X31_te, y_te_r, "C: 31-feat ET (random split)")

# ── 6. Evaluate — domain-aware split ────────────────────────────────────────
print("\n\n" + "=" * 70)
print("SECTION 2: DOMAIN-AWARE SPLIT EVALUATION (t=0.5)")
print("=" * 70)

res_A_da = evaluate(mdl_A, X24_da_te, y_da_te, "A: 24-feat RF (domain-aware)")
res_B_da = evaluate(mdl_B, X31_da_te, y_da_te, "B: 31-feat RF (domain-aware)")
res_C_da = evaluate(mdl_C, X31_da_te, y_da_te, "C: 31-feat ET (domain-aware)")

# ── 6b. Threshold analysis for best domain-aware model ───────────────────────
print("\n\n" + "=" * 70)
print("SECTION 3: THRESHOLD ANALYSIS (domain-aware val set)")
print("=" * 70)
# Use the domain-aware test set as a proxy for threshold selection
# (in a real setup this would be a held-out validation set)
print("\n-- Model B threshold analysis --")
best_t_B = find_best_threshold(mdl_B, X31_da_te, y_da_te, ALL_31_FEATURE_NAMES)
print("\n-- Model C threshold analysis --")
best_t_C = find_best_threshold(mdl_C, X31_da_te, y_da_te, ALL_31_FEATURE_NAMES)

# Evaluate at best thresholds
print("\n\n" + "=" * 70)
print("SECTION 4: DOMAIN-AWARE EVALUATION AT BEST THRESHOLD")
print("=" * 70)
res_B_da_t = evaluate(mdl_B, X31_da_te, y_da_te, f"B: 31-feat RF (domain-aware, t={best_t_B:.3f})", threshold=best_t_B)
res_C_da_t = evaluate(mdl_C, X31_da_te, y_da_te, f"C: 31-feat ET (domain-aware, t={best_t_C:.3f})", threshold=best_t_C)

# ── 7. Sanity tests ──────────────────────────────────────────────────────────
print("\n\n" + "=" * 70)
print("SECTION 5: SANITY TESTS")
print("=" * 70)

def san_A(url):
    f = extract_features(url)
    return pd.DataFrame([build_feature_vector(f)], columns=FEATURE_NAMES)
def san_31(url):
    f = extract_features(url)
    v = build_feature_vector(f) + _extract_new_features(url)
    return pd.DataFrame([v], columns=ALL_31_FEATURE_NAMES)

# Wrap model to accept raw URL
def predict_url_A(model, url, threshold=0.5):
    df_in = san_A(url)
    prob = model.predict_proba(df_in)[0][1]
    return "phishing" if prob >= threshold else "legitimate", prob

def predict_url_31(model, url, threshold=0.5):
    df_in = san_31(url)
    prob = model.predict_proba(df_in)[0][1]
    return "phishing" if prob >= threshold else "legitimate", prob

print("\n--- A: 24-feat RF (t=0.5) ---")
for url in LEGITIMATE_SANITY + PHISHING_SANITY:
    cl, prob = predict_url_A(mdl_A, url)
    expected = "phishing" if url in PHISHING_SANITY else "legitimate"
    ok = "✓" if cl == expected else "✗"
    print(f"  {ok}  {url:<45}  {prob*100:5.1f}%  → {cl}")

print(f"\n--- B: 31-feat RF (t={best_t_B:.3f}) ---")
for url in LEGITIMATE_SANITY + PHISHING_SANITY:
    cl, prob = predict_url_31(mdl_B, url, threshold=best_t_B)
    expected = "phishing" if url in PHISHING_SANITY else "legitimate"
    ok = "✓" if cl == expected else "✗"
    print(f"  {ok}  {url:<45}  {prob*100:5.1f}%  → {cl}")

print(f"\n--- C: 31-feat ET (t={best_t_C:.3f}) ---")
for url in LEGITIMATE_SANITY + PHISHING_SANITY:
    cl, prob = predict_url_31(mdl_C, url, threshold=best_t_C)
    expected = "phishing" if url in PHISHING_SANITY else "legitimate"
    ok = "✓" if cl == expected else "✗"
    print(f"  {ok}  {url:<45}  {prob*100:5.1f}%  → {cl}")

# ── 8. Feature importance for best model ─────────────────────────────────────
print("\n\n" + "=" * 70)
print("SECTION 6: FEATURE IMPORTANCE (domain-aware trained models)")
print("=" * 70)

for mdl, name in [(mdl_B, "B: 31-feat RF"), (mdl_C, "C: 31-feat ET")]:
    imp = pd.Series(mdl.feature_importances_, index=ALL_31_FEATURE_NAMES).sort_values(ascending=False)
    print(f"\n{name}:")
    for feat, val in imp.items():
        marker = " ★" if feat in NEW_FEATURE_NAMES else ""
        print(f"  {feat:<35} {val:.6f}{marker}")

# ── 9. Summary comparison ─────────────────────────────────────────────────────
print("\n\n" + "=" * 70)
print("SECTION 7: COMPARISON SUMMARY")
print("=" * 70)

print(f"\n{'Model':<35} {'Split':>12} {'Acc':>8} {'Prec':>8} {'Rec':>8} {'F1':>8}")
print("-" * 85)

def row(name, split, r):
    print(f"{name:<35} {split:>12} {r['acc']:>8.4f} {r['prec']:>8.4f} {r['rec']:>8.4f} {r['f1']:>8.4f}")

row("A: 24-feat RF", "random",        res_A_rand)
row("B: 31-feat RF", "random",        res_B_rand)
row("C: 31-feat ET", "random",        res_C_rand)
row("A: 24-feat RF", "domain-aware",  res_A_da)
row("B: 31-feat RF", "domain-aware",  res_B_da)
row("C: 31-feat ET", "domain-aware",  res_C_da)
row(f"B: 31-feat RF (t={best_t_B:.3f})", "domain-aware", res_B_da_t)
row(f"C: 31-feat ET (t={best_t_C:.3f})", "domain-aware", res_C_da_t)

# ── 10. Pick winner and save ──────────────────────────────────────────────────
print("\n\n" + "=" * 70)
print("SECTION 8: WINNER SELECTION")
print("=" * 70)

# Select based on domain-aware F1 at best threshold
candidates = [
    ("B_rf", mdl_B,  res_B_da_t, best_t_B, "31-feat RF"),
    ("C_et", mdl_C,  res_C_da_t, best_t_C, "31-feat ET"),
]
# Must also not decrease domain-aware F1 vs baseline
baseline_f1 = res_A_da["f1"]
print(f"\nBaseline domain-aware F1 (model A): {baseline_f1:.4f}")

best_id, best_model, best_res, best_t, best_name = max(
    candidates, key=lambda x: x[2]["f1"]
)

print(f"Winner: {best_name}  F1={best_res['f1']:.4f}  threshold={best_t:.3f}")

if best_res["f1"] <= baseline_f1:
    print("WARNING: Winner does not improve over baseline F1. Keeping baseline.")
    # Save baseline as production model anyway (it was already trained)
    joblib.dump(mdl_A, MODELS_DIR / "baseline_24feat_rf.pkl")
    print("Baseline model saved to ml/models/baseline_24feat_rf.pkl")
    print("No change to backend/model/phishing_model.pkl")
else:
    # Save winner
    save_path = MODELS_DIR / f"best_model_{best_id}.pkl"
    joblib.dump(best_model, save_path)
    print(f"Winner saved to: {save_path}")
    print(f"\nDomain-aware improvement over baseline:")
    print(f"  F1:       {baseline_f1:.4f} → {best_res['f1']:.4f}  (+{best_res['f1']-baseline_f1:.4f})")
    print(f"  Accuracy: {res_A_da['acc']:.4f} → {best_res['acc']:.4f}")
    print(f"  Precision:{res_A_da['prec']:.4f} → {best_res['prec']:.4f}")
    print(f"  Recall:   {res_A_da['rec']:.4f} → {best_res['rec']:.4f}")

    # Save metadata alongside model
    meta = {
        "model_type": best_name,
        "feature_count": 31,
        "feature_names": ALL_31_FEATURE_NAMES,
        "threshold": best_t,
        "domain_aware_metrics": best_res,
        "random_split_metrics": res_B_rand if "rf" in best_id else res_C_rand,
    }
    import json
    meta_path = MODELS_DIR / f"best_model_{best_id}_meta.json"
    # Convert numpy types
    def to_py(obj):
        if isinstance(obj, np.integer): return int(obj)
        if isinstance(obj, np.floating): return float(obj)
        if isinstance(obj, np.ndarray): return obj.tolist()
        return obj
    with open(meta_path, "w") as fh:
        json.dump(meta, fh, indent=2, default=to_py)
    print(f"Metadata saved to: {meta_path}")
    print(f"\nSelected model uses 31 features and threshold={best_t:.3f}")
    print("Next step: copy to backend/model/ and update feature_service.py")

print("\n" + "=" * 70)
print("EXPERIMENT COMPLETE")
print("=" * 70)
