import os
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

from app.core.config import settings
from app.core.db import get_connection, initialize_database

ALLOWED_CLASSIFICATIONS = {"phishing", "legitimate"}
ALLOWED_REVIEW_DECISIONS = {"verified", "rejected"}


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _normalize_label(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    cleaned = str(value).strip().lower()
    if not cleaned:
        return None
    if cleaned not in ALLOWED_CLASSIFICATIONS:
        raise ValueError("Classification must be 'phishing' or 'legitimate'.")
    return cleaned


def _validate_url(url: str) -> str:
    cleaned = str(url).strip()
    if not cleaned:
        raise ValueError("URL must not be empty.")
    if len(cleaned) > settings.MAX_URL_LENGTH:
        raise ValueError("URL exceeds the maximum allowed length.")
    parsed = urlparse(cleaned if "//" in cleaned else f"https://{cleaned}")
    if not parsed.netloc:
        raise ValueError("URL does not contain a valid domain.")
    return cleaned


def initialize_feedback_store(db_path: Optional[str] = None) -> str:
    initialize_database(db_path)
    return str(get_connection(db_path).execute("SELECT 1").fetchone())


def is_admin_key_configured() -> bool:
    return bool((os.getenv("PHISHGUARD_ADMIN_KEY") or settings.ADMIN_API_KEY or "").strip())


def _require_admin_access(admin_key: Optional[str]) -> None:
    expected = (os.getenv("PHISHGUARD_ADMIN_KEY") or settings.ADMIN_API_KEY or "").strip()
    if not expected:
        raise PermissionError(
            "Review actions are disabled because no admin key is configured. Set PHISHGUARD_ADMIN_KEY in the backend environment."
        )
    if admin_key != expected:
        raise PermissionError("Invalid or missing admin key.")


def record_scan(
    *,
    url: str,
    classification: Optional[str],
    risk_score: Optional[float],
    confidence: Optional[float],
    model_version: Optional[str],
    status: str,
    db_path: Optional[str] = None,
) -> Dict[str, Any]:
    initialize_database(db_path)
    scan_id = uuid.uuid4().hex
    normalized_url = _validate_url(url)
    with get_connection(db_path) as connection:
        connection.execute(
            """
            INSERT INTO scans (
                scan_id, url, classification, risk_score, confidence, model_version, status, scanned_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                scan_id,
                normalized_url,
                classification,
                risk_score,
                confidence,
                model_version,
                status,
                _utc_now(),
            ),
        )
    return {
        "scan_id": scan_id,
        "url": normalized_url,
        "classification": classification,
        "risk_score": risk_score,
        "confidence": confidence,
        "model_version": model_version,
        "status": status,
        "scanned_at": _utc_now(),
    }


def list_scans(db_path: Optional[str] = None) -> List[Dict[str, Any]]:
    initialize_database(db_path)
    with get_connection(db_path) as connection:
        rows = connection.execute(
            "SELECT * FROM scans ORDER BY scanned_at DESC"
        ).fetchall()
    return [dict(row) for row in rows]


def submit_feedback(payload: Dict[str, Any], db_path: Optional[str] = None) -> Dict[str, Any]:
    initialize_database(db_path)
    if not isinstance(payload, dict):
        raise ValueError("Feedback payload must be a dictionary.")

    scan_id = str(payload.get("scan_id") or "").strip()
    if not scan_id:
        raise ValueError("A scan_id is required to submit feedback.")

    url = _validate_url(payload.get("url") or "")
    predicted_classification = _normalize_label(payload.get("predicted_classification"))
    suggested_classification = _normalize_label(payload.get("suggested_classification"))

    if predicted_classification is None and payload.get("predicted_classification") not in (None, ""):
        raise ValueError("predicted_classification must be 'phishing' or 'legitimate'.")

    predicted_risk_score = payload.get("predicted_risk_score")
    if predicted_risk_score is not None:
        try:
            predicted_risk_score = float(predicted_risk_score)
        except (TypeError, ValueError):
            raise ValueError("predicted_risk_score must be a numeric value between 0 and 1.")
        if not 0.0 <= predicted_risk_score <= 1.0:
            raise ValueError("predicted_risk_score must be between 0 and 1.")

    model_version = payload.get("model_version")
    if model_version is not None:
        model_version = str(model_version).strip() or None

    comment = payload.get("comment")
    if comment is not None:
        comment = str(comment).strip()
        if len(comment) > 2000:
            raise ValueError("Comment exceeds the maximum allowed length.")

    with get_connection(db_path) as connection:
        scan_record = connection.execute(
            "SELECT scan_id, url, classification, risk_score, model_version FROM scans WHERE scan_id = ?",
            (scan_id,),
        ).fetchone()
        if scan_record is None:
            raise ValueError("Feedback cannot be submitted for an unknown scan_id.")

        existing = connection.execute(
            "SELECT id FROM feedback WHERE scan_id = ?",
            (scan_id,),
        ).fetchone()
        if existing is not None:
            raise ValueError("Feedback has already been submitted for this scan.")

        feedback_id = uuid.uuid4().hex
        submitted_at = _utc_now()
        connection.execute(
            """
            INSERT INTO feedback (
                id, scan_id, url, predicted_classification, predicted_risk_score,
                model_version, suggested_classification, comment, status, submitted_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
            """,
            (
                feedback_id,
                scan_id,
                url,
                predicted_classification or scan_record["classification"],
                predicted_risk_score if predicted_risk_score is not None else scan_record["risk_score"],
                model_version or scan_record["model_version"],
                suggested_classification,
                comment,
                submitted_at,
            ),
        )

        row = connection.execute(
            "SELECT * FROM feedback WHERE id = ?",
            (feedback_id,),
        ).fetchone()

    return dict(row)


def list_feedback(db_path: Optional[str] = None, status: Optional[str] = None, search: Optional[str] = None) -> List[Dict[str, Any]]:
    initialize_database(db_path)
    query = "SELECT * FROM feedback"
    clauses: List[str] = []
    params: List[Any] = []

    if status:
        clauses.append("status = ?")
        params.append(status)

    if search:
        search_term = f"%{str(search).strip()}%"
        clauses.append("(url LIKE ? OR suggested_classification LIKE ? OR comment LIKE ?)")
        params.extend([search_term, search_term, search_term])

    if clauses:
        query += " WHERE " + " AND ".join(clauses)

    query += " ORDER BY submitted_at DESC"

    with get_connection(db_path) as connection:
        rows = connection.execute(query, params).fetchall()
    return [dict(row) for row in rows]


def get_feedback_summary(db_path: Optional[str] = None) -> Dict[str, int]:
    initialize_database(db_path)
    with get_connection(db_path) as connection:
        row = connection.execute(
            """
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
                SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) AS verified,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected
            FROM feedback
            """
        ).fetchone()
    return {
        "total": int(row["total"] or 0),
        "pending": int(row["pending"] or 0),
        "verified": int(row["verified"] or 0),
        "rejected": int(row["rejected"] or 0),
    }


def get_training_candidates(db_path: Optional[str] = None) -> List[Dict[str, Any]]:
    initialize_database(db_path)
    with get_connection(db_path) as connection:
        rows = connection.execute(
            "SELECT * FROM feedback WHERE status = 'verified' ORDER BY reviewed_at DESC"
        ).fetchall()
    return [dict(row) for row in rows]


def review_feedback(
    feedback_id: str,
    decision: str,
    *,
    admin_key: Optional[str] = None,
    reviewed_by: Optional[str] = None,
    review_note: Optional[str] = None,
    db_path: Optional[str] = None,
) -> Dict[str, Any]:
    initialize_database(db_path)
    normalized_decision = str(decision).strip().lower()
    if normalized_decision not in ALLOWED_REVIEW_DECISIONS:
        raise ValueError("Review decision must be 'verified' or 'rejected'.")

    _require_admin_access(admin_key)

    with get_connection(db_path) as connection:
        row = connection.execute(
            "SELECT * FROM feedback WHERE id = ?",
            (feedback_id,),
        ).fetchone()
        if row is None:
            raise ValueError("Feedback record not found.")

        review_note_clean = (review_note or "").strip()[:1000]
        reviewed_by_clean = (reviewed_by or "admin").strip()[:200]
        reviewed_at = _utc_now()

        connection.execute(
            """
            UPDATE feedback
            SET status = ?, reviewed_at = ?, reviewed_by = ?, review_note = ?
            WHERE id = ?
            """,
            (
                normalized_decision,
                reviewed_at,
                reviewed_by_clean,
                review_note_clean,
                feedback_id,
            ),
        )

        updated = connection.execute(
            "SELECT * FROM feedback WHERE id = ?",
            (feedback_id,),
        ).fetchone()
    return dict(updated)


def get_improvement_status(db_path: Optional[str] = None) -> Dict[str, Any]:
    initialize_database(db_path)
    summary = get_feedback_summary(db_path)
    training_candidates = get_training_candidates(db_path)
    return {
        "status": "feedback_collection_only",
        "feedback_total": summary["total"],
        "verified_examples": summary["verified"],
        "pending_review": summary["pending"],
        "last_training_date": None,
        "active_model_version": "1.0.0",
        "candidate_model_version": None,
        "candidate_model_ready": False,
        "training_ready": len(training_candidates) > 0,
        "message": "Feedback collected; model retraining has not been performed.",
    }
