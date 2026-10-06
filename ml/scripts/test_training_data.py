import sys
from pathlib import Path

import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from app.services.feature_service import (
    extract_features,
    build_feature_vector,
    FEATURE_NAMES,
)

DATASET_PATH = PROJECT_ROOT / "ml/data/phishing_site_urls_clean.csv"

# Load only 1,000 rows for testing
df = pd.read_csv(DATASET_PATH, nrows=1000)

print("Rows loaded:", len(df))
print("Columns:", list(df.columns))
print("\nLabels:")
print(df["Label"].value_counts())

# Convert URLs into the same numerical features used by live prediction
X = [
    build_feature_vector(extract_features(url))
    for url in df["URL"]
]

X = pd.DataFrame(X, columns=FEATURE_NAMES)

print("\nFeature matrix shape:", X.shape)
print("Expected columns:", len(FEATURE_NAMES))

print("\nFirst 5 feature rows:")
print(X.head())

print("\nMissing values:")
print(X.isnull().sum().sum())

print("\nDataset test completed successfully.")
