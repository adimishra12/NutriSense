import csv
import os
import sys

# Ensure backend directory is in path for imports
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from database import SessionLocal, engine
from models import FoodItem, Base

def safe_float(val):
    try:
        return float(val)
    except:
        return 0.0

def import_ifct_foods(replace: bool = False):
    csv_path = os.path.join(backend_dir, "data", "ifct2017", "compositions.csv")
    
    if not os.path.exists(csv_path):
        print(f"Error: {csv_path} not found. Run download_ifct.sh first.")
        return
        
    print("Initializing database...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    print("Reading IFCT data...")
    count = 0
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            code = row.get("Food Code; code", "").strip()
            if not code:
                continue
                
            name = row.get("Food Name; name", "").strip()
            
            # Map IFCT columns
            calories = safe_float(row.get("Energy; enerc"))
            protein = safe_float(row.get("Protein; protcnt"))
            carbs = safe_float(row.get("Carbohydrate; choavldf"))
            fat = safe_float(row.get("Total Fat; fatce"))
            fiber = safe_float(row.get("Dietary Fiber; fibtg"))
            iron = safe_float(row.get("Iron (Fe); fe")) * 1000
            calcium = safe_float(row.get("Calcium (Ca); ca")) * 1000
            vit_d = safe_float(row.get("Vitamin D; vitd")) * 1000000
            vit_b12 = 0.0 # B12 generally not listed
            folate = safe_float(row.get("Folates (B9); folsum")) * 1000000
            vit_a = safe_float(row.get("Vitamin A; vita")) * 1000000
            vit_c = safe_float(row.get("Vitamin C; vitc")) * 1000
            magnesium = safe_float(row.get("Magnesium (Mg); mg")) * 1000
            zinc = safe_float(row.get("Zinc (Zn); zn")) * 1000
            
            # Check if exists
            existing = db.query(FoodItem).filter_by(fdc_id=code, data_type="ifct").first()
            if not existing:
                # Also check by name as fallback since previous imports used name + tags
                existing = db.query(FoodItem).filter_by(name=name, data_type="ifct").first()

            if existing:
                if replace:
                    existing.name = name
                    existing.calories_kcal = calories
                    existing.protein_g = protein
                    existing.carbohydrates_g = carbs
                    existing.fat_g = fat
                    existing.fiber_g = fiber
                    existing.iron_mg = iron
                    existing.calcium_mg = calcium
                    existing.vitamin_d_mcg = vit_d
                    existing.vitamin_b12_mcg = vit_b12
                    existing.folate_mcg = folate
                    existing.vitamin_a_mcg = vit_a
                    existing.vitamin_c_mg = vit_c
                    existing.magnesium_mg = magnesium
                    existing.zinc_mg = zinc
                    count += 1
                continue
                
            item = FoodItem(
                name=name,
                tags=f"ifct, {code}",
                calories_kcal=calories,
                protein_g=protein,
                carbohydrates_g=carbs,
                fat_g=fat,
                fiber_g=fiber,
                iron_mg=iron,
                calcium_mg=calcium,
                vitamin_d_mcg=vit_d,
                vitamin_b12_mcg=vit_b12,
                folate_mcg=folate,
                vitamin_a_mcg=vit_a,
                vitamin_c_mg=vit_c,
                magnesium_mg=magnesium,
                zinc_mg=zinc,
                is_vegetarian=True, # Default reasonable for IFCT unless specified
                is_vegan=False,
                fdc_id=code,
                data_type="ifct",
                serving_description="100g",
                serving_gram_weight=100.0,
                ingredients=""
            )
            db.add(item)
            count += 1

    db.commit()
    db.close()
    print(f"Successfully processed {count} IFCT food items.")
