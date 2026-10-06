"""
Pydantic schemas for request/response validation.

These schemas define the contract between the frontend and backend.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, field_validator



# Request schemas


class AnalyzeURLRequest(BaseModel):
    """Incoming request to analyse a URL."""

    url: str

    @field_validator("url")
    @classmethod
    def validate_url_length(cls, v: str) -> str:
        v = v.strip()

        if not v:
            raise ValueError("URL must not be empty.")

        if len(v) > 2048:
            raise ValueError(
                "URL exceeds maximum allowed length of 2048 characters."
            )

        return v



# Sub-schemas


class ModelInfo(BaseModel):
    """Metadata about the ML model."""

    name: Optional[str] = None

    version: Optional[str] = None

    # "not_connected" | "loaded" | "error"
    status: str = "not_connected"

    algorithm: Optional[str] = None

    trained_on: Optional[str] = None


class URLFeatures(BaseModel):
    """
    URL-level features extracted during analysis.

    These fields must stay synchronized with the feature extraction
    pipeline in:

        backend/app/services/feature_service.py

    The ML feature vector currently contains 24 numeric features.

    Additional metadata fields such as domain, suspicious_keywords_found,
    and tld are returned for display/explanation purposes but are not
    directly included in the numeric ML feature vector.
    """

    
    # Original 12 ML features
    

    url_length: Optional[int] = None

    domain: Optional[str] = None

    domain_length: Optional[int] = None

    has_https: Optional[bool] = None

    has_ip_address: Optional[bool] = None

    has_at_symbol: Optional[bool] = None

    hyphen_count: Optional[int] = None

    dot_count: Optional[int] = None

    subdomain_count: Optional[int] = None

    path_length: Optional[int] = None

    query_params: Optional[int] = None

    special_char_count: Optional[int] = None

    has_suspicious_keywords: Optional[bool] = None

    
    # Additional 12 ML features
    

    digit_count: Optional[int] = None

    letter_count: Optional[int] = None

    digit_letter_ratio: Optional[float] = None

    url_entropy: Optional[float] = None

    domain_entropy: Optional[float] = None

    path_depth: Optional[int] = None

    query_length: Optional[int] = None

    double_slash_count: Optional[int] = None

    percent_encoding_count: Optional[int] = None

    has_suspicious_tld: Optional[bool] = None

    domain_has_digits: Optional[bool] = None

    longest_domain_label: Optional[int] = None

    
    # Additional 7 hostname-level features (added in v2 — 31 features total)
    

    # 1 if subdomain is exactly 'www', 0 otherwise.
    subdomain_is_www: Optional[int] = None

    # Number of non-www subdomain labels (0 for www.X.Y, >0 for a.b.X.Y).
    non_www_subdomain_depth: Optional[int] = None

    # Length of the registrable domain token only (excludes subdomains and TLD).
    reg_domain_length: Optional[int] = None

    # Total dot-separated labels in the full hostname.
    hostname_label_count: Optional[int] = None

    # Ratio of digit characters to hostname length.
    digit_ratio_hostname: Optional[float] = None

    # Number of embedded domain-like tokens in the URL path (e.g. /paypal.com/login).
    path_domain_count: Optional[int] = None

    # Vowel ratio in the registrable domain (low = algorithmically generated).
    vowel_ratio_reg_domain: Optional[float] = None

    
    # Additional metadata / display fields
    

    suspicious_keywords_found: Optional[List[str]] = None

    tld: Optional[str] = None


class ExplanationItem(BaseModel):
    """
    A single XAI / SHAP explanation item.

    This will be populated when SHAP/XAI is integrated.
    """

    feature: str

    importance: float

    # "increases_risk" | "decreases_risk"
    direction: str

    description: str



# Response schemas


class AnalyzeURLResponse(BaseModel):
    """
    Full response returned after URL analysis.

    ML-dependent fields remain null if the model is unavailable.
    """

    success: bool

    url: str

    # "ml_not_connected" | "analyzed" | "error"
    status: str

    
    # ML outputs
    

    # "phishing" | "legitimate"
    classification: Optional[str] = None

    # 0.0 - 1.0
    risk_score: Optional[float] = None

    # 0.0 - 1.0
    confidence: Optional[float] = None

    
    # URL features
    

    features: URLFeatures = URLFeatures()

    
    # XAI explanations
    

    explanations: List[ExplanationItem] = []

    
    # Model metadata
    

    model: ModelInfo = ModelInfo()

    
    # Timestamp
    

    analyzed_at: Optional[datetime] = None

    
    # Human-readable frontend message
    

    message: str = ""


class HealthResponse(BaseModel):
    """Health-check response."""

    status: str

    version: str

    model_status: str


class StatisticsResponse(BaseModel):
    """
    Aggregate scan statistics.

    Counts remain null until a database / scan store is connected.
    """

    total_scans: Optional[int] = None

    phishing_detected: Optional[int] = None

    legitimate_urls: Optional[int] = None

    detection_accuracy: Optional[float] = None

    message: str = (
        "Statistics unavailable — no database connected yet."
    )


class ScanRecord(BaseModel):
    """A single historical scan record."""

    id: str

    url: str

    classification: Optional[str] = None

    risk_score: Optional[float] = None

    scanned_at: datetime

    status: str


class ScansResponse(BaseModel):
    """Response containing historical scan records."""

    success: bool

    scans: List[ScanRecord] = []

    total: int = 0

    message: str = ""


class ModelStatusResponse(BaseModel):
    """Detailed status of the ML model."""

    connected: bool

    status: str

    model: ModelInfo

    metrics: Optional[Dict[str, Any]] = None

    message: str = ""