"""
API route definitions for PhishGuard AI.

All routes are mounted under /api in main.py.
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import JSONResponse

from app.schemas.url_schemas import (
    AnalyzeURLRequest,
    AnalyzeURLResponse,
    HealthResponse,
    StatisticsResponse,
    ScansResponse,
    ModelStatusResponse,
    ModelInfo,
)
from app.services import url_service, ml_service, feedback_service
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


# ── Health ────────────────────────────────────────────────────────────────────

@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
    tags=["System"],
)
async def health_check():
    """Returns the service status and current ML model state."""
    return HealthResponse(
        status="ok",
        version=settings.APP_VERSION,
        model_status=ml_service.get_model_info().status,
    )


# ── URL Analysis ──────────────────────────────────────────────────────────────

@router.post(
    "/analyze",
    response_model=AnalyzeURLResponse,
    summary="Analyse a URL for phishing indicators",
    tags=["Analysis"],
)
async def analyze_url(request: AnalyzeURLRequest):
    """
    Accepts a URL string, extracts structural features, and (when the ML model
    is connected) returns a phishing classification with risk score.

    **Important:** This endpoint never visits the submitted URL.
    All analysis is performed on the URL string only.
    """
    try:
        result = url_service.analyze_url(request.url)
        return result
    except Exception as exc:
        logger.error("Unexpected error during URL analysis: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during analysis. Please try again.",
        )


# ── Scan History ──────────────────────────────────────────────────────────────

@router.get(
    "/scans",
    response_model=ScansResponse,
    summary="Retrieve scan history",
    tags=["History"],
)
async def get_scans():
    """
    Returns historical scan records.

    A database / scan store has not been connected yet.
    This endpoint returns an empty list with an explanatory message.
    Once a database is integrated, populate and return real ScanRecord objects.
    """
    return ScansResponse(
        success=True,
        scans=[],
        total=0,
        message="Scan history is not available yet — database integration is pending.",
    )


# ── Statistics ────────────────────────────────────────────────────────────────

@router.get(
    "/statistics",
    response_model=StatisticsResponse,
    summary="Aggregate detection statistics",
    tags=["Analytics"],
)
async def get_statistics():
    """
    Returns aggregate statistics (total scans, phishing detected, etc.).

    Returns null values until a database / analytics store is connected.
    """
    return StatisticsResponse(
        total_scans=None,
        phishing_detected=None,
        legitimate_urls=None,
        detection_accuracy=None,
        message="Statistics are unavailable — database integration is pending.",
    )


# ── ML Model Status ───────────────────────────────────────────────────────────

@router.get(
    "/model/status",
    response_model=ModelStatusResponse,
    summary="ML model connection status",
    tags=["Model"],
)
async def get_model_status():
    """
    Returns the current state of the ML model.

    Connected = False until the Random Forest .pkl file is placed at the
    configured MODEL_PATH and ml_service._load_model() loads it successfully.
    """
    model_info = ml_service.get_model_info()
    metrics = ml_service.get_model_metrics()
    connected = ml_service.is_model_ready()

    return ModelStatusResponse(
        connected=connected,
        status=model_info.status,
        model=model_info,
        metrics=metrics,
        message=(
            "Model loaded and ready for inference."
            if connected
            else (
                "The Random Forest model is not connected yet. "
                "Train the model, serialise it with joblib, and place the .pkl "
                "file at the configured MODEL_PATH to enable predictions."
            )
        ),
    )


@router.post(
    "/model/predict",
    summary="Direct model prediction (future endpoint)",
    tags=["Model"],
)
async def model_predict(request: AnalyzeURLRequest):
    """
    Direct prediction endpoint — mirrors /analyze but intended for programmatic
    access once the model is connected.

    Currently returns the same 'ml_not_connected' response as /analyze.
    """
    try:
        result = url_service.analyze_url(request.url)
        return result
    except Exception as exc:
        logger.error("Unexpected error in /model/predict: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred.",
        )


# ── Feedback ────────────────────────────────────────────────────────────────

@router.post(
    "/feedback",
    summary="Submit feedback for a scan result",
    tags=["Feedback"],
)
async def submit_feedback(payload: dict):
    try:
        item = feedback_service.submit_feedback(payload)
        return {"success": True, "data": item}
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        logger.exception("Feedback submission failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Feedback submission failed.",
        )


@router.get(
    "/feedback",
    summary="List feedback submissions",
    tags=["Feedback"],
)
async def list_feedback(
    status: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
):
    try:
        items = feedback_service.list_feedback(status=status, search=search)
        summary = feedback_service.get_feedback_summary()
        return {"success": True, "items": items, "summary": summary}
    except Exception as exc:
        logger.exception("Feedback listing failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load feedback records.",
        )


@router.post(
    "/feedback/review",
    summary="Review a feedback submission",
    tags=["Feedback"],
)
async def review_feedback(payload: dict):
    feedback_id = payload.get("feedback_id")
    decision = payload.get("decision")
    admin_key = payload.get("admin_key")
    reviewed_by = payload.get("reviewed_by")
    review_note = payload.get("review_note")

    if not feedback_id or not decision:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="feedback_id and decision are required.",
        )

    try:
        item = feedback_service.review_feedback(
            str(feedback_id),
            str(decision),
            admin_key=admin_key,
            reviewed_by=reviewed_by,
            review_note=review_note,
        )
        return {"success": True, "data": item}
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        logger.exception("Feedback review failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to review feedback.",
        )


@router.get(
    "/feedback/improvement-status",
    summary="Get improvement pipeline status",
    tags=["Feedback"],
)
async def improvement_status():
    try:
        return {"success": True, "data": feedback_service.get_improvement_status()}
    except Exception as exc:
        logger.exception("Improvement status lookup failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load improvement status.",
        )
