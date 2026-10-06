"""
Machine Learning service for PhishGuard AI.

Loads the trained Random Forest model and provides
prediction functionality to the API layer.
"""


import logging
import os
from pathlib import Path
from typing import Optional, Dict, Any, Tuple

import joblib
import pandas as pd

from app.schemas.url_schemas import ModelInfo
from app.services.feature_service import (
    extract_features,
    build_feature_vector,
    FEATURE_NAMES,
)

logger = logging.getLogger(__name__)



# MODULE-LEVEL MODEL STATE


_model = None
_model_loaded = False



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
        return

    try:
        _model = joblib.load(model_path)
        _model_loaded = True

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
    url: str,
) -> Tuple[
    Optional[str],
    Optional[float],
    Optional[float],
]:
    """
    Run phishing inference on a URL string.

    The URL goes through the exact same feature extraction
    pipeline used during model training.

    Returns:

        classification:
            "phishing" or "legitimate"

        risk_score:
            Probability of phishing from 0.0 to 1.0

        confidence:
            Probability of the predicted class
    """

    if not is_model_ready():
        return None, None, None

    try:
        
        # 1. Extract URL features
        

        features = extract_features(url)

        
        # 2. Build the exact 24-feature vector
        

        feature_vector = build_feature_vector(
            features
        )

        
        # 3. Safety check
        

        if len(feature_vector) != len(FEATURE_NAMES):
            raise ValueError(
                f"Feature mismatch: vector contains "
                f"{len(feature_vector)} values but "
                f"{len(FEATURE_NAMES)} feature names "
                f"were provided."
            )

        
        # 4. Create DataFrame
        

        feature_df = pd.DataFrame(
            [feature_vector],
            columns=FEATURE_NAMES,
        )

        
        # 5. Get model probabilities
        

        probabilities = _model.predict_proba(
            feature_df
        )[0]

        # Training labels:
        #
        # good -> 0
        # bad  -> 1

        legitimate_prob = float(
            probabilities[0]
        )

        phishing_prob = float(
            probabilities[1]
        )

        
        # 6. Classification
        # Threshold of 0.493 was selected on the domain-aware validation set
        # to maximise F1 while reducing false positives vs 0.5 default.
        

        THRESHOLD = float(os.getenv("PREDICTION_THRESHOLD", "0.493"))

        classification = (
            "phishing"
            if phishing_prob >= THRESHOLD
            else "legitimate"
        )

        
        # 7. Confidence
        

        confidence = float(
            max(probabilities)
        )

        return (
            classification,
            phishing_prob,
            confidence,
        )

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
    Return the evaluation metrics of the current
    24-feature Random Forest model.

    Metrics come from the latest training run.
    """

    if not is_model_ready():
        return None

    return {
        "accuracy": 0.9067,
        "precision": 0.8182,
        "recall": 0.7628,
        "f1_score": 0.7895,
        "feature_count": 31,
        "threshold": 0.493,
        "evaluation": "domain-aware split",
    }



# LOAD MODEL WHEN MODULE IS IMPORTED


_load_model()

