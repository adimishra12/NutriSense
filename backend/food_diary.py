from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from database import get_db
from models import User, DiaryEntry
from schemas import DiaryEntryRequest, DiaryEntryResponse, FoodSearchResult, DiarySummary
from jwt_utils import get_current_user
from food_data import search_foods, get_food_by_id

router = APIRouter(tags=["Food Diary"])


# ── Food search ─────────────────────────────────────
@router.get("/foods/search", response_model=List[FoodSearchResult])
def search_food_items(
    q: str = Query("", min_length=1),
    db: Session = Depends(get_db)
):
    results = search_foods(db, q)
    return results


# ── Log a food entry ────────────────────────────────
@router.post("/diary/entries", response_model=DiaryEntryResponse)
def create_food_entry(
    request: DiaryEntryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Allowed multiple entries per meal type on the same date

    food = get_food_by_id(db, request.food_id)

    if not food:
        raise HTTPException(
            status_code=404,
            detail=f"Food item with ID {request.food_id} not found"
        )

    # Scale nutrients by portion size (food_data is per 100g)
    scale = request.portion_grams / 100.0

    entry = DiaryEntry(
        user_id=current_user.id,
        food_id=request.food_id,
        entry_date=request.entry_date,
        meal_type=request.meal_type,
        food_name=request.food_name,
        portion_grams=request.portion_grams,
        calories_kcal=round(food.get("calories_kcal", 0) * scale, 1),
        protein_g=round(food.get("protein_g", 0) * scale, 2),
        carbohydrates_g=round(food.get("carbohydrates_g", 0) * scale, 2),
        fat_g=round(food.get("fat_g", 0) * scale, 2),
        fiber_g=round(food.get("fiber_g", 0) * scale, 2),
        iron_mg=round(food.get("iron_mg", 0) * scale, 2),
        calcium_mg=round(food.get("calcium_mg", 0) * scale, 1),
        vitamin_d_mcg=round(food.get("vitamin_d_mcg", 0) * scale, 2),
        vitamin_b12_mcg=round(food.get("vitamin_b12_mcg", 0) * scale, 2),
        folate_mcg=round(food.get("folate_mcg", 0) * scale, 1),
        vitamin_a_mcg=round(food.get("vitamin_a_mcg", 0) * scale, 1),
        vitamin_c_mg=round(food.get("vitamin_c_mg", 0) * scale, 1),
        magnesium_mg=round(food.get("magnesium_mg", 0) * scale, 1),
        zinc_mg=round(food.get("zinc_mg", 0) * scale, 2),
    )

    db.add(entry)
    db.commit()
    db.refresh(entry)

    return entry


# ── Get entries for a date ──────────────────────────
@router.get("/diary/entries", response_model=List[DiaryEntryResponse])
def get_food_entries(
    date: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        parsed_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        
    entries = db.query(DiaryEntry).filter(
        DiaryEntry.user_id == current_user.id,
        DiaryEntry.entry_date == parsed_date,
    ).all()

    return entries


# ── Get summary (avg nutrients across all days) ─────
@router.get("/diary/summary", response_model=DiarySummary)
def get_diary_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entries = db.query(DiaryEntry).filter(
        DiaryEntry.user_id == current_user.id
    ).all()

    if not entries:
        return DiarySummary(
            days_logged=0,
        )

    # Group by date and check complete meals
    daily = {}
    days_map = {}
    for e in entries:
        date_str = str(e.entry_date)
        days_map.setdefault(date_str, set()).add(e.meal_type.capitalize())
        if date_str not in daily:
            daily[date_str] = {
                "calories_kcal": 0, "protein_g": 0, "carbohydrates_g": 0, 
                "fat_g": 0, "fiber_g": 0, "iron_mg": 0, "calcium_mg": 0,
                "vitamin_d_mcg": 0, "vitamin_b12_mcg": 0,
                "folate_mcg": 0, "vitamin_a_mcg": 0,
                "vitamin_c_mg": 0, "magnesium_mg": 0, "zinc_mg": 0
            }
        daily[date_str]["calories_kcal"] += e.calories_kcal
        daily[date_str]["protein_g"] += e.protein_g
        daily[date_str]["carbohydrates_g"] += e.carbohydrates_g
        daily[date_str]["fat_g"] += e.fat_g
        daily[date_str]["fiber_g"] += e.fiber_g
        daily[date_str]["iron_mg"] += e.iron_mg
        daily[date_str]["calcium_mg"] += e.calcium_mg
        daily[date_str]["vitamin_d_mcg"] += e.vitamin_d_mcg
        daily[date_str]["vitamin_b12_mcg"] += e.vitamin_b12_mcg
        daily[date_str]["folate_mcg"] += e.folate_mcg
        daily[date_str]["vitamin_a_mcg"] += e.vitamin_a_mcg
        daily[date_str]["vitamin_c_mg"] += e.vitamin_c_mg
        daily[date_str]["magnesium_mg"] += e.magnesium_mg
        daily[date_str]["zinc_mg"] += e.zinc_mg

    REQUIRED_MEALS = {"Breakfast", "Lunch", "Snack", "Dinner"}
    complete_dates = sorted(d for d, meals in days_map.items() if meals >= REQUIRED_MEALS)

    has_consecutive_streak = False
    if len(complete_dates) >= 7:
        date_objs = [datetime.strptime(d, "%Y-%m-%d").date() for d in complete_dates]
        current_streak = 1
        for i in range(1, len(date_objs)):
            if (date_objs[i] - date_objs[i - 1]).days == 1:
                current_streak += 1
                if current_streak >= 7:
                    has_consecutive_streak = True
                    break
            else:
                current_streak = 1

    if has_consecutive_streak:
        target_days = [daily[d] for d in complete_dates]
    else:
        target_days = list(daily.values())

    divisor = len(target_days) if target_days else 1
    num_days_logged = len(daily)

    return DiarySummary(
        days_logged=num_days_logged,
        avg_calories_kcal=round(sum(d["calories_kcal"] for d in target_days) / divisor, 1),
        avg_protein_g=round(sum(d["protein_g"] for d in target_days) / divisor, 1),
        avg_carbohydrates_g=round(sum(d["carbohydrates_g"] for d in target_days) / divisor, 1),
        avg_fat_g=round(sum(d["fat_g"] for d in target_days) / divisor, 1),
        avg_fiber_g=round(sum(d["fiber_g"] for d in target_days) / divisor, 1),
        avg_iron_mg=round(sum(d["iron_mg"] for d in target_days) / divisor, 1),
        avg_calcium_mg=round(sum(d["calcium_mg"] for d in target_days) / divisor, 1),
        avg_vitamin_d_mcg=round(sum(d["vitamin_d_mcg"] for d in target_days) / divisor, 1),
        avg_vitamin_b12_mcg=round(sum(d["vitamin_b12_mcg"] for d in target_days) / divisor, 1),
        avg_folate_mcg=round(sum(d["folate_mcg"] for d in target_days) / divisor, 1),
        avg_vitamin_a_mcg=round(sum(d["vitamin_a_mcg"] for d in target_days) / divisor, 1),
        avg_vitamin_c_mg=round(sum(d["vitamin_c_mg"] for d in target_days) / divisor, 1),
        avg_magnesium_mg=round(sum(d["magnesium_mg"] for d in target_days) / divisor, 1),
        avg_zinc_mg=round(sum(d["zinc_mg"] for d in target_days) / divisor, 1),
    )
