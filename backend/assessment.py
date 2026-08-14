"""
Assessment API — Random Forest deficiency risk prediction.

Endpoints:
  POST /assessment/run              → run model, save + return result
  GET  /assessment/latest           → most recent saved assessment
  GET  /assessment/recommendations  → top foods for a nutrient
"""

import os, json
import joblib
import numpy as np
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc
from sqlalchemy.orm import Session

from database import get_db
from models import User, DiaryEntry, HealthProfile, LabResult, Assessment, FoodItem
from jwt_utils import get_current_user

router = APIRouter(
    prefix="/assessment",
    tags=["Assessment"],
)

# ── ML artefact paths ───────────────────────────────
# The model files live in backend/models/ (provided by the user)
_ML_DIR = os.path.join(os.path.dirname(__file__), "models")
_MODEL_PATH = os.path.join(_ML_DIR, "deficiency_model.joblib")
_SCALER_PATH = os.path.join(_ML_DIR, "preprocess.joblib")
_META_PATH = os.path.join(_ML_DIR, "meta.json")

# Lazy-loaded singletons
_model = None
_scaler = None
_meta = None


def _load_ml():
    global _model, _scaler, _meta
    if _model is None:
        if not os.path.exists(_MODEL_PATH):
            raise HTTPException(
                status_code=500,
                detail="ML model not found. Ensure deficiency_model.joblib is in backend/models/.",
            )
        _model = joblib.load(_MODEL_PATH)
        _scaler = joblib.load(_SCALER_PATH)
        
        # Patch for sklearn 1.9.0 compatibility with 1.6.1 models
        if hasattr(_scaler, 'steps'):
            for name, step in _scaler.steps:
                if type(step).__name__ == 'SimpleImputer':
                    if not hasattr(step, '_fill_dtype') and hasattr(step, '_fit_dtype'):
                        step._fill_dtype = step._fit_dtype

        with open(_META_PATH) as f:
            _meta = json.load(f)
    return _model, _scaler, _meta


# ── Helpers ─────────────────────────────────────────

REQUIRED_MEALS = {"Breakfast", "Lunch", "Snack", "Dinner"}

# Map label names from meta.json → display-friendly nutrient key
LABEL_TO_NUTRIENT = {
    "label_iron":       "iron",
    "label_calcium":    "calcium",
    "label_vitamin_d":  "vitamin_d",
    "label_vitamin_b12": "vitamin_b12",
    "label_folate":     "folate",
    "label_vitamin_a":  "vitamin_a",
    "label_vitamin_c":  "vitamin_c",
    "label_magnesium":  "magnesium",
    "label_zinc":       "zinc",
    "label_protein":    "protein",
}

NUTRIENT_DISPLAY_LABELS = {
    "iron":       "Low iron intake",
    "calcium":    "Low calcium intake",
    "vitamin_d":  "Low vitamin D intake",
    "vitamin_b12": "Low B12 intake",
    "folate":     "Low folate intake",
    "vitamin_a":  "Low vitamin A intake",
    "vitamin_c":  "Low vitamin C intake",
    "magnesium":  "Low magnesium intake",
    "zinc":       "Low zinc intake",
    "protein":    "Low protein intake",
}

# Column in FoodItem to sort by when recommending foods
NUTRIENT_SORT_COLUMN = {
    "iron":       "iron_mg",
    "calcium":    "calcium_mg",
    "vitamin_d":  "vitamin_d_mcg",
    "vitamin_b12": "vitamin_b12_mcg",
    "folate":     "folate_mcg",
    "vitamin_a":  "vitamin_a_mcg",
    "vitamin_c":  "vitamin_c_mg",
    "magnesium":  "magnesium_mg",
    "zinc":       "zinc_mg",
    "protein":    "protein_g",
}


def _risk_level(prob: float) -> str:
    if prob > 0.65:
        return "HIGH"
    elif prob >= 0.35:
        return "MODERATE"
    return "LOW"


# ── POST /assessment/run ────────────────────────────

@router.post("/run")
def run_assessment(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # 1) Validate 7 complete diary days ────────────────
    entries = (
        db.query(DiaryEntry)
        .filter(DiaryEntry.user_id == current_user.id)
        .all()
    )

    # Group by date → set of meal_types
    days_map: dict[str, set] = {}
    for e in entries:
        d = str(e.entry_date)
        days_map.setdefault(d, set()).add(e.meal_type.capitalize())

    # Find complete days (all 4 meals)
    complete_dates = sorted(d for d, meals in days_map.items() if meals >= REQUIRED_MEALS)

    if len(complete_dates) < 7:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Assessment requires 7 complete days of meals (found {len(complete_dates)} complete day(s)). "
                "Please complete all Breakfast, Lunch, Snack and Dinner entries before running the assessment."
            ),
        )

    # Use the most recent 7 complete days
    target_dates = complete_dates[-7:]

    # Verify they are 7 consecutive calendar days
    date_objs = [datetime.strptime(d, "%Y-%m-%d").date() for d in target_dates]
    for i in range(1, len(date_objs)):
        if (date_objs[i] - date_objs[i - 1]).days != 1:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Assessment requires 7 consecutive complete days of meals. "
                    "Your complete diary days have gaps. Please fill in all Breakfast, Lunch, Snack and Dinner entries for 7 consecutive days."
                ),
            )

    # 2) Compute 7-day average nutrients ───────────────
    target_date_set = set(target_dates)
    target_entries = [e for e in entries if str(e.entry_date) in target_date_set]

    nutrient_keys = [
        "calories_kcal", "protein_g", "iron_mg", "calcium_mg",
        "vitamin_d_mcg", "vitamin_b12_mcg", "folate_mcg",
        "vitamin_a_mcg", "vitamin_c_mg", "magnesium_mg", "zinc_mg",
    ]

    daily_totals: dict[str, dict] = {}
    for e in target_entries:
        d = str(e.entry_date)
        if d not in daily_totals:
            daily_totals[d] = {k: 0.0 for k in nutrient_keys}
        for key in nutrient_keys:
            daily_totals[d][key] += getattr(e, key, 0) or 0

    n_days = len(daily_totals)
    avg = {
        k: round(sum(day[k] for day in daily_totals.values()) / n_days, 2)
        for k in nutrient_keys
    }

    # 3) Load health profile ───────────────────────────
    profile = db.query(HealthProfile).filter(HealthProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=400, detail="Health profile not found. Please complete onboarding first.")

    # 4) Build feature vector (13 features from meta.json) ─
    feature_values = {
        "gender":          profile.gender,
        "age_years":       profile.age_years,
        "calories_kcal":   avg["calories_kcal"],
        "protein_g":       avg["protein_g"],
        "iron_mg":         avg["iron_mg"],
        "calcium_mg":      avg["calcium_mg"],
        "vitamin_d_mcg":   avg["vitamin_d_mcg"],
        "vitamin_b12_mcg": avg["vitamin_b12_mcg"],
        "folate_mcg":      avg["folate_mcg"],
        "vitamin_a_mcg":   avg["vitamin_a_mcg"],
        "vitamin_c_mg":    avg["vitamin_c_mg"],
        "magnesium_mg":    avg["magnesium_mg"],
        "zinc_mg":         avg["zinc_mg"],
    }

    # 5) Run model ─────────────────────────────────────
    model, scaler, meta = _load_ml()

    # Build X in the exact feature order from meta.json
    feature_order = meta["features"]
    X = np.array([[feature_values[f] for f in feature_order]])
    X_scaled = scaler.transform(X)

    # predict_proba returns list of arrays (one per label/target)
    proba_list = model.predict_proba(X_scaled)

    # Map label names from meta → nutrient keys
    label_names = meta["labels"]  # e.g. ["label_iron", "label_vitamin_d", ...]

    risks = {}
    for i, label_name in enumerate(label_names):
        nutrient_key = LABEL_TO_NUTRIENT.get(label_name, label_name.replace("label_", ""))
        proba = proba_list[i]
        # class 1 = deficient
        if proba.shape[1] == 2:
            prob = float(proba[0, 1])
        else:
            prob = float(proba[0, 0])
        risks[nutrient_key] = prob

    # 6) Apply lab boosts ──────────────────────────────
    lab = db.query(LabResult).filter(LabResult.user_id == current_user.id).first()

    if lab:
        gender = profile.gender  # 0=male, 1=female

        # Hemoglobin check
        if lab.hemoglobin_g_dl is not None:
            if (gender == 1 and lab.hemoglobin_g_dl < 12) or (gender == 0 and lab.hemoglobin_g_dl < 13):
                risks["iron"] = max(risks.get("iron", 0), 0.75)

        # Ferritin check
        if lab.ferritin is not None and lab.ferritin < 30:
            risks["iron"] = max(risks.get("iron", 0), 0.70)

        # Serum vitamin D check
        if lab.serum_vitamin_d is not None and lab.serum_vitamin_d < 50:
            risks["vitamin_d"] = max(risks.get("vitamin_d", 0), 0.65)

        # Vitamin B12 check
        if lab.vitamin_b12 is not None and lab.vitamin_b12 < 200:
            risks["vitamin_b12"] = max(risks.get("vitamin_b12", 0), 0.60)

        # Calcium check
        if lab.calcium is not None and lab.calcium < 8.5:
            risks["calcium"] = max(risks.get("calcium", 0), 0.55)

    # 7) Wellness score ────────────────────────────────
    avg_risk = sum(risks.values()) / len(risks)
    overall_score = round((1 - avg_risk) * 100, 1)

    # 8) Build response ────────────────────────────────
    risks_list = []
    for nutrient_key, prob in risks.items():
        risks_list.append({
            "nutrient":    nutrient_key,
            "probability": round(prob, 4),
            "percentage":  round(prob * 100, 1),
            "risk_level":  _risk_level(prob),
            "label":       NUTRIENT_DISPLAY_LABELS.get(nutrient_key, nutrient_key),
        })

    # Sort by probability descending (highest risk first)
    risks_list.sort(key=lambda r: r["probability"], reverse=True)

    # 9) Persist ───────────────────────────────────────
    assessment = Assessment(
        user_id=current_user.id,
        diary_days_used=n_days,
        features_json=json.dumps(feature_values),
        risks_json=json.dumps(risks_list),
        overall_score=overall_score,
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    return {
        "id":             assessment.id,
        "overall_score":  overall_score,
        "diary_days_used": n_days,
        "risks":          risks_list,
        "features":       feature_values,
        "created_at":     str(assessment.created_at),
    }


# ── GET /assessment/latest ──────────────────────────

@router.get("/latest")
def get_latest_assessment(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assessment = (
        db.query(Assessment)
        .filter(Assessment.user_id == current_user.id)
        .order_by(desc(Assessment.created_at))
        .first()
    )

    if not assessment:
        raise HTTPException(status_code=404, detail="No assessment found. Run an assessment first.")

    risks_list = json.loads(assessment.risks_json)
    features = json.loads(assessment.features_json)

    return {
        "id":             assessment.id,
        "overall_score":  assessment.overall_score,
        "diary_days_used": assessment.diary_days_used,
        "risks":          risks_list,
        "features":       features,
        "created_at":     str(assessment.created_at),
    }


# ── GET /assessment/recommendations ─────────────────

@router.get("/recommendations")
def get_recommendations(
    nutrient: str = Query(..., description="Nutrient key, e.g. 'calcium', 'iron'"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    col_name = NUTRIENT_SORT_COLUMN.get(nutrient)
    if not col_name:
        raise HTTPException(status_code=400, detail=f"Unknown nutrient: {nutrient}")

    sort_col = getattr(FoodItem, col_name, None)
    if sort_col is None:
        raise HTTPException(status_code=500, detail=f"Column {col_name} not found on FoodItem")

    foods = (
        db.query(FoodItem)
        .filter(sort_col > 0)
        .order_by(desc(sort_col))
        .limit(15)
        .all()
    )

    results = []
    for f in foods:
        results.append({
            "id":         f.id,
            "name":       f.name,
            "iron_mg":    round(f.iron_mg, 1),
            "calcium_mg": round(f.calcium_mg, 0),
        })

    return {
        "nutrient": nutrient,
        "foods":    results,
    }
