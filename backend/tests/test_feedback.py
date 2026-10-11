import pytest

from app.services.feedback_service import (
    get_feedback_summary,
    initialize_feedback_store,
    list_feedback,
    record_scan,
    review_feedback,
    submit_feedback,
)


@pytest.fixture
def feedback_db(tmp_path):
    db_path = tmp_path / "feedback.db"
    initialize_feedback_store(str(db_path))
    return str(db_path)


def test_feedback_submission_and_storage(feedback_db):
    scan = record_scan(
        url="https://www.google.com",
        classification="legitimate",
        risk_score=0.02,
        confidence=0.98,
        model_version="1.0.0",
        status="analyzed",
        db_path=feedback_db,
    )

    feedback = submit_feedback(
        {
            "scan_id": scan["scan_id"],
            "url": "https://www.google.com",
            "predicted_classification": "legitimate",
            "predicted_risk_score": 0.02,
            "model_version": "1.0.0",
            "suggested_classification": "legitimate",
            "comment": "Looks correct.",
        },
        db_path=feedback_db,
    )

    assert feedback["status"] == "pending"
    assert feedback["scan_id"] == scan["scan_id"]
    assert list_feedback(db_path=feedback_db)[0]["scan_id"] == scan["scan_id"]


def test_duplicate_submission_for_same_scan_is_rejected(feedback_db):
    scan = record_scan(
        url="https://example.com",
        classification="phishing",
        risk_score=0.81,
        confidence=0.9,
        model_version="1.0.0",
        status="analyzed",
        db_path=feedback_db,
    )

    submit_feedback(
        {
            "scan_id": scan["scan_id"],
            "url": "https://example.com",
            "predicted_classification": "phishing",
            "predicted_risk_score": 0.81,
            "model_version": "1.0.0",
            "suggested_classification": "legitimate",
        },
        db_path=feedback_db,
    )

    with pytest.raises(ValueError):
        submit_feedback(
            {
                "scan_id": scan["scan_id"],
                "url": "https://example.com",
                "predicted_classification": "phishing",
                "predicted_risk_score": 0.81,
                "model_version": "1.0.0",
                "suggested_classification": "legitimate",
            },
            db_path=feedback_db,
        )


def test_invalid_submission_is_validated(feedback_db):
    with pytest.raises(ValueError):
        submit_feedback(
            {
                "scan_id": "",
                "url": "not a url",
                "predicted_classification": "unknown",
                "model_version": "1.0.0",
            },
            db_path=feedback_db,
        )


def test_feedback_review_requires_admin_key(feedback_db):
    scan = record_scan(
        url="https://www.microsoft.com",
        classification="phishing",
        risk_score=0.7,
        confidence=0.88,
        model_version="1.0.0",
        status="analyzed",
        db_path=feedback_db,
    )

    feedback = submit_feedback(
        {
            "scan_id": scan["scan_id"],
            "url": "https://www.microsoft.com",
            "predicted_classification": "phishing",
            "predicted_risk_score": 0.7,
            "model_version": "1.0.0",
            "suggested_classification": "legitimate",
        },
        db_path=feedback_db,
    )

    with pytest.raises(PermissionError):
        review_feedback(
            feedback["id"],
            "verified",
            db_path=feedback_db,
            admin_key=None,
        )


def test_verified_feedback_is_available_for_training_only(feedback_db):
    scan = record_scan(
        url="https://www.amazon.com",
        classification="phishing",
        risk_score=0.76,
        confidence=0.8,
        model_version="1.0.0",
        status="analyzed",
        db_path=feedback_db,
    )

    feedback = submit_feedback(
        {
            "scan_id": scan["scan_id"],
            "url": "https://www.amazon.com",
            "predicted_classification": "phishing",
            "predicted_risk_score": 0.76,
            "model_version": "1.0.0",
            "suggested_classification": "legitimate",
        },
        db_path=feedback_db,
    )

    reviewed = review_feedback(
        feedback["id"],
        "verified",
        db_path=feedback_db,
        admin_key="dev-admin-key",
        reviewed_by="admin@example.com",
    )

    summary = get_feedback_summary(db_path=feedback_db)
    assert summary["verified"] == 1
    assert summary["pending"] == 0
    assert reviewed["status"] == "verified"


def test_feedback_summary_tracks_pending_and_rejected_states(feedback_db):
    first_scan = record_scan(
        url="https://example.org",
        classification="legitimate",
        risk_score=0.1,
        confidence=0.92,
        model_version="1.0.0",
        status="analyzed",
        db_path=feedback_db,
    )
    second_scan = record_scan(
        url="https://news.example",
        classification="phishing",
        risk_score=0.9,
        confidence=0.86,
        model_version="1.0.0",
        status="analyzed",
        db_path=feedback_db,
    )

    first = submit_feedback(
        {
            "scan_id": first_scan["scan_id"],
            "url": "https://example.org",
            "predicted_classification": "legitimate",
            "predicted_risk_score": 0.1,
            "model_version": "1.0.0",
            "suggested_classification": "phishing",
        },
        db_path=feedback_db,
    )

    second = submit_feedback(
        {
            "scan_id": second_scan["scan_id"],
            "url": "https://news.example",
            "predicted_classification": "phishing",
            "predicted_risk_score": 0.9,
            "model_version": "1.0.0",
            "suggested_classification": "phishing",
        },
        db_path=feedback_db,
    )

    review_feedback(
        second["id"],
        "rejected",
        db_path=feedback_db,
        admin_key="dev-admin-key",
        reviewed_by="reviewer@example.com",
    )

    summary = get_feedback_summary(db_path=feedback_db)
    assert summary["total"] == 2
    assert summary["pending"] == 1
    assert summary["rejected"] == 1
    assert summary["verified"] == 0
