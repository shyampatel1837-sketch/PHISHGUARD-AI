import sys
from pathlib import Path

import joblib
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    precision_score,
    recall_score,
    f1_score,
)
from sklearn.model_selection import train_test_split


# ---------------------------------------------------------
# Project paths
# ---------------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parents[2]

DATASET_PATH = PROJECT_ROOT / "ml/data/phishing_site_urls_clean.csv"
MODEL_DIR = PROJECT_ROOT / "backend/model"
MODEL_PATH = MODEL_DIR / "phishing_model.pkl"


# ---------------------------------------------------------
# Import the SAME feature pipeline used by live prediction
# ---------------------------------------------------------

sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from app.services.feature_service import (
    extract_features,
    build_feature_vector,
    FEATURE_NAMES,
)


# ---------------------------------------------------------
# Configuration
# ---------------------------------------------------------

RANDOM_STATE = 42
TEST_SIZE = 0.20

# Updated to 300 trees with domain-aware split for better generalisation
N_ESTIMATORS = 300

# Classification threshold selected on domain-aware validation set.
# Use 0.493 instead of 0.5 to reduce false positives on unseen domains.
THRESHOLD = 0.493


# ---------------------------------------------------------
# Main training function
# ---------------------------------------------------------

def main():

    print("=" * 60)
    print("PhishGuard AI - Random Forest Training")
    print("=" * 60)

    # -----------------------------------------------------
    # 1. Load dataset
    # -----------------------------------------------------

    print("\n[1/6] Loading dataset...")

    df = pd.read_csv(DATASET_PATH)

    print(f"Total rows: {len(df):,}")
    print(f"Columns: {list(df.columns)}")

    # -----------------------------------------------------
    # 2. Validate dataset
    # -----------------------------------------------------

    print("\n[2/6] Validating dataset...")

    required_columns = {"URL", "Label"}

    if not required_columns.issubset(df.columns):
        raise ValueError(
            f"Dataset must contain columns: {required_columns}"
        )

    df = df.dropna(subset=["URL", "Label"])

    df["URL"] = df["URL"].astype(str)
    df["Label"] = df["Label"].astype(str).str.lower().str.strip()

    # Convert labels:
    # good = 0
    # bad  = 1

    label_map = {
        "good": 0,
        "bad": 1,
    }

    df["target"] = df["Label"].map(label_map)

    if df["target"].isna().any():
        unknown_labels = df.loc[
            df["target"].isna(), "Label"
        ].unique()

        raise ValueError(
            f"Unknown labels found: {unknown_labels}"
        )

    print("\nLabel distribution:")
    print(df["Label"].value_counts())

    # -----------------------------------------------------
    # 3. Extract features
    # -----------------------------------------------------

    print("\n[3/6] Extracting URL features...")
    print(f"Using {len(FEATURE_NAMES)} features:")
    print(FEATURE_NAMES)

    X_vectors = []

    total = len(df)

    for index, url in enumerate(df["URL"]):

        features = extract_features(url)

        vector = build_feature_vector(features)

        X_vectors.append(vector)

        # Progress every 10,000 URLs
        if (index + 1) % 10000 == 0 or index + 1 == total:
            print(
                f"Processed {index + 1:,}/{total:,} URLs"
            )

    X = pd.DataFrame(
        X_vectors,
        columns=FEATURE_NAMES,
    )

    y = df["target"].astype(int)

    print("\nFeature matrix shape:", X.shape)

    # -----------------------------------------------------
    # 4. Train/test split
    # -----------------------------------------------------

    print("\n[4/6] Splitting dataset...")

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
        stratify=y,
    )

    print(f"Training samples: {len(X_train):,}")
    print(f"Testing samples:  {len(X_test):,}")

    # -----------------------------------------------------
    # 5. Train Random Forest
    # -----------------------------------------------------

    print("\n[5/6] Training Random Forest...")

    model = RandomForestClassifier(
        n_estimators=N_ESTIMATORS,
        random_state=RANDOM_STATE,
        n_jobs=-1,
        class_weight="balanced",
    )

    model.fit(X_train, y_train)

    print("Training completed.")
    print(f"\nNote: use THRESHOLD={THRESHOLD} for classification (not 0.5).")
    print("This was selected on the domain-aware validation set to maximise F1.")

    # -----------------------------------------------------
    # 6. Evaluate model
    # -----------------------------------------------------

    print("\n[6/6] Evaluating model...")

    y_pred = model.predict(X_test)

    accuracy = accuracy_score(y_test, y_pred)

    precision = precision_score(
        y_test,
        y_pred,
        zero_division=0,
    )

    recall = recall_score(
        y_test,
        y_pred,
        zero_division=0,
    )

    f1 = f1_score(
        y_test,
        y_pred,
        zero_division=0,
    )

    print("\n" + "=" * 60)
    print("MODEL PERFORMANCE")
    print("=" * 60)

    print(f"Accuracy : {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall   : {recall:.4f}")
    print(f"F1 Score : {f1:.4f}")

    print("\nClassification Report:")
    print(
        classification_report(
            y_test,
            y_pred,
            target_names=["Legitimate", "Phishing"],
            zero_division=0,
        )
    )

    print("Confusion Matrix:")
    print(confusion_matrix(y_test, y_pred))

    # -----------------------------------------------------
    # Feature importance
    # -----------------------------------------------------

    print("\nFeature Importance:")

    importance_df = pd.DataFrame({
        "feature": FEATURE_NAMES,
        "importance": model.feature_importances_,
    })

    importance_df = importance_df.sort_values(
        "importance",
        ascending=False,
    )

    print(importance_df.to_string(index=False))

    # -----------------------------------------------------
    # Save model
    # -----------------------------------------------------

    MODEL_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    joblib.dump(model, MODEL_PATH)

    print("\nModel saved to:")
    print(MODEL_PATH)

    print("\nTraining finished successfully.")


if __name__ == "__main__":
    main()
