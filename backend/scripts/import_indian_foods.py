import csv
import os
import sys

# Add parent directory to path to import backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal, engine
from models import FoodItem, Base

def safe_float(val):
    try:
        return float(val)
    except:
        return 0.0

def import_ifct():
    csv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "ifct2017", "compositions.csv")
    
    if not os.path.exists(csv_path):
        print(f"Error: {csv_path} not found. Run download_ifct.sh first.")
        sys.exit(1)
        
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
            iron = safe_float(row.get("Iron (Fe); fe"))
            calcium = safe_float(row.get("Calcium (Ca); ca"))
            vit_d = safe_float(row.get("Vitamin D; vitd"))
            vit_b12 = 0.0 # B12 generally not listed
            folate = safe_float(row.get("Folates (B9); folsum"))
            vit_a = safe_float(row.get("Vitamin A; vita"))
            vit_c = safe_float(row.get("Vitamin C; vitc"))
            magnesium = safe_float(row.get("Magnesium (Mg); mg"))
            zinc = safe_float(row.get("Zinc (Zn); zn"))
            
            # Check if exists
            existing = db.query(FoodItem).filter_by(name=name, data_type="ifct").first()
            if not existing:
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
    print(f"Successfully imported {count} new IFCT food items into the database.")

if __name__ == "__main__":
    import_ifct()
