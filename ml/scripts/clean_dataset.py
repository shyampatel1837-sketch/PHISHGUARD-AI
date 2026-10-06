import pandas as pd
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from app.services.feature_service import extract_features


INPUT_PATH = PROJECT_ROOT / "ml/data/phishing_site_urls.csv"
OUTPUT_PATH = PROJECT_ROOT / "ml/data/phishing_site_urls_clean.csv"


def main():
    print("=" * 60)
    print("PhishGuard AI - Dataset Cleaning")
    print("=" * 60)

    # Load dataset
    df = pd.read_csv(INPUT_PATH)

    print(f"\nOriginal rows: {len(df)}")

    # Basic cleaning
    df["URL"] = df["URL"].astype(str).str.strip()
    df["Label"] = df["Label"].astype(str).str.strip().str.lower()

    # Remove duplicate URLs using majority label
    cleaned_rows = []

    for url, group in df.groupby("URL", sort=False):
        label = group["Label"].value_counts().idxmax()
        cleaned_rows.append({
            "URL": url,
            "Label": label
        })

    cleaned_df = pd.DataFrame(cleaned_rows)

    print(f"After deduplication: {len(cleaned_df)}")

    # Remove corrupted / invalid URLs
    valid_rows = []
    invalid_count = 0

    for _, row in cleaned_df.iterrows():
        url = row["URL"]

        try:
            features = extract_features(url)

            # A valid URL should produce a usable domain
            if features.domain is None:
                invalid_count += 1
                continue

            valid_rows.append(row)

        except Exception:
            invalid_count += 1

    cleaned_df = pd.DataFrame(valid_rows)

    print(f"Invalid/corrupted rows removed: {invalid_count}")
    print(f"Final rows: {len(cleaned_df)}")

    print("\nFinal label distribution:")
    print(cleaned_df["Label"].value_counts())

    # Save
    cleaned_df.to_csv(OUTPUT_PATH, index=False)

    print("\nSaved to:")
    print(OUTPUT_PATH)


if __name__ == "__main__":
    main()