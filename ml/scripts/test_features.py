import sys
from pathlib import Path

# Add backend to Python path
PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from app.services.feature_service import (
    extract_features,
    build_feature_vector,
    FEATURE_NAMES,
)

test_urls = [
    "https://google.com",
    "http://example.com/login",
    "http://secure-login-example.com/verify/account",
]

for url in test_urls:
    features = extract_features(url)
    vector = build_feature_vector(features)

    print("\nURL:", url)
    print("Feature vector length:", len(vector))
    print("Features:")

    for name, value in zip(FEATURE_NAMES, vector):
        print(f"  {name}: {value}")

    print("Vector:", vector)

print("\nExpected feature count:", len(FEATURE_NAMES))
