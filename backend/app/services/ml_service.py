"""
Machine Learning service for PhishGuard AI.

Loads the trained Random Forest model and provides
prediction functionality to the API layer.
"""


import json
import logging
import os
from pathlib import Path
from typing import Optional, Dict, Any, Tuple, Union

import joblib
import pandas as pd

from app.schemas.url_schemas import ModelInfo, URLFeatures
from app.services.feature_service import (
    extract_features,
    build_feature_vector,
    FEATURE_NAMES,
)

logger = logging.getLogger(__name__)



# MODULE-LEVEL MODEL STATE


_model = None
_model_loaded = False
_model_meta = {}



def _get_model_meta_path() -> Path:
    """Return the metadata file used to describe the current model artifact."""
    backend_root = Path(__file__).resolve().parents[2]
    configured_path = os.getenv("MODEL_META_PATH")

    if configured_path:
        model_meta_path = Path(configured_path)
        if not model_meta_path.is_absolute():
            model_meta_path = backend_root / model_meta_path
        return model_meta_path

    return backend_root / "model" / "phishing_model_meta.json"



def _load_model_metadata() -> Dict[str, Any]:
    """Load the current model metadata from disk when present."""
    global _model_meta

    meta_path = _get_model_meta_path()
    if not meta_path.exists():
        _model_meta = {}
        return _model_meta

    try:
        with meta_path.open("r", encoding="utf-8") as fh:
            _model_meta = json.load(fh)
    except Exception as exc:
        logger.warning("Model metadata could not be loaded from '%s': %s", meta_path, exc)
        _model_meta = {}

    return _model_meta


# MODEL LOADING


def _load_model() -> None:
    """
    Load the serialized Random Forest model from disk.
    """

    global _model, _model_loaded

    # Project root is:
    # PHISHGUARD-AI/backend
    backend_root = Path(__file__).resolve().parents[2]

    # Allow MODEL_PATH from environment variables.
    # Otherwise use the default model location.
    configured_path = os.getenv("MODEL_PATH")

    if configured_path:
        model_path = Path(configured_path)

        # If a relative path is provided,
        # interpret it relative to backend.
        if not model_path.is_absolute():
            model_path = backend_root / model_path

    else:
        model_path = (
            backend_root
            / "model"
            / "phishing_model.pkl"
        )

    if not model_path.exists():
        logger.warning(
            "ML model not found at '%s'. "
            "Application will run in "
            "'model not connected' mode.",
            model_path,
        )

        _model = None
        _model_loaded = False
        _model_meta = _load_model_metadata()
        return

    try:
        _model = joblib.load(model_path)
        _model_loaded = True
        _model_meta = _load_model_metadata()

        logger.info(
            "Random Forest model loaded successfully "
            "from '%s'.",
            model_path,
        )

    except Exception as exc:
        logger.error(
            "Failed to load ML model: %s",
            exc,
        )

        _model = None
        _model_loaded = False



# MODEL INFORMATION


def get_model_info() -> ModelInfo:
    """
    Return metadata about the current model state.
    """

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
    """
    Return True only when the model is loaded and ready.
    """

    return (
        _model_loaded
        and _model is not None
    )



# PREDICTION


def predict(
    url_or_features: Union[str, URLFeatures],
) -> Tuple[
    Optional[str],
    Optional[float],
    Optional[float],
]:
    """
    Run phishing inference on a URL string or a feature object.

    The model always expects the same canonical feature vector used in training,
    but callers may pass either the raw URL or an already-extracted URLFeatures
    payload. This keeps the prediction API resilient while preserving the actual
    live pipeline: the API sends the original URL string, not a serialized
    feature object.
    """

    if not is_model_ready():
        return None, None, None

    try:
        if isinstance(url_or_features, URLFeatures):
            feature_vector = build_feature_vector(url_or_features)
        elif isinstance(url_or_features, str):
            features = extract_features(url_or_features)
            feature_vector = build_feature_vector(features)
        else:
            raise TypeError(
                "predict() expects a URL string or URLFeatures object, "
                f"got {type(url_or_features).__name__}"
            )

        if len(feature_vector) != len(FEATURE_NAMES):
            raise ValueError(
                f"Feature mismatch: vector contains "
                f"{len(feature_vector)} values but "
                f"{len(FEATURE_NAMES)} feature names "
                f"were provided."
            )

        feature_df = pd.DataFrame(
            [feature_vector],
            columns=FEATURE_NAMES,
        )

        probabilities = _model.predict_proba(feature_df)[0]

        legitimate_prob = float(probabilities[0])
        phishing_prob = float(probabilities[1])

        default_threshold = float(_model_meta.get("threshold", 0.493))
        THRESHOLD = float(os.getenv("PREDICTION_THRESHOLD", str(default_threshold)))

        classification = (
            "phishing"
            if phishing_prob >= THRESHOLD
            else "legitimate"
        )

        confidence = float(max(probabilities))
        return (classification, phishing_prob, confidence)

    except Exception as exc:
        logger.error(
            "Prediction failed: %s",
            exc,
            exc_info=True,
        )

        return None, None, None



# MODEL METRICS


def get_model_metrics() -> Optional[Dict[str, Any]]:
    """
    Return the evaluation metrics of the current model from its saved metadata.
    """

    if not is_model_ready():
        return None

    metrics = _model_meta.get("test_metrics", {})
    threshold = _model_meta.get("threshold", 0.493)

    return {
        "accuracy": float(metrics.get("accuracy", 0.0)),
        "precision": float(metrics.get("precision", 0.0)),
        "recall": float(metrics.get("recall", 0.0)),
        "f1_score": float(metrics.get("f1", metrics.get("f1_score", 0.0))),
        "feature_count": int(_model_meta.get("feature_count", len(FEATURE_NAMES))),
        "threshold": float(threshold),
        "evaluation": "domain-aware split" if _model_meta else "unknown",
    }



# LOAD MODEL WHEN MODULE IS IMPORTED


_load_model()

