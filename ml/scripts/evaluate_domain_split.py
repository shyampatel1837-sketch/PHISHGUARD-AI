import sys
from pathlib import Path

import numpy as np
import pandas as pd
import tldextract

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
)
from sklearn.model_selection import GroupShuffleSplit

# Make backend importable
PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from app.services.feature_service import extract_features, build_feature_vector, FEATURE_NAMES


DATA_PATH = PROJECT_ROOT / "ml" / "data" / "phishing_site_urls_clean.csv"


def get_group(url: str) -> str:
    """
    Get the registrable domain used for grouping.

    Examples:
        www.google.com       -> google.com
        docs.google.com      -> google.com
        en.wikipedia.org     -> wikipedia.org
    """
    value = str(url).strip()

    if not value.startswith(("http://", "https://")):
        value = "http://" + value

    extracted = tldextract.extract(value)

    if extracted.domain and extracted.suffix:
        return f"{extracted.domain}.{extracted.suffix}"

    # Fallback for unusual domains
    return extracted.domain or value


print("=" * 70)
print("PHISHGUARD AI - DOMAIN-AWARE EVALUATION")
print("=" * 70)

print("\nLoading dataset...")
df = pd.read_csv(DATA_PATH)

print(f"Total rows: {len(df):,}")

# Convert labels
label_map = {
    "good": 0,
    "bad": 1,
}

df["target"] = df["Label"].map(label_map)

if df["target"].isna().any():
    raise ValueError("Unknown labels found in dataset.")

# Create domain groups
print("\nCreating domain groups...")
df["domain_group"] = df["URL"].apply(get_group)

print(f"Unique domain groups: {df['domain_group'].nunique():,}")

# Extract features
print("\nExtracting 24 features...")
X_vectors = []

for i, url in enumerate(df["URL"]):
    features = extract_features(url)
    X_vectors.append(build_feature_vector(features))

    if (i + 1) % 50000 == 0:
        print(f"Processed {i + 1:,} / {len(df):,}")

X = pd.DataFrame(X_vectors, columns=FEATURE_NAMES)
y = df["target"]
groups = df["domain_group"]

print(f"\nFeature matrix: {X.shape}")

# ---------------------------------------------------------
# DOMAIN-AWARE SPLIT
# ---------------------------------------------------------

print("\nCreating domain-aware train/test split...")

splitter = GroupShuffleSplit(
    n_splits=1,
    test_size=0.20,
    random_state=42,
)

train_idx, test_idx = next(
    splitter.split(X, y, groups=groups)
)

X_train = X.iloc[train_idx]
X_test = X.iloc[test_idx]

y_train = y.iloc[train_idx]
y_test = y.iloc[test_idx]

train_groups = groups.iloc[train_idx]
test_groups = groups.iloc[test_idx]

print(f"\nTraining rows: {len(X_train):,}")
print(f"Testing rows:  {len(X_test):,}")

print(f"Training domains: {train_groups.nunique():,}")
print(f"Testing domains:  {test_groups.nunique():,}")

overlap = set(train_groups.unique()) & set(test_groups.unique())

print(f"Domain overlap:   {len(overlap)}")

if overlap:
    print("\nWARNING: Domain overlap detected!")
else:
    print("\n✓ No domain overlap between training and testing sets.")

# ---------------------------------------------------------
# TRAIN TEMPORARY MODEL
# ---------------------------------------------------------

print("\nTraining temporary Random Forest...")

model = RandomForestClassifier(
    n_estimators=300,
    random_state=42,
    n_jobs=-1,
    class_weight="balanced",
)

model.fit(X_train, y_train)

print("Training complete.")

# ---------------------------------------------------------
# EVALUATION
# ---------------------------------------------------------

print("\nRunning evaluation...")

y_pred = model.predict(X_test)

accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred, zero_division=0)
recall = recall_score(y_test, y_pred, zero_division=0)
f1 = f1_score(y_test, y_pred, zero_division=0)

print("\n" + "=" * 70)
print("DOMAIN-AWARE RESULTS")
print("=" * 70)

print(f"Accuracy : {accuracy:.4f}")
print(f"Precision: {precision:.4f}")
print(f"Recall   : {recall:.4f}")
print(f"F1 Score : {f1:.4f}")

print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))

print("\nClassification Report:")
print(
    classification_report(
        y_test,
        y_pred,
        target_names=["legitimate", "phishing"],
        zero_division=0,
    )
)

print("\n" + "=" * 70)
print("COMPARISON WITH CURRENT RANDOM SPLIT")
print("=" * 70)

print("Current random split:")
print("  Accuracy : 0.9277")
print("  Precision: 0.8865")
print("  Recall   : 0.7789")
print("  F1 Score : 0.8292")

print("\nDomain-aware split:")
print(f"  Accuracy : {accuracy:.4f}")
print(f"  Precision: {precision:.4f}")
print(f"  Recall   : {recall:.4f}")
print(f"  F1 Score : {f1:.4f}")

print("\nNo model file was saved.")
print("Your existing phishing_model.pkl was NOT changed.")

print("\n" + "=" * 70)
print("DOMAIN-AWARE FEATURE IMPORTANCE")
print("=" * 70)

importance = pd.Series(
    model.feature_importances_,
    index=FEATURE_NAMES
).sort_values(ascending=False)

for name, value in importance.items():
    print(f"{name:30s} {value:.6f}")

print("\n" + "=" * 70)
print("DOMAIN-AWARE FEATURE IMPORTANCE")
print("=" * 70)

importance = pd.Series(
    model.feature_importances_,
    index=FEATURE_NAMES
).sort_values(ascending=False)

for name, value in importance.items():
    print(f"{name:30s} {value:.6f}")
