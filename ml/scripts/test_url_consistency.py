"""
PhishGuard AI — URL Structural Consistency Tests
=================================================

Proves that the following URL variants are handled consistently,
except for meaningful scheme-related features (has_https).

Test groups:
  - https://google.com
  - https://www.google.com
  - http://google.com
  - google.com/
  - google.com

These should produce identical features EXCEPT for has_https
(which is correctly 1 for https, 0 for http/no-scheme).

All other structural features must be consistent within each group.

Run:
    cd PHISHGUARD-AI/backend
    .venv/bin/python3 ../ml/scripts/test_url_consistency.py
"""

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from app.services.feature_service import (
    extract_features,
    build_feature_vector,
    FEATURE_NAMES,
)

PASS = "\033[92m✓\033[0m"
FAIL = "\033[91m✗\033[0m"

failures = []


def check(name: str, condition: bool, detail: str = "") -> None:
    if condition:
        print(f"  {PASS}  {name}")
    else:
        print(f"  {FAIL}  {name}  {detail}")
        failures.append(name)


def features_dict(url: str) -> dict:
    f = extract_features(url)
    v = build_feature_vector(f)
    return dict(zip(FEATURE_NAMES, v))


print("=" * 65)
print("URL STRUCTURAL CONSISTENCY TESTS")
print("=" * 65)

# ── Group 1: google.com variants ─────────────────────────────────────────────
print("\n[Group 1] google.com — scheme and trailing-slash variants")

g_https     = features_dict("https://google.com")
g_http      = features_dict("http://google.com")
g_bare      = features_dict("google.com")
g_bare_sl   = features_dict("google.com/")

# All non-HTTPS features must be identical across these four
non_scheme = [f for f in FEATURE_NAMES if f != "has_https"]

for feat in non_scheme:
    vals = {g_https[feat], g_http[feat], g_bare[feat], g_bare_sl[feat]}
    check(
        f"{feat} is consistent across http/https/bare",
        len(vals) == 1,
        f"values={vals}",
    )

# has_https must distinguish http from https
check(
    "has_https=1 for https://google.com",
    g_https["has_https"] == 1.0,
)
check(
    "has_https=0 for http://google.com",
    g_http["has_https"] == 0.0,
)
check(
    "has_https=0 for bare google.com",
    g_bare["has_https"] == 0.0,
)

# ── Group 2: www.google.com variants ─────────────────────────────────────────
print("\n[Group 2] www.google.com — scheme and trailing-slash variants")

wg_https    = features_dict("https://www.google.com")
wg_http     = features_dict("http://www.google.com")
wg_bare     = features_dict("www.google.com")
wg_bare_sl  = features_dict("www.google.com/")

for feat in non_scheme:
    vals = {wg_https[feat], wg_http[feat], wg_bare[feat], wg_bare_sl[feat]}
    check(
        f"{feat} is consistent across http/https/bare (www variant)",
        len(vals) == 1,
        f"values={vals}",
    )

check(
    "has_https=1 for https://www.google.com",
    wg_https["has_https"] == 1.0,
)
check(
    "has_https=0 for http://www.google.com",
    wg_http["has_https"] == 0.0,
)

# ── Group 3: google.com vs www.google.com — meaningful differences ────────────
print("\n[Group 3] google.com vs www.google.com — expected structural differences")

check(
    "subdomain_is_www=0 for google.com",
    g_https["subdomain_is_www"] == 0.0,
    f"got {g_https['subdomain_is_www']}",
)
check(
    "subdomain_is_www=1 for www.google.com",
    wg_https["subdomain_is_www"] == 1.0,
    f"got {wg_https['subdomain_is_www']}",
)
check(
    "subdomain_count=0 for google.com",
    g_https["subdomain_count"] == 0.0,
    f"got {g_https['subdomain_count']}",
)
check(
    "subdomain_count=1 for www.google.com",
    wg_https["subdomain_count"] == 1.0,
    f"got {wg_https['subdomain_count']}",
)
check(
    "non_www_subdomain_depth=0 for www.google.com (www is not suspicious)",
    wg_https["non_www_subdomain_depth"] == 0.0,
    f"got {wg_https['non_www_subdomain_depth']}",
)
check(
    "reg_domain_length same for google.com and www.google.com",
    g_https["reg_domain_length"] == wg_https["reg_domain_length"],
    f"{g_https['reg_domain_length']} vs {wg_https['reg_domain_length']}",
)
check(
    "hostname_label_count=2 for google.com",
    g_https["hostname_label_count"] == 2.0,
    f"got {g_https['hostname_label_count']}",
)
check(
    "hostname_label_count=3 for www.google.com",
    wg_https["hostname_label_count"] == 3.0,
    f"got {wg_https['hostname_label_count']}",
)

# ── Group 4: feature vector length ───────────────────────────────────────────
print("\n[Group 4] Feature vector integrity")

for url in [
    "https://google.com",
    "https://www.google.com",
    "http://google.com",
    "google.com/",
    "http://paypal-login.evil.tk/verify",
    "http://192.168.1.1/login",
]:
    v = build_feature_vector(extract_features(url))
    check(
        f"vector length == {len(FEATURE_NAMES)} for {url}",
        len(v) == len(FEATURE_NAMES),
        f"got {len(v)}",
    )
    check(
        f"all floats for {url}",
        all(isinstance(x, float) for x in v),
        f"non-float types: {[type(x) for x in v if not isinstance(x, float)]}",
    )
    check(
        f"no None in vector for {url}",
        all(x is not None for x in v),
    )

# ── Group 5: phishing URL structure ──────────────────────────────────────────
print("\n[Group 5] Phishing indicator features on known-suspicious URLs")

ph_paypal = features_dict("http://paypal-login-example.com/verify")
ph_ip     = features_dict("http://192.168.1.1/login")
ph_deep   = features_dict("http://www.paypal.com.fake-login.xyz/secure")

check(
    "has_suspicious_keywords=1 for paypal-login URL",
    ph_paypal["has_suspicious_keywords"] == 1.0,
    f"got {ph_paypal['has_suspicious_keywords']}",
)
check(
    "hyphen_count > 0 for paypal-login-example.com",
    ph_paypal["hyphen_count"] > 0,
    f"got {ph_paypal['hyphen_count']}",
)
check(
    "has_ip_address=1 for 192.168.1.1",
    ph_ip["has_ip_address"] == 1.0,
    f"got {ph_ip['has_ip_address']}",
)
check(
    "non_www_subdomain_depth > 0 for paypal.com.fake-login.xyz",
    ph_deep["non_www_subdomain_depth"] > 0,
    f"got {ph_deep['non_www_subdomain_depth']}",
)

# ── Summary ────────────────────────────────────────────────────────────────────
print()
print("=" * 65)
if failures:
    print(f"FAILED: {len(failures)} test(s)")
    for f in failures:
        print(f"  - {f}")
    sys.exit(1)
else:
    print(f"ALL TESTS PASSED ({len(FEATURE_NAMES)} features, all checks OK)")
print("=" * 65)
