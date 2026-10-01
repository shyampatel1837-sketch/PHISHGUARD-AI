"""
Machine Learning service for PhishGuard AI.

ARCHITECTURE NOTE:
This module provides a clean, stable interface between the API layer and the
ML model.  The API and frontend do NOT need to change when the Random Forest
is integrated — only this file needs updating.

FUTURE INTEGRATION STEPS:
1. Train your Random Forest on the phishing dataset.
2. Serialise the model:
       import joblib
       joblib.dump(model, "model/phishing_model.pkl")
3. In `_load_model()` below, uncomment the joblib.load() call.
4. In `predict()`, replace the "not connected" return with actual inference.
5. The rest of the system (API, feature service, frontend) stays unchanged.
"""

import os
import logging
from typing import Optional, Dict, Any, Tuple

from app.schemas.url_schemas import URLFeatures, ModelInfo

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Module-level model state
# ---------------------------------------------------------------------------

_model = None          # Holds the loaded sklearn model once integrated
_model_loaded = False  # True only when the model file was successfully loaded


def _load_model() -> None:
    """
    Attempt to load the serialised Random Forest model from disk.

    Called once at application startup.  Safe to call multiple times —
    it is a no-op if the model is already loaded.
    """
    global _model, _model_loaded

    model_path = os.getenv("MODEL_PATH", "model/phishing_model.pkl")

    if not os.path.exists(model_path):
        logger.info(
            "ML model not found at '%s'. "
            "The application will run in 'model not connected' mode.",
            model_path,
        )
        return

    try:
        # ── Uncomment the lines below once the model file exists ──────────
        # import joblib
        # _model = joblib.load(model_path)
        # _model_loaded = True
        # logger.info("Random Forest model loaded successfully from '%s'.", model_path)
        # ──────────────────────────────────────────────────────────────────
        pass
    except Exception as exc:
        logger.error("Failed to load ML model: %s", exc)
        _model = None
        _model_loaded = False


def get_model_info() -> ModelInfo:
    """Return metadata about the current model state."""
    if _model_loaded and _model is not None:
        return ModelInfo(
            name="PhishGuard Random Forest",
            version="1.0.0",
            status="loaded",
            algorithm="Random Forest",
        )
    return ModelInfo(
        name=None,
        version=None,
        status="not_connected",
        algorithm="Random Forest (pending)",
        trained_on=None,
    )


def is_model_ready() -> bool:
    """Return True only when the model is loaded and ready for inference."""
    return _model_loaded and _model is not None


def predict(features: URLFeatures) -> Tuple[Optional[str], Optional[float], Optional[float]]:
    """
    Run phishing inference on the extracted URL features.

    Parameters
    ----------
    features : URLFeatures
        Feature object returned by feature_service.extract_features().

    Returns
    -------
    classification : str | None
        "phishing" or "legitimate" — None when model is not connected.
    risk_score : float | None
        Probability of phishing (0.0–1.0) — None when model is not connected.
    confidence : float | None
        Model confidence — None when model is not connected.

    FUTURE IMPLEMENTATION:
    When the Random Forest is integrated, replace the body below with:

        feature_vector = _build_feature_vector(features)   # define this helper
        prob = _model.predict_proba([feature_vector])[0]   # shape: (n_classes,)
        phishing_prob = float(prob[1])
        classification = "phishing" if phishing_prob >= 0.5 else "legitimate"
        confidence = max(prob)
        return classification, phishing_prob, float(confidence)
    """
    if not is_model_ready():
        # Model not connected — return explicit None values so the API and
        # frontend can display the appropriate "ML not connected" state.
        return None, None, None

    # ── Placeholder for future inference ─────────────────────────────────────
    # This path is unreachable until _model_loaded is True.
    raise RuntimeError("Model is marked loaded but predict() has no implementation yet.")


def get_model_metrics() -> Optional[Dict[str, Any]]:
    """
    Return training-time evaluation metrics.

    Populate this once you have run model evaluation (accuracy, precision,
    recall, F1, confusion matrix) and saved them alongside the .pkl file.
    """
    if not is_model_ready():
        return None
    # Return dict of metrics once model is integrated, e.g.:
    # return {"accuracy": 0.97, "precision": 0.96, ...}
    return None


# Initialise (attempt model load) when this module is first imported.
_load_model()
