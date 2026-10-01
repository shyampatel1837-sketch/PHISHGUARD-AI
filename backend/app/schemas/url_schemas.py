"""
Pydantic schemas for request/response validation.
These define the contract between frontend and backend.
"""

from pydantic import BaseModel, HttpUrl, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime


# ── Request schemas ──────────────────────────────────────────────────────────

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
            raise ValueError("URL exceeds maximum allowed length of 2048 characters.")
        return v


# ── Sub-schemas ───────────────────────────────────────────────────────────────

class ModelInfo(BaseModel):
    """Metadata about the ML model."""
    name: Optional[str] = None
    version: Optional[str] = None
    status: str = "not_connected"          # "not_connected" | "loaded" | "error"
    algorithm: Optional[str] = None
    trained_on: Optional[str] = None


class URLFeatures(BaseModel):
    """
    URL-level features extracted during analysis.
    This schema will be expanded once the Random Forest feature pipeline
    is finalised (matching the exact features used during model training).
    """
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
    suspicious_keywords_found: Optional[List[str]] = None
    tld: Optional[str] = None


class ExplanationItem(BaseModel):
    """A single XAI / SHAP explanation item (populated once ML model is connected)."""
    feature: str
    importance: float
    direction: str       # "increases_risk" | "decreases_risk"
    description: str


# ── Response schemas ──────────────────────────────────────────────────────────

class AnalyzeURLResponse(BaseModel):
    """
    Full response returned after URL analysis.
    Fields that depend on the ML model are null when the model is not connected.
    When the Random Forest is integrated, classification / risk_score / confidence
    will be populated from the model's output.
    """
    success: bool
    url: str
    status: str                              # "ml_not_connected" | "analyzed" | "error"

    # ML outputs — null until model is connected
    classification: Optional[str] = None    # "phishing" | "legitimate"
    risk_score: Optional[float] = None      # 0.0 – 1.0
    confidence: Optional[float] = None      # 0.0 – 1.0

    # URL features extracted from the string (no network requests)
    features: URLFeatures = URLFeatures()

    # XAI explanations — populated once SHAP is integrated
    explanations: List[ExplanationItem] = []

    # Model metadata
    model: ModelInfo = ModelInfo()

    # Timestamps
    analyzed_at: Optional[datetime] = None

    # Human-readable status message for the frontend
    message: str = ""


class HealthResponse(BaseModel):
    status: str
    version: str
    model_status: str


class StatisticsResponse(BaseModel):
    """
    Aggregate statistics.
    All counts are null until a database / scan store is connected.
    """
    total_scans: Optional[int] = None
    phishing_detected: Optional[int] = None
    legitimate_urls: Optional[int] = None
    detection_accuracy: Optional[float] = None
    message: str = "Statistics unavailable — no database connected yet."


class ScanRecord(BaseModel):
    """A single historical scan record."""
    id: str
    url: str
    classification: Optional[str] = None
    risk_score: Optional[float] = None
    scanned_at: datetime
    status: str


class ScansResponse(BaseModel):
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
    message: str
