"""
Feature extraction service for PhishGuard AI.

IMPORTANT — ARCHITECTURE NOTE:
This service currently extracts basic, safe URL-string features using Python's
standard library (urllib / re).  It does NOT make any network requests or visit
the submitted URL.

When the Random Forest model is trained you will replace / extend the
`extract_features()` function with the exact feature pipeline used during
training so that the feature vector fed to the model matches what it was
trained on.  The API layer and ML service do NOT need to change — just update
this file.
"""

import re
import math
from urllib.parse import urlparse, parse_qs
from typing import Optional, List

from app.schemas.url_schemas import URLFeatures


# Suspicious keywords often found in phishing URLs (not exhaustive —
# the final list should match what you used during Random Forest training).
SUSPICIOUS_KEYWORDS: List[str] = [
    "login", "signin", "verify", "secure", "account", "update",
    "banking", "confirm", "password", "paypal", "apple", "amazon",
    "microsoft", "google", "facebook", "support", "alert", "suspended",
    "unusual", "activity", "click", "free", "prize", "winner",
]


def _count_special_chars(url: str) -> int:
    """Count characters that are common in obfuscated phishing URLs."""
    special = re.findall(r"[%~!*'();:@&=+$,/?#\[\]{}\\|<>^`]", url)
    return len(special)


def _has_ip_address(hostname: str) -> bool:
    """Return True if the hostname looks like a raw IPv4 address."""
    ipv4_pattern = re.compile(
        r"^(\d{1,3}\.){3}\d{1,3}$"
    )
    return bool(ipv4_pattern.match(hostname or ""))


def _get_subdomain_count(hostname: str) -> int:
    """
    Count the number of sub-domains.
    e.g. 'a.b.example.com' → 2 subdomains ('a', 'b').
    """
    if not hostname:
        return 0
    parts = hostname.split(".")
    # Subtract the TLD and the second-level domain
    return max(0, len(parts) - 2)


def _find_suspicious_keywords(url: str) -> List[str]:
    url_lower = url.lower()
    return [kw for kw in SUSPICIOUS_KEYWORDS if kw in url_lower]


def extract_features(url: str) -> URLFeatures:
    """
    Parse the URL string and extract structural / lexical features.

    No network requests are made.  All analysis is purely string-based.

    Returns a URLFeatures instance.  When the ML model is connected,
    you should also return a raw numeric feature vector (list/dict) so
    that ml_service.predict() can consume it.  Add that as a separate
    helper function here once you know the exact feature set required.
    """
    try:
        parsed = urlparse(url)
    except Exception:
        # Malformed URL — return minimal features
        return URLFeatures(url_length=len(url))

    hostname: str = parsed.hostname or ""
    path: str = parsed.path or ""
    query: str = parsed.query or ""

    tld: Optional[str] = None
    if "." in hostname:
        tld = hostname.rsplit(".", 1)[-1]

    query_param_count = len(parse_qs(query)) if query else 0
    suspicious_kws = _find_suspicious_keywords(url)

    return URLFeatures(
        url_length=len(url),
        domain=hostname,
        domain_length=len(hostname),
        has_https=parsed.scheme.lower() == "https",
        has_ip_address=_has_ip_address(hostname),
        has_at_symbol="@" in url,
        hyphen_count=url.count("-"),
        dot_count=url.count("."),
        subdomain_count=_get_subdomain_count(hostname),
        path_length=len(path),
        query_params=query_param_count,
        special_char_count=_count_special_chars(url),
        has_suspicious_keywords=len(suspicious_kws) > 0,
        suspicious_keywords_found=suspicious_kws,
        tld=tld,
    )
