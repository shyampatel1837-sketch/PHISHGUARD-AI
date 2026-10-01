# PhishGuard AI

**AI-Based Phishing Detection System Using Machine Learning**

> Detect. Analyze. Protect.

PhishGuard AI is a full-stack cybersecurity research application that analyses
website URLs for phishing indicators. The frontend and backend foundation are
complete. A Random Forest classifier will be integrated in the next phase after
the model is trained on real phishing data.

---

## Features

- **Modern cybersecurity UI** — dark glassmorphism design with Framer Motion animations
- **URL Scanner** — structural analysis of URL strings (no network requests to target)
- **Feature Extraction** — HTTPS, domain length, IP address, subdomains, suspicious keywords, and more
- **ML-ready architecture** — clean interface for plugging in the Random Forest model
- **Dashboard** — security overview with stat cards and system status
- **Scan History** — table view ready to connect to a database
- **Analytics** — Recharts-based charts prepared for real scan data
- **Model Insights** — metrics, confusion matrix, and SHAP placeholders
- **Explainable AI section** — prepared for SHAP-based feature explanations
- **Fully responsive** — desktop, tablet, and mobile layouts

---

## Technology Stack

| Layer     | Technology                     |
|-----------|--------------------------------|
| Frontend  | React 18, Vite, React Router   |
| Animations| Framer Motion                  |
| Icons     | Lucide React                   |
| Charts    | Recharts                       |
| Backend   | Python, FastAPI                |
| Validation| Pydantic v2                    |
| Config    | pydantic-settings, python-dotenv |
| ML (future) | scikit-learn (Random Forest), joblib, SHAP |

---

## Project Structure

```
PHISHGUARD-AI/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx           # Navigation sidebar
│   │   │   ├── StatCard.jsx          # Dashboard metric card
│   │   │   ├── URLInput.jsx          # URL submission form
│   │   │   ├── ScanningAnimation.jsx # Loading animation
│   │   │   ├── AnalysisResult.jsx    # Full result panel
│   │   │   ├── RiskScore.jsx         # Circular risk gauge
│   │   │   ├── FeatureAnalysis.jsx   # URL feature grid
│   │   │   └── ModelStatusBadge.jsx  # ML status indicator
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Scanner.jsx
│   │   │   ├── History.jsx
│   │   │   ├── Analytics.jsx
│   │   │   ├── ModelInsights.jsx
│   │   │   └── About.jsx
│   │   ├── services/
│   │   │   └── api.js                # All backend API calls
│   │   ├── hooks/
│   │   │   ├── useAnalysis.js        # URL analysis lifecycle
│   │   │   └── useHealthCheck.js     # Backend health polling
│   │   ├── utils/
│   │   │   └── urlUtils.js           # URL validation helpers
│   │   ├── styles/
│   │   │   └── globals.css           # Design system / tokens
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py             # All FastAPI route handlers
│   │   ├── services/
│   │   │   ├── url_service.py        # Analysis orchestration
│   │   │   ├── feature_service.py    # URL feature extraction
│   │   │   └── ml_service.py        # ML model interface
│   │   ├── schemas/
│   │   │   └── url_schemas.py        # Pydantic request/response schemas
│   │   └── core/
│   │       └── config.py             # App settings (env vars)
│   ├── main.py                       # FastAPI app entry point
│   ├── requirements.txt
│   └── .env.example
│
├── README.md
└── .gitignore
```

---

## Setup — Frontend

```bash
cd PHISHGUARD-AI/frontend

# Install dependencies
npm install

# Start development server (runs on http://localhost:5173)
npm run dev
```

---

## Setup — Backend

```bash
cd PHISHGUARD-AI/backend

# Create virtual environment
python3 -m venv .venv

# Activate (macOS / Linux)
source .venv/bin/activate

# Activate (Windows)
# .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Start the API server (runs on http://localhost:8000)
uvicorn main:app --reload
```

The frontend and backend can run simultaneously. The Vite dev server proxies
`/api` requests to `http://localhost:8000` automatically.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable         | Default                       | Description                           |
|------------------|-------------------------------|---------------------------------------|
| `APP_VERSION`    | `1.0.0`                       | Application version                   |
| `DEBUG`          | `true`                        | Enable debug logging                  |
| `ALLOWED_ORIGINS`| `http://localhost:5173`       | CORS allowed origins                  |
| `MODEL_PATH`     | `model/phishing_model.pkl`    | Path to serialised Random Forest file |
| `MAX_URL_LENGTH` | `2048`                        | Maximum accepted URL length           |

### Frontend (`frontend/.env`)

| Variable       | Default                   | Description              |
|----------------|---------------------------|--------------------------|
| `VITE_API_URL` | `http://localhost:8000`   | Backend base URL         |

---

## API Endpoints

| Method | Endpoint            | Description                              |
|--------|---------------------|------------------------------------------|
| GET    | `/api/health`       | Backend health check and model status    |
| POST   | `/api/analyze`      | Analyse a URL for phishing indicators    |
| GET    | `/api/scans`        | Retrieve scan history                    |
| GET    | `/api/statistics`   | Aggregate detection statistics           |
| GET    | `/api/model/status` | ML model connection status               |
| POST   | `/api/model/predict`| Direct prediction endpoint (future)      |

### POST `/api/analyze` — Request

```json
{
  "url": "https://example.com"
}
```

### POST `/api/analyze` — Response (current, model not connected)

```json
{
  "success": true,
  "url": "https://example.com",
  "status": "ml_not_connected",
  "classification": null,
  "risk_score": null,
  "confidence": null,
  "features": {
    "url_length": 19,
    "domain": "example.com",
    "domain_length": 11,
    "has_https": true,
    "has_ip_address": false,
    "has_at_symbol": false,
    "hyphen_count": 0,
    "dot_count": 1,
    "subdomain_count": 0,
    "tld": "com",
    "has_suspicious_keywords": false,
    "suspicious_keywords_found": []
  },
  "explanations": [],
  "model": {
    "name": null,
    "version": null,
    "status": "not_connected",
    "algorithm": "Random Forest (pending)"
  },
  "analyzed_at": "2026-10-01T12:00:00Z",
  "message": "URL features extracted successfully. Machine learning model is not connected yet."
}
```

---

## Future ML Integration

The application is architected so the Random Forest can be connected without
changing the API or frontend. Follow these steps after training your model:

### Step 1 — Train and serialise the model

```python
import joblib
from sklearn.ensemble import RandomForestClassifier

# ... train your model on the phishing dataset ...

joblib.dump(model, "backend/model/phishing_model.pkl")
```

### Step 2 — Update `feature_service.py`

Replace the current `extract_features()` function with the exact feature
extraction pipeline used during training. The feature vector passed to the
model must match what it was trained on.

### Step 3 — Update `ml_service.py`

Uncomment the `joblib.load()` call in `_load_model()` and implement the
inference logic in `predict()`:

```python
# In _load_model():
import joblib
_model = joblib.load(model_path)
_model_loaded = True

# In predict():
feature_vector = _build_feature_vector(features)
prob = _model.predict_proba([feature_vector])[0]
phishing_prob = float(prob[1])
classification = "phishing" if phishing_prob >= 0.5 else "legitimate"
confidence = float(max(prob))
return classification, phishing_prob, confidence
```

### Step 4 — Add SHAP explanations (optional)

Install `shap` and compute SHAP values inside `predict()`. Populate the
`explanations` list in the `AnalyzeURLResponse` with `ExplanationItem` objects.
The frontend `AnalysisResult` component will automatically display them.

### Step 5 — Restart the server

```bash
uvicorn main:app --reload
```

The model loads automatically on startup. The frontend and API require no
changes — all null fields in the response will be populated with real values.

---

## Full ML Pipeline (next phase)

```
Phishing Dataset
  → Data Cleaning & EDA
  → Feature Engineering (match training features to feature_service.py)
  → Random Forest Training (sklearn)
  → Model Evaluation (accuracy, precision, recall, F1, confusion matrix)
  → Model Serialisation (joblib → .pkl)
  → FastAPI Integration (uncomment ml_service.py loader)
  → Real Prediction in /api/analyze
  → SHAP / XAI Integration
  → Model Insights page populated
```

---

## Security Notes

- Submitted URLs are **never visited or executed** — all analysis is string-only.
- Input length is limited to 2048 characters.
- CORS is restricted to configured frontend origins.
- No credentials are stored in the frontend.
- Stack traces are never exposed to API consumers.

---

## Local Development URLs

| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost:5173        |
| Backend  | http://localhost:8000        |
| API Docs | http://localhost:8000/docs   |
| ReDoc    | http://localhost:8000/redoc  |
