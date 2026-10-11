import os

from app.schemas.url_schemas import URLFeatures
from app.services import ml_service, url_service
from app.services.feature_service import extract_features, build_feature_vector

LEGITIMATE_URLS = [
    "https://www.google.com",
    "https://google.com",
    "http://www.google.com",
    "https://www.microsoft.com",
    "https://www.amazon.com",
    "https://www.wikipedia.org",
    "https://example.com",
]

SUSPICIOUS_URLS = [
    "http://paypal-login.example.invalid",
    "http://secure-account-login.com/update/password",
]

THRESHOLD = float(os.getenv("PREDICTION_THRESHOLD", "0.493"))


def test_model_predicts_legitimate_urls_as_legitimate():
    for url in LEGITIMATE_URLS:
        classification, risk_score, confidence = ml_service.predict(url)
        assert classification == "legitimate", (url, classification, risk_score)
        assert risk_score < THRESHOLD, (url, risk_score, THRESHOLD)
        assert confidence is not None


def test_model_flags_suspicious_urls():
    for url in SUSPICIOUS_URLS:
        classification, risk_score, confidence = ml_service.predict(url)
        assert classification == "phishing", (url, classification, risk_score)
        assert risk_score >= THRESHOLD, (url, risk_score, THRESHOLD)
        assert confidence is not None


def test_predict_accepts_feature_object_for_compatibility():
    url = "https://www.google.com"
    direct = ml_service.predict(url)
    features = extract_features(url)
    via_features = ml_service.predict(features)

    assert direct[0] == via_features[0], (direct, via_features)
    assert abs(direct[1] - via_features[1]) < 1e-9, (direct, via_features)
    assert direct[2] == via_features[2], (direct, via_features)


def test_api_result_structure_uses_backend_prediction():
    url = "https://www.google.com"
    result = url_service.analyze_url(url)

    assert result.success is True
    assert result.status == "analyzed"
    assert result.classification == "legitimate"
    assert result.risk_score is not None
    assert 0.0 <= result.risk_score <= 1.0
    assert result.model.status == "loaded"
    assert result.features.domain is not None


def test_feature_vector_matches_model_contract_for_known_urls():
    for url in LEGITIMATE_URLS + SUSPICIOUS_URLS:
        features = extract_features(url)
        vector = build_feature_vector(features)
        assert len(vector) == len(ml_service.FEATURE_NAMES)
        assert all(isinstance(value, float) for value in vector)
