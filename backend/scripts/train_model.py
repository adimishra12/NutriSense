"""
Train a multi-output Random Forest for deficiency risk prediction.

Generates synthetic training data using RDA-based thresholds, trains
a RandomForestClassifier per deficiency target, and saves:
  - deficiency_model.joblib   (the model)
  - preprocess.joblib          (StandardScaler)
  - meta.json                  (feature names + target names)

Run once:  python scripts/train_model.py
"""

import os, sys, json
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.multioutput import MultiOutputClassifier
import joblib

np.random.seed(42)

# ── Output directory ────────────────────────────────
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "ml")
os.makedirs(OUT_DIR, exist_ok=True)

# ── Feature spec (13 features) ──────────────────────
FEATURES = [
    "gender",           # 0=male, 1=female
    "age_years",
    "calories_kcal",
    "protein_g",
    "iron_mg",
    "calcium_mg",
    "vitamin_d_mcg",
    "vitamin_b12_mcg",
    "folate_mcg",
    "vitamin_a_mcg",
    "vitamin_c_mg",
    "magnesium_mg",
    "zinc_mg",
]

# ── Target deficiencies (10) ────────────────────────
TARGETS = [
    "iron",
    "calcium",
    "vitamin_d",
    "vitamin_b12",
    "folate",
    "vitamin_a",
    "vitamin_c",
    "magnesium",
    "zinc",
    "protein",
]

# ── RDA thresholds (daily) — below these = deficient ──
RDA = {
    "protein_g":        50,
    "iron_mg":          18,
    "calcium_mg":       1000,
    "vitamin_d_mcg":    15,
    "vitamin_b12_mcg":  2.4,
    "folate_mcg":       400,
    "vitamin_a_mcg":    900,
    "vitamin_c_mg":     90,
    "magnesium_mg":     400,
    "zinc_mg":          11,
}

# Feature → target mapping
FEATURE_TO_TARGET = {
    "iron_mg":          "iron",
    "calcium_mg":       "calcium",
    "vitamin_d_mcg":    "vitamin_d",
    "vitamin_b12_mcg":  "vitamin_b12",
    "folate_mcg":       "folate",
    "vitamin_a_mcg":    "vitamin_a",
    "vitamin_c_mg":     "vitamin_c",
    "magnesium_mg":     "magnesium",
    "zinc_mg":          "zinc",
    "protein_g":        "protein",
}

N_SAMPLES = 5000


def generate_synthetic_data():
    """Generate training data with realistic nutrient distributions."""
    data = {
        "gender":          np.random.randint(0, 2, N_SAMPLES),
        "age_years":       np.random.randint(18, 70, N_SAMPLES),
        "calories_kcal":   np.random.normal(2000, 600, N_SAMPLES).clip(800, 4000),
        "protein_g":       np.random.normal(55, 25, N_SAMPLES).clip(5, 200),
        "iron_mg":         np.random.normal(14, 8, N_SAMPLES).clip(1, 60),
        "calcium_mg":      np.random.normal(800, 400, N_SAMPLES).clip(50, 3000),
        "vitamin_d_mcg":   np.random.normal(10, 8, N_SAMPLES).clip(0, 80),
        "vitamin_b12_mcg": np.random.normal(3, 2.5, N_SAMPLES).clip(0, 20),
        "folate_mcg":      np.random.normal(350, 180, N_SAMPLES).clip(20, 1200),
        "vitamin_a_mcg":   np.random.normal(700, 400, N_SAMPLES).clip(20, 3000),
        "vitamin_c_mg":    np.random.normal(75, 45, N_SAMPLES).clip(2, 400),
        "magnesium_mg":    np.random.normal(320, 140, N_SAMPLES).clip(30, 1000),
        "zinc_mg":         np.random.normal(9, 5, N_SAMPLES).clip(1, 40),
    }

    df = pd.DataFrame(data)

    # Create binary labels: 1 = deficient (below threshold)
    # Add noise so the model learns probabilistic patterns
    labels = {}
    for feat_col, target_name in FEATURE_TO_TARGET.items():
        threshold = RDA[feat_col]
        ratio = df[feat_col] / threshold
        # Base probability: sigmoid-like curve centred at ratio=1
        prob_deficient = 1 / (1 + np.exp(5 * (ratio - 0.85)))
        # Add noise
        noise = np.random.uniform(-0.1, 0.1, N_SAMPLES)
        prob_deficient = np.clip(prob_deficient + noise, 0, 1)
        labels[target_name] = (np.random.random(N_SAMPLES) < prob_deficient).astype(int)

    return df, pd.DataFrame(labels)


def main():
    print("Generating synthetic training data …")
    X, Y = generate_synthetic_data()

    print(f"  Samples : {len(X)}")
    print(f"  Features: {list(X.columns)}")
    print(f"  Targets : {list(Y.columns)}")

    # Fit scaler
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Train model
    print("Training Random Forest (multi-output) …")
    base_rf = RandomForestClassifier(
        n_estimators=200,
        max_depth=12,
        min_samples_leaf=5,
        random_state=42,
        n_jobs=-1,
    )
    model = MultiOutputClassifier(base_rf, n_jobs=-1)
    model.fit(X_scaled, Y)

    # Save artefacts
    model_path = os.path.join(OUT_DIR, "deficiency_model.joblib")
    scaler_path = os.path.join(OUT_DIR, "preprocess.joblib")
    meta_path = os.path.join(OUT_DIR, "meta.json")

    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)

    meta = {
        "features": FEATURES,
        "targets": TARGETS,
    }
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)

    print(f"\nSaved:")
    print(f"  {model_path}")
    print(f"  {scaler_path}")
    print(f"  {meta_path}")
    print("Done ✓")


if __name__ == "__main__":
    main()
