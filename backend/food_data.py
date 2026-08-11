from sqlalchemy.orm import Session
from typing import List, Dict, Any
from models import FoodItem

def get_food_by_id(db: Session, food_id: int) -> Dict[str, Any]:
    """Retrieve a specific food item's 100g base nutrients by its primary key from DB."""
    food = db.query(FoodItem).filter(
        FoodItem.id == food_id
    ).first()

    if not food:
        return None

    return {
        "id": food.id,
        "name": food.name,
        "tags": food.tags,
        "calories_kcal": food.calories_kcal,
        "protein_g": food.protein_g,
        "carbohydrates_g": food.carbohydrates_g,
        "fat_g": food.fat_g,
        "fiber_g": food.fiber_g,
        "iron_mg": food.iron_mg,
        "calcium_mg": food.calcium_mg,
        "vitamin_d_mcg": food.vitamin_d_mcg,
        "vitamin_b12_mcg": food.vitamin_b12_mcg,
        "folate_mcg": food.folate_mcg,
        "vitamin_a_mcg": food.vitamin_a_mcg,
        "vitamin_c_mg": food.vitamin_c_mg,
        "magnesium_mg": food.magnesium_mg,
        "zinc_mg": food.zinc_mg,
        "is_vegetarian": food.is_vegetarian,
        "is_vegan": food.is_vegan,
        "fdc_id": food.fdc_id,
        "data_type": food.data_type,
        "serving_description": food.serving_description,
        "serving_gram_weight": food.serving_gram_weight,
        "ingredients": food.ingredients,
    }


from sqlalchemy import or_

def search_foods(db: Session, query: str, limit: int = 20) -> List[Dict[str, Any]]:
    """Search for food items in the database by name or tags."""
    foods = db.query(FoodItem).filter(
        or_(
            FoodItem.name.ilike(f"%{query}%"),
            FoodItem.tags.ilike(f"%{query}%")
        )
    ).limit(limit).all()

    results = []
    for food in foods:
        results.append({
            "id": food.id,
            "name": food.name,
            "tags": food.tags,
            "calories_kcal": food.calories_kcal,
            "protein_g": food.protein_g,
            "carbohydrates_g": food.carbohydrates_g,
            "fat_g": food.fat_g,
            "fiber_g": food.fiber_g,
            "iron_mg": food.iron_mg,
            "calcium_mg": food.calcium_mg,
            "vitamin_d_mcg": food.vitamin_d_mcg,
            "vitamin_b12_mcg": food.vitamin_b12_mcg,
            "folate_mcg": food.folate_mcg,
            "vitamin_a_mcg": food.vitamin_a_mcg,
            "vitamin_c_mg": food.vitamin_c_mg,
            "magnesium_mg": food.magnesium_mg,
            "zinc_mg": food.zinc_mg,
            "is_vegetarian": food.is_vegetarian,
            "is_vegan": food.is_vegan,
            "fdc_id": food.fdc_id,
            "data_type": food.data_type,
            "serving_description": food.serving_description,
            "serving_gram_weight": food.serving_gram_weight,
            "ingredients": food.ingredients,
        })
    return results
