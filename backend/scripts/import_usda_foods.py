import json
import os
import sys

# Add parent directory to path to import backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

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

def import_usda():
    json_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "usda_raw", "foundation_sample.json")
    
    if not os.path.exists(json_path):
        print(f"Error: {json_path} not found. Run download_usda.sh first.")
        sys.exit(1)
        
    print("Initializing database...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    print("Reading USDA data...")
    count = 0
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        foods = data.get("foods", [])
        
        for food in foods:
            external_id = str(food.get("fdcId", ""))
            name = food.get("description", "")
            
            if not external_id or not name:
                continue
                
            nutrients = _extract_usda_nutrients(food.get("foodNutrients", []))
            
            # Check if exists
            existing = db.query(FoodItem).filter_by(fdc_id=external_id).first()
            if not existing:
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
                    data_type="usda",
                    serving_description="100g",
                    serving_gram_weight=100.0,
                    ingredients=""
                )
                db.add(food_item)
                count += 1

    db.commit()
    db.close()
    print(f"Successfully imported {count} new USDA food items into the database.")

if __name__ == "__main__":
    import_usda()
