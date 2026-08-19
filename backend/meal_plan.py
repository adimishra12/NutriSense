import json
import random
from typing import List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, text
from sqlalchemy.orm import Session

from database import get_db
from models import User, Assessment, HealthProfile, FoodItem, MealPlan
from jwt_utils import get_current_user
from assessment import LABEL_TO_NUTRIENT, NUTRIENT_SORT_COLUMN

router = APIRouter(
    prefix="/meal-plan",
    tags=["Meal Plan"],
)

COMMON_FOOD_NAMES = {
    "Gingelly seeds, black": "Black Sesame Seeds",
    "Gingelly seeds, white": "White Sesame Seeds",
    "Gingelly seeds, brown": "Brown Sesame Seeds",
    "Omum": "Ajwain (Carom Seeds)",
    "Drumstick leaves": "Moringa Leaves",
    "Bengal gram, whole": "Chana (Bengal Gram)",
    "Green gram, whole": "Moong (Green Gram)",
    "Red gram, whole": "Toor (Pigeon Pea)",
    "Black gram, whole": "Urad (Black Gram)",
    "Cowpea, brown": "Lobia (Cowpea)",
    "Lentil": "Masoor (Lentil)",
    "Moth bean": "Matki (Moth Bean)",
    "Rajmah, red": "Rajma (Red Kidney Beans)",
    "Horse gram, whole": "Kulthi (Horse Gram)",
    "Amaranth seed, black": "Rajgira (Amaranth)",
    "Bajra": "Bajra (Pearl Millet)",
    "Jowar": "Jowar (Sorghum)",
    "Ragi": "Ragi (Finger Millet)",
    "Fenugreek seeds": "Methi Seeds (Fenugreek)",
    "Coriander seeds": "Dhania Seeds (Coriander)",
    "Cumin seeds": "Jeera (Cumin)",
    "Mustard seeds": "Sarson (Mustard Seeds)",
    "Curry leaves": "Kadi Patta (Curry Leaves)",
    "Mint leaves": "Pudina (Mint)",
    "Coriander leaves": "Dhania Leaves (Coriander)",
    "Fenugreek leaves": "Methi Leaves (Fenugreek)",
    "Amaranth leaves": "Chaulai (Amaranth Leaves)",
    "Spinach leaves": "Palak (Spinach)",
    "Radish leaves": "Mooli Leaves (Radish)",
    "Bitter gourd": "Karela (Bitter Gourd)",
    "Bottle gourd": "Lauki (Bottle Gourd)",
    "Ridge gourd": "Turai (Ridge Gourd)",
    "Snake gourd": "Chichinda (Snake Gourd)",
    "Pointed gourd": "Parwal (Pointed Gourd)",
    "Ivy gourd": "Tindora (Ivy Gourd)",
    "Ash gourd": "Petha (Ash Gourd)",
    "Brinjal": "Baingan (Eggplant)",
    "Lady finger": "Bhindi (Okra)",
    "Cluster beans": "Gawar Phali (Cluster Beans)",
    "French beans": "Green Beans",
    "Jackfruit, raw": "Kathal (Raw Jackfruit)",
    "Green plantain": "Kachcha Kela (Raw Banana)",
    "Colocasia": "Arbi (Colocasia)",
    "Yam": "Jimikand (Yam)",
    "Sweet potato": "Shakarkandi (Sweet Potato)",
    "Tapioca": "Sabudana/Cassava (Tapioca)",
    "Gooseberry, Indian": "Amla (Indian Gooseberry)",
    "Guava": "Amrood (Guava)",
    "Pomegranate": "Anar (Pomegranate)",
    "Watermelon": "Tarbooz (Watermelon)",
    "Muskmelon": "Kharbuja (Muskmelon)",
    "Papaya, ripe": "Papeeta (Papaya)",
    "Mango, ripe": "Aam (Mango)",
    "Sapota": "Chikoo (Sapota)",
    "Custard apple": "Sitaphal (Custard Apple)",
    "Wood apple": "Bael (Wood Apple)",
    "Bengal gram, dhal": "Chana Dal",
    "Green gram, dhal": "Moong Dal",
    "Red gram, dhal": "Toor Dal",
    "Black gram, dhal": "Urad Dal",
}

@router.get("/latest")
def get_latest_meal_plan(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    latest_assessment = (
        db.query(Assessment)
        .filter(Assessment.user_id == current_user.id)
        .order_by(desc(Assessment.created_at))
        .first()
    )
    
    if not latest_assessment:
        raise HTTPException(status_code=404, detail="No assessment found.")

    meal_plan = (
        db.query(MealPlan)
        .filter(
            MealPlan.user_id == current_user.id,
            MealPlan.assessment_id == latest_assessment.id,
            MealPlan.is_active == True
        )
        .order_by(desc(MealPlan.created_at))
        .first()
    )

    if not meal_plan:
        raise HTTPException(status_code=404, detail="No meal plan found for current assessment.")

    return {
        "id": meal_plan.id,
        "focus_nutrients": meal_plan.focus_nutrients,
        "diet_filter": meal_plan.diet_filter,
        "plan": json.loads(meal_plan.plan_json),
    }

@router.post("/generate")
def generate_meal_plan(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    latest_assessment = (
        db.query(Assessment)
        .filter(Assessment.user_id == current_user.id)
        .order_by(desc(Assessment.created_at))
        .first()
    )
    if not latest_assessment:
        raise HTTPException(status_code=400, detail="Must complete assessment first.")

    profile = db.query(HealthProfile).filter(HealthProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=400, detail="Health profile missing.")

    risks_list = json.loads(latest_assessment.risks_json)
    deficient_nutrients = [
        r["nutrient"] for r in risks_list if r["probability"] > 0.45
    ]
    if not deficient_nutrients:
        deficient_nutrients = [r["nutrient"] for r in risks_list[:3]]

    restrictions = []
    if profile.diet_restrictions:
        restrictions = [r.strip() for r in profile.diet_restrictions.split(",")]

    query = db.query(FoodItem).filter(FoodItem.data_type == 'curated')
    if "Vegetarian" in restrictions:
        query = query.filter(FoodItem.is_vegetarian == True)
    if "Vegan" in restrictions:
        query = query.filter(FoodItem.is_vegan == True)
    if "Gluten-free" in restrictions:
        query = query.filter(FoodItem.is_gluten_free == True)
    if "Dairy-free" in restrictions:
        query = query.filter(FoodItem.is_dairy_free == True)
    if "Nut allergy" in restrictions:
        query = query.filter(FoodItem.is_nut_free == True)

    # We need 84 foods total (7 days * 4 meals * 3 foods per meal).
    # Let's gather foods that are high in the deficient nutrients.
    candidate_foods = []
    used_food_ids = set()

    for nutrient in deficient_nutrients:
        col_name = NUTRIENT_SORT_COLUMN.get(nutrient.lower())
        if not col_name:
            continue
        sort_col = getattr(FoodItem, col_name)
        
        foods = query.filter(sort_col > 0).order_by(desc(sort_col)).limit(60).all()
        for f in foods:
            if f.id not in used_food_ids:
                candidate_foods.append(f)
                used_food_ids.add(f.id)

    if len(candidate_foods) < 84:
        # Fallback to all food types if curated isn't enough
        fallback_query = db.query(FoodItem)
        if "Vegetarian" in restrictions:
            fallback_query = fallback_query.filter(FoodItem.is_vegetarian == True)
        if "Vegan" in restrictions:
            fallback_query = fallback_query.filter(FoodItem.is_vegan == True)
        if "Gluten-free" in restrictions:
            fallback_query = fallback_query.filter(FoodItem.is_gluten_free == True)
        if "Dairy-free" in restrictions:
            fallback_query = fallback_query.filter(FoodItem.is_dairy_free == True)
        if "Nut allergy" in restrictions:
            fallback_query = fallback_query.filter(FoodItem.is_nut_free == True)

        extra_foods = fallback_query.order_by(text("RANDOM()")).limit(300).all()
        for f in extra_foods:
            if f.id not in used_food_ids:
                candidate_foods.append(f)
                used_food_ids.add(f.id)
            if len(candidate_foods) >= 120:
                break

    if len(candidate_foods) < 84:
        raise HTTPException(status_code=500, detail="Not enough foods in database to generate a 7-day non-repeating plan.")

    random.shuffle(candidate_foods)

    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    plan_data = []
    
    food_index = 0
    def get_next_food():
        nonlocal food_index
        f = candidate_foods[food_index]
        food_index += 1
        display_name = COMMON_FOOD_NAMES.get(f.name, f.name)
        return {
            "id": f.id,
            "name": display_name,
            "data_type": "USDA" if f.data_type == "usda" else ("IFCT" if f.data_type == "ifct" else "Curated"),
        }

    for day_name in days:
        day_plan = {
            "day": day_name,
            "meals": {}
        }
        for meal in ["breakfast", "lunch", "snack", "dinner"]:
            food1 = get_next_food()
            food2 = get_next_food()
            food3 = get_next_food()
            
            day_plan["meals"][meal] = {
                "foods": [food1, food2, food3],
                "targets": deficient_nutrients
            }
        plan_data.append(day_plan)

    db.query(MealPlan).filter(
        MealPlan.user_id == current_user.id
    ).update({"is_active": False})

    new_plan = MealPlan(
        user_id=current_user.id,
        assessment_id=latest_assessment.id,
        focus_nutrients=", ".join(deficient_nutrients),
        diet_filter=", ".join(restrictions) if restrictions else "None",
        plan_json=json.dumps(plan_data),
        is_active=True,
    )
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)

    return {
        "id": new_plan.id,
        "focus_nutrients": new_plan.focus_nutrients,
        "diet_filter": new_plan.diet_filter,
        "plan": plan_data,
    }
