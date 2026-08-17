import json
import os
import sys

# Ensure backend directory is in path for imports
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from database import SessionLocal, engine
from models import FoodItem, Base

def _extract_usda_nutrients(nutrients_list):
    """Extract standard nutrients per 100g from USDA API response."""
    result = {}
    nutrient_map = {
        "208": "calories",
        "203": "protein_g",
        "205": "carbohydrates_g",
        "204": "fat_g",
        "291": "fiber_g",
        "303": "iron_mg",
        "301": "calcium_mg",
        "328": "vitamin_d_mcg",
        "418": "vitamin_b12_mcg",
        "417": "folate_mcg",
        "320": "vitamin_a_mcg",
        "318": "vitamin_a_mcg",
        "401": "vitamin_c_mg",
        "304": "magnesium_mg",
        "309": "zinc_mg"
    }
    
    for n in nutrients_list:
        n_num = str(n.get("nutrientNumber") or n.get("nutrient", {}).get("number") or "")
        amount = n.get("value") or n.get("amount") or 0.0
        
        if n_num in nutrient_map:
            result[nutrient_map[n_num]] = float(amount)
            
    return result

def import_foods(include_branded: bool = False, limit: int = None, replace: bool = True):
    base_raw = os.path.join(backend_dir, "..", "scratch", "usda")
    files_to_process = [
        (os.path.join(base_raw, "FoodData_Central_foundation_food_json_2026-04-30.json"), "foundation_food", "FoundationFoods")
    ]
    
    print("Initializing database...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    count = 0
    for json_path, data_type, array_key in files_to_process:
        if not os.path.exists(json_path):
            print(f"Error: {json_path} not found. Ensure you extracted the zip files.")
            continue
            
        print(f"Reading {json_path}...")
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            foods = data.get(array_key, []) or data.get("foods", [])
            if not foods and isinstance(data, list):
                foods = data
                
            for food in foods:
                if not food:
                    continue
                    
                if limit is not None and count >= limit:
                    break
                    
                external_id = str(food.get("fdcId", ""))
                name = food.get("description", "")
                
                if not external_id or not name:
                    continue
                    
                food_class = food.get("foodClass", "")
                if not include_branded and food_class == "Branded":
                    continue
                    
                nutrients = _extract_usda_nutrients(food.get("foodNutrients", []))
                
                existing = db.query(FoodItem).filter_by(fdc_id=external_id).first()
                if existing:
                    if replace:
                        existing.name = name
                        existing.calories_kcal = nutrients.get("calories", 0.0)
                        existing.protein_g = nutrients.get("protein_g", 0.0)
                        existing.carbohydrates_g = nutrients.get("carbohydrates_g", 0.0)
                        existing.fat_g = nutrients.get("fat_g", 0.0)
                        existing.fiber_g = nutrients.get("fiber_g", 0.0)
                        existing.iron_mg = nutrients.get("iron_mg", 0.0)
                        existing.calcium_mg = nutrients.get("calcium_mg", 0.0)
                        existing.vitamin_d_mcg = nutrients.get("vitamin_d_mcg", 0.0)
                        existing.vitamin_b12_mcg = nutrients.get("vitamin_b12_mcg", 0.0)
                        existing.folate_mcg = nutrients.get("folate_mcg", 0.0)
                        existing.vitamin_a_mcg = nutrients.get("vitamin_a_mcg", 0.0)
                        existing.vitamin_c_mg = nutrients.get("vitamin_c_mg", 0.0)
                        existing.magnesium_mg = nutrients.get("magnesium_mg", 0.0)
                        existing.zinc_mg = nutrients.get("zinc_mg", 0.0)
                        existing.data_type = data_type
                        count += 1
                    continue
                    
                food_item = FoodItem(
                    name=name,
                    tags="usda",
                    calories_kcal=nutrients.get("calories", 0.0),
                    protein_g=nutrients.get("protein_g", 0.0),
                    carbohydrates_g=nutrients.get("carbohydrates_g", 0.0),
                    fat_g=nutrients.get("fat_g", 0.0),
                    fiber_g=nutrients.get("fiber_g", 0.0),
                    iron_mg=nutrients.get("iron_mg", 0.0),
                    calcium_mg=nutrients.get("calcium_mg", 0.0),
                    vitamin_d_mcg=nutrients.get("vitamin_d_mcg", 0.0),
                    vitamin_b12_mcg=nutrients.get("vitamin_b12_mcg", 0.0),
                    folate_mcg=nutrients.get("folate_mcg", 0.0),
                    vitamin_a_mcg=nutrients.get("vitamin_a_mcg", 0.0),
                    vitamin_c_mg=nutrients.get("vitamin_c_mg", 0.0),
                    magnesium_mg=nutrients.get("magnesium_mg", 0.0),
                    zinc_mg=nutrients.get("zinc_mg", 0.0),
                    is_vegetarian=False,
                    is_vegan=False,
                    fdc_id=external_id,
                    data_type=data_type,
                    serving_description="100g",
                    serving_gram_weight=100.0,
                    ingredients=""
                )
                db.add(food_item)
                count += 1

    db.commit()
    db.close()
    print(f"Successfully processed {count} USDA food items.")
