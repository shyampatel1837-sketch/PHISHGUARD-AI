import pandas as pd

DATASET_PATH = "ml/data/phishing_site_urls.csv"

df = pd.read_csv(DATASET_PATH)

print("\n===== DATASET INFO =====")
print("Rows:", len(df))
print("Columns:", list(df.columns))

print("\n===== FIRST 5 ROWS =====")
print(df.head())

print("\n===== LABEL DISTRIBUTION =====")
print(df["Label"].value_counts())

print("\n===== MISSING VALUES =====")
print(df.isnull().sum())

print("\n===== DUPLICATE URLs =====")
print(df["URL"].duplicated().sum())

print("\n===== UNIQUE LABELS =====")
print(df["Label"].unique())

