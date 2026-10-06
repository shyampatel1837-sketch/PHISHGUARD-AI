"""
Feature extraction service for PhishGuard AI.

IMPORTANT:
- Performs only safe, local URL-string analysis.
- Does NOT visit URLs.
- Does NOT make network requests.
- Does NOT crawl websites.

The exact same feature pipeline is used during:
1. Random Forest training
2. Live prediction

FEATURE VECTOR CONTRACT
-----------------------
Feature count: 31  (24 original + 7 hostname-level features added in v2)

The order below MUST match build_feature_vector().
If the features change, the Random Forest model must be retrained.
"""

import math
import re
from collections import Counter
from typing import List

from urllib.parse import parse_qs, urlparse

import tldextract

from app.schemas.url_schemas import URLFeatures



# FEATURE NAMES


FEATURE_NAMES: List[str] = [
    # Original structural features
    "url_length",
    "domain_length",
    "has_https",
    "has_ip_address",
    "has_at_symbol",
    "hyphen_count",
    "dot_count",
    "subdomain_count",
    "path_length",
    "query_params",
    "special_char_count",
    "has_suspicious_keywords",

    # Additional lexical / structural features
    "digit_count",
    "letter_count",
    "digit_letter_ratio",
    "url_entropy",
    "domain_entropy",
    "path_depth",
    "query_length",
    "double_slash_count",
    "percent_encoding_count",
    "has_suspicious_tld",
    "domain_has_digits",
    "longest_domain_label",

    # Hostname-level features (v2 — added to improve generalisation)
    "subdomain_is_www",          # 1 if subdomain is exactly 'www'
    "non_www_subdomain_depth",   # non-www subdomain label count
    "reg_domain_length",         # registrable domain token length only
    "hostname_label_count",      # total dot-labels in hostname
    "digit_ratio_hostname",      # digit chars / hostname length
    "path_domain_count",         # embedded domain-like tokens in path
    "vowel_ratio_reg_domain",    # vowels / registrable domain length
]



# SUSPICIOUS KEYWORDS


SUSPICIOUS_KEYWORDS: List[str] = [
    "login",
    "signin",
    "verify",
    "secure",
    "account",
    "update",
    "banking",
    "confirm",
    "password",
    "support",
    "alert",
    "suspended",
    "unusual",
    "activity",
    "click",
    "free",
    "prize",
    "winner",
]



# SUSPICIOUS TLDs


# These are only signals.
# A suspicious TLD does NOT automatically mean phishing.

SUSPICIOUS_TLDS = {
    "tk",
    "ml",
    "ga",
    "cf",
    "gq",
    "top",
    "xyz",
    "click",
    "link",
    "work",
    "support",
    "zip",
}



# HELPER FUNCTIONS


def _count_special_chars(url: str) -> int:
    """
    Count characters commonly associated with URL obfuscation
    or complex URL structures.
    """

    special = re.findall(
        r"[%~!*'();:@&=+$,/?#\[\]{}\\|<>^`]",
        url,
    )

    return len(special)


def _has_ip_address(hostname: str) -> bool:
    """
    Return True if the hostname looks like an IPv4 address.
    """

    ipv4_pattern = re.compile(
        r"^(\d{1,3}\.){3}\d{1,3}$"
    )

    return bool(ipv4_pattern.match(hostname or ""))


def _get_subdomain_count(hostname: str) -> int:
    """
    Count subdomains.

    Example:
        a.b.example.com -> 2 subdomains
    """

    if not hostname:
        return 0

    parts = hostname.split(".")

    # Remove:
    # 1 = TLD
    # 1 = second-level domain
    return max(0, len(parts) - 2)


def _find_suspicious_keywords(url: str) -> List[str]:
    """
    Find suspicious keywords present in the URL.

    Result:
        [] = no suspicious keywords
        [...] = one or more suspicious keywords
    """

    url_lower = url.lower()

    return [
        keyword
        for keyword in SUSPICIOUS_KEYWORDS
        if keyword in url_lower
    ]


def _calculate_entropy(value: str) -> float:
    """
    Calculate Shannon entropy of a string.

    Higher entropy can indicate a more random or obfuscated
    string, although entropy alone is not evidence of phishing.
    """

    if not value:
        return 0.0

    counts = Counter(value)
    length = len(value)

    entropy = 0.0

    for count in counts.values():
        probability = count / length
        entropy -= probability * math.log2(probability)

    return entropy


def _count_percent_encoding(value: str) -> int:
    """
    Count percent-encoded characters.

    Examples:
        %20
        %3A
        %2F
    """

    return len(
        re.findall(
            r"%[0-9A-Fa-f]{2}",
            value,
        )
    )


def _get_path_depth(path: str) -> int:
    """
    Count non-empty path segments.

    Examples:
        /login              -> 1
        /user/account/login -> 3
        /                   -> 0
    """

    if not path or path == "/":
        return 0

    return len(
        [
            part
            for part in path.split("/")
            if part
        ]
    )


def _has_suspicious_tld(hostname: str) -> bool:
    """
    Check whether the hostname ends with a configured
    suspicious TLD.

    This is only a feature and does NOT automatically
    classify a URL as phishing.
    """

    if "." not in hostname:
        return False

    tld = hostname.rsplit(".", 1)[-1].lower()

    return tld in SUSPICIOUS_TLDS


def _get_longest_domain_label(hostname: str) -> int:
    """
    Return the length of the longest domain label.

    Example:
        secure-login.example.com

        secure-login -> 12
        example      -> 7
        com          -> 3

        result -> 12
    """

    if not hostname:
        return 0

    labels = hostname.split(".")

    return max(
        (len(label) for label in labels),
        default=0,
    )



# HOSTNAME-LEVEL FEATURES (v2)


def _get_subdomain_is_www(subdomain: str) -> int:
    """
    Return 1 if the only subdomain present is exactly 'www', else 0.

    Distinguishes the innocuous www prefix from all other subdomains.
    """
    return int(subdomain.lower() == "www")


def _get_non_www_subdomain_depth(subdomain: str) -> int:
    """
    Count subdomain labels that are NOT 'www'.

    Examples:
        www              -> 0  (www only, not suspicious)
        docs             -> 1  (one non-www label)
        paypal.com.login -> 3  (impersonation chain)
        (empty)          -> 0
    """
    if not subdomain:
        return 0
    labels = [s for s in subdomain.split(".") if s]
    return len([s for s in labels if s.lower() != "www"])


def _get_reg_domain_length(reg_domain: str) -> int:
    """
    Return the length of the registrable domain token
    (the part between the last TLD dot and the first subdomain dot).

    Computed via tldextract so 'co.uk' compound TLDs are handled.

    Example:
        www.paypal.com.evil.tk -> 'evil' (length 4)
        www.google.com         -> 'google' (length 6)
    """
    return len(reg_domain)


def _get_hostname_label_count(hostname: str) -> int:
    """
    Count the total number of dot-separated labels in the hostname.

    Example:
        google.com          -> 2
        www.google.com      -> 3
        a.b.c.example.com   -> 5
    """
    if not hostname:
        return 0
    return len(hostname.split("."))


def _get_digit_ratio_hostname(hostname: str) -> float:
    """
    Ratio of digit characters to total hostname length.

    Phishing hostnames frequently embed numeric tokens to avoid
    detection (e.g., '1ogin.bank-secure1.com').
    """
    if not hostname:
        return 0.0
    digits = sum(c.isdigit() for c in hostname)
    return digits / len(hostname)


def _get_path_domain_count(path: str) -> int:
    """
    Count token sequences in the URL path that look like embedded domains
    (word.tld where tld is 2+ alpha characters).

    Detects impersonation patterns such as:
        /secure/www.paypal.com/login
        /redirect?url=google.com
    """
    return len(
        re.findall(r"[a-z0-9\-]+\.[a-z]{2,}", path.lower())
    )


def _get_vowel_ratio_reg_domain(reg_domain: str) -> float:
    """
    Ratio of vowel characters in the registrable domain token.

    Algorithmically generated or random-looking domain names tend to
    have low vowel ratios (e.g., 'xc2fg', 'fqafb').
    Genuine brand names tend to be pronounceable (google, youtube, amazon).
    """
    if not reg_domain:
        return 0.0
    vowels = sum(c in "aeiou" for c in reg_domain.lower())
    return vowels / len(reg_domain)



# URL CANONICALIZATION


def _canonicalize_url(
    original_url: str,
    hostname: str,
    path: str,
    query: str,
) -> tuple[str, str]:
    """
    Create a consistent structural representation of a URL.

    The dataset commonly contains URLs such as:

        google.com
        google.com/

    while the live application receives:

        https://google.com
        http://google.com

    These should represent the same structural URL.

    Therefore, if a URL has no path, we normalize the path
    to "/" for feature calculation.

    HTTPS is NOT included here because it is already represented
    separately by the has_https feature.
    """

    # Domain-only URL:
    # google.com
    # https://google.com
    # http://google.com
    #
    # All become:
    # google.com/
    if not path:
        path = "/"

    canonical_url = hostname + path

    if query:
        canonical_url += "?" + query

    return canonical_url, path



# MAIN FEATURE EXTRACTION


def extract_features(url: str) -> URLFeatures:
    """
    Parse a URL string and extract structural and lexical features.

    IMPORTANT:
    - No network requests are made.
    - No URL is opened.
    - No website is visited.

    URL normalization:
        https://google.com
        http://google.com
        google.com
        google.com/

    are structurally represented as:

        google.com/

    while has_https is calculated separately.
    """

    try:
        # ----------------------------------------------------
        # 1. Clean input
        # ----------------------------------------------------

        original_url = str(url).strip()

        # ----------------------------------------------------
        # 2. Detect HTTPS BEFORE removing the scheme
        # ----------------------------------------------------

        has_https = bool(
            re.match(
                r"^https://",
                original_url,
                re.IGNORECASE,
            )
        )

        # ----------------------------------------------------
        # 3. Remove HTTP / HTTPS scheme
        # ----------------------------------------------------

        normalized_url = re.sub(
            r"^https?://",
            "",
            original_url,
            flags=re.IGNORECASE,
        ).strip()

        # ----------------------------------------------------
        # 4. Parse URL safely
        # ----------------------------------------------------

        # Add temporary scheme so urllib can correctly
        # identify the hostname when the original URL
        # has no scheme.
        url_for_parsing = "http://" + normalized_url

        parsed = urlparse(url_for_parsing)

    except Exception:
        # Safe fallback if parsing fails.
        return URLFeatures(
            url_length=len(str(url).strip())
        )

    # --------------------------------------------------------
    # 5. Parsed components
    # --------------------------------------------------------

    hostname = parsed.hostname or ""
    path = parsed.path or ""
    query = parsed.query or ""

    # --------------------------------------------------------
    # 5b. Registrable domain extraction (for v2 features)
    # --------------------------------------------------------

    _ext = tldextract.extract(url_for_parsing)
    reg_domain = _ext.domain or ""
    subdomain  = _ext.subdomain or ""

    # --------------------------------------------------------
    # 6. Canonical structural representation
    # --------------------------------------------------------

    canonical_url, path = _canonicalize_url(
        original_url=original_url,
        hostname=hostname,
        path=path,
        query=query,
    )

    # --------------------------------------------------------
    # 7. Suspicious keywords
    # --------------------------------------------------------

    suspicious_keywords = _find_suspicious_keywords(
        canonical_url
    )

    # --------------------------------------------------------
    # 8. Lexical features
    # --------------------------------------------------------

    digit_count = sum(
        character.isdigit()
        for character in canonical_url
    )

    letter_count = sum(
        character.isalpha()
        for character in canonical_url
    )

    digit_letter_ratio = (
        digit_count / letter_count
        if letter_count > 0
        else 0.0
    )

    # Entropy now uses the same canonical representation
    # during both training and live prediction.
    url_entropy = _calculate_entropy(
        canonical_url
    )

    domain_entropy = _calculate_entropy(
        hostname
    )

    # --------------------------------------------------------
    # 9. Path features
    # --------------------------------------------------------

    path_depth = _get_path_depth(
        path
    )

    query_length = len(query)

    # --------------------------------------------------------
    # 10. URL structural features
    # --------------------------------------------------------

    double_slash_count = canonical_url.count("//")

    percent_encoding_count = _count_percent_encoding(
        canonical_url
    )

    suspicious_tld = _has_suspicious_tld(
        hostname
    )

    domain_has_digits = any(
        character.isdigit()
        for character in hostname
    )

    longest_domain_label = _get_longest_domain_label(
        hostname
    )

    # ========================================================
    # RETURN FEATURE OBJECT
    # ========================================================

    return URLFeatures(
        # ----------------------------------------------------
        # Original 12 features
        # ----------------------------------------------------

        url_length=len(canonical_url),

        domain=hostname,

        domain_length=len(hostname),

        has_https=1 if has_https else 0,

        has_ip_address=(
            1
            if _has_ip_address(hostname)
            else 0
        ),

        has_at_symbol=(
            1
            if "@" in canonical_url
            else 0
        ),

        hyphen_count=canonical_url.count("-"),

        dot_count=canonical_url.count("."),

        subdomain_count=_get_subdomain_count(
            hostname
        ),

        path_length=len(path),

        query_params=len(
            parse_qs(query)
        ),

        special_char_count=_count_special_chars(
            canonical_url
        ),

        has_suspicious_keywords=(
            1
            if suspicious_keywords
            else 0
        ),

        suspicious_keywords_found=suspicious_keywords,

        tld=(
            hostname.split(".")[-1]
            if "." in hostname
            else ""
        ),

        # ----------------------------------------------------
        # Additional 12 features
        # ----------------------------------------------------

        digit_count=digit_count,

        letter_count=letter_count,

        digit_letter_ratio=digit_letter_ratio,

        url_entropy=url_entropy,

        domain_entropy=domain_entropy,

        path_depth=path_depth,

        query_length=query_length,

        double_slash_count=double_slash_count,

        percent_encoding_count=percent_encoding_count,

        has_suspicious_tld=(
            1
            if suspicious_tld
            else 0
        ),

        domain_has_digits=(
            1
            if domain_has_digits
            else 0
        ),

        longest_domain_label=longest_domain_label,

        # ----------------------------------------------------
        # Hostname-level features (v2)
        # ----------------------------------------------------

        subdomain_is_www=_get_subdomain_is_www(subdomain),

        non_www_subdomain_depth=_get_non_www_subdomain_depth(subdomain),

        reg_domain_length=_get_reg_domain_length(reg_domain),

        hostname_label_count=_get_hostname_label_count(hostname),

        digit_ratio_hostname=_get_digit_ratio_hostname(hostname),

        path_domain_count=_get_path_domain_count(path),

        vowel_ratio_reg_domain=_get_vowel_ratio_reg_domain(reg_domain),
    )



# FEATURE VECTOR


def build_feature_vector(
    features: URLFeatures,
) -> List[float]:
    """
    Convert URLFeatures into the exact numeric feature vector
    used by both training and prediction.

    IMPORTANT:
    The order MUST exactly match FEATURE_NAMES.
    """

    return [
        # ----------------------------------------------------
        # Original 12 features
        # ----------------------------------------------------

        float(features.url_length),

        float(features.domain_length),

        float(features.has_https),

        float(features.has_ip_address),

        float(features.has_at_symbol),

        float(features.hyphen_count),

        float(features.dot_count),

        float(features.subdomain_count),

        float(features.path_length),

        float(features.query_params),

        float(features.special_char_count),

        float(features.has_suspicious_keywords),

        # ----------------------------------------------------
        # Additional 12 features
        # ----------------------------------------------------

        float(features.digit_count),

        float(features.letter_count),

        float(features.digit_letter_ratio),

        float(features.url_entropy),

        float(features.domain_entropy),

        float(features.path_depth),

        float(features.query_length),

        float(features.double_slash_count),

        float(features.percent_encoding_count),

        float(features.has_suspicious_tld),

        float(features.domain_has_digits),

        float(features.longest_domain_label),

        # ----------------------------------------------------
        # Hostname-level features (v2)
        # ----------------------------------------------------

        float(features.subdomain_is_www        or 0),
        float(features.non_www_subdomain_depth  or 0),
        float(features.reg_domain_length        or 0),
        float(features.hostname_label_count     or 0),
        float(features.digit_ratio_hostname     or 0.0),
        float(features.path_domain_count        or 0),
        float(features.vowel_ratio_reg_domain   or 0.0),
    ]