"""
URL orchestration service for PhishGuard AI.

Coordinates:
  1. Input validation / normalisation
  2. Feature extraction  (feature_service)
  3. ML inference        (ml_service)
  4. Response assembly
"""

import re
import logging
from datetime import datetime, timezone
from urllib.parse import urlparse
from typing import Tuple

from app.schemas.url_schemas import AnalyzeURLResponse, URLFeatures, ModelInfo
from app.services import feature_service, ml_service

logger = logging.getLogger(__name__)

# Minimal URL pattern — just enough to reject obviously non-URL strings.
_URL_PATTERN = re.compile(
    r"^(https?://)?"           # optional scheme
    r"([a-zA-Z0-9\-._~:/?#\[\]@!$&'()*+,;=%]+)"
    r"$",
    re.IGNORECASE,
)


def _normalise_url(url: str) -> str:
    """
    Ensure the URL has a scheme so urlparse can parse it correctly.
    If no scheme is present, assume https.
    """
    url = url.strip()
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    return url


def _is_valid_url(url: str) -> Tuple[bool, str]:
    """
    Validate URL structure without making any network request.

    Returns (is_valid, error_message).
    """
    if not url:
        return False, "URL cannot be empty."

    if len(url) > 2048:
        return False, "URL exceeds the maximum allowed length."

    if not _URL_PATTERN.match(url):
        return False, "URL contains invalid characters."

    try:
        parsed = urlparse(url)
        if not parsed.netloc:
            return False, "URL does not contain a valid domain."
    except Exception:
        return False, "URL could not be parsed."

    return True, ""


def analyze_url(raw_url: str) -> AnalyzeURLResponse:
    """
    Main analysis pipeline.

    Steps:
      1. Validate and normalise the URL string.
      2. Extract lexical/structural features (no network requests).
      3. Run ML inference (returns None values if model is not connected).
      4. Assemble and return a structured response.
    """
    # ── 1. Normalise ─────────────────────────────────────────────────────────
    url = _normalise_url(raw_url)

    # ── 2. Validate ──────────────────────────────────────────────────────────
    valid, error_msg = _is_valid_url(url)
    if not valid:
        logger.warning("Invalid URL submitted: %s — %s", raw_url, error_msg)
        return AnalyzeURLResponse(
            success=False,
            url=raw_url,
            status="error",
            message=error_msg,
            model=ml_service.get_model_info(),
            analyzed_at=datetime.now(timezone.utc),
        )

    # ── 3. Extract features ───────────────────────────────────────────────────
    try:
        features: URLFeatures = feature_service.extract_features(url)
    except Exception as exc:
        logger.error("Feature extraction failed for '%s': %s", url, exc)
        features = URLFeatures()

    # ── 4. ML Inference ──────────────────────────────────────────────────────
    try:
        classification, risk_score, confidence = ml_service.predict(features)
    except Exception as exc:
        logger.error("ML prediction failed for '%s': %s", url, exc)
        classification, risk_score, confidence = None, None, None

    # ── 5. Determine status ──────────────────────────────────────────────────
    if not ml_service.is_model_ready():
        status = "ml_not_connected"
        message = (
            "URL features extracted successfully. "
            "Machine learning model is not connected yet — "
            "classification and risk score will appear once the "
            "Random Forest model is integrated."
        )
    else:
        status = "analyzed"
        message = "Analysis complete."

    return AnalyzeURLResponse(
        success=True,
        url=url,
        status=status,
        classification=classification,
        risk_score=risk_score,
        confidence=confidence,
        features=features,
        explanations=[],       # Populated once SHAP is integrated
        model=ml_service.get_model_info(),
        analyzed_at=datetime.now(timezone.utc),
        message=message,
    )
