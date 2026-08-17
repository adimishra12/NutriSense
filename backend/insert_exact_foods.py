import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))
from database import SessionLocal
from models import FoodItem

FOODS_TO_INSERT = {
    "Oats, dry": {"calories_kcal": 389, "protein_g": 16.9, "calcium_mg": 54, "vitamin_b12_mcg": 0, "vitamin_d_mcg": 0, "iron_mg": 4.7, "folate_mcg": 56, "vitamin_a_mcg": 0, "vitamin_c_mg": 0, "magnesium_mg": 177, "zinc_mg": 3.97, "carbohydrates_g": 66.3, "fat_g": 6.9, "fiber_g": 10.6},
    "Banana": {"calories_kcal": 89, "protein_g": 1.1, "calcium_mg": 5, "vitamin_b12_mcg": 0, "vitamin_d_mcg": 0, "iron_mg": 0.3, "folate_mcg": 20, "vitamin_a_mcg": 3, "vitamin_c_mg": 8.7, "magnesium_mg": 27, "zinc_mg": 0.15, "carbohydrates_g": 22.8, "fat_g": 0.3, "fiber_g": 2.6},
    "Peanuts, roasted": {"calories_kcal": 585, "protein_g": 23.7, "calcium_mg": 54, "vitamin_b12_mcg": 0, "vitamin_d_mcg": 0, "iron_mg": 2.26, "folate_mcg": 145, "vitamin_a_mcg": 0, "vitamin_c_mg": 0, "magnesium_mg": 176, "zinc_mg": 3.27, "carbohydrates_g": 21.3, "fat_g": 49.7, "fiber_g": 8.0},
    "Brown rice, cooked": {"calories_kcal": 112, "protein_g": 2.3, "calcium_mg": 3, "vitamin_b12_mcg": 0, "vitamin_d_mcg": 0, "iron_mg": 0.4, "folate_mcg": 4, "vitamin_a_mcg": 0, "vitamin_c_mg": 0, "magnesium_mg": 43, "zinc_mg": 0.6, "carbohydrates_g": 23.5, "fat_g": 0.8, "fiber_g": 1.8},
    "Lentils, cooked (masoor dal)": {"calories_kcal": 116, "protein_g": 9.0, "calcium_mg": 19, "vitamin_b12_mcg": 0, "vitamin_d_mcg": 0, "iron_mg": 3.3, "folate_mcg": 181, "vitamin_a_mcg": 0, "vitamin_c_mg": 1.5, "magnesium_mg": 36, "zinc_mg": 1.3, "carbohydrates_g": 20.1, "fat_g": 0.4, "fiber_g": 7.9},
    "Cucumber": {"calories_kcal": 15, "protein_g": 0.65, "calcium_mg": 16, "vitamin_b12_mcg": 0, "vitamin_d_mcg": 0, "iron_mg": 0.28, "folate_mcg": 7, "vitamin_a_mcg": 5, "vitamin_c_mg": 2.8, "magnesium_mg": 13, "zinc_mg": 0.2, "carbohydrates_g": 3.6, "fat_g": 0.1, "fiber_g": 0.5},
    "Roasted chana": {"calories_kcal": 378, "protein_g": 20.0, "calcium_mg": 105, "vitamin_b12_mcg": 0, "vitamin_d_mcg": 0, "iron_mg": 6.2, "folate_mcg": 437, "vitamin_a_mcg": 2, "vitamin_c_mg": 0, "magnesium_mg": 115, "zinc_mg": 3.4, "carbohydrates_g": 63.0, "fat_g": 6.0, "fiber_g": 12.0},
    "Orange": {"calories_kcal": 47, "protein_g": 0.94, "calcium_mg": 40, "vitamin_b12_mcg": 0, "vitamin_d_mcg": 0, "iron_mg": 0.1, "folate_mcg": 30, "vitamin_a_mcg": 11, "vitamin_c_mg": 53.2, "magnesium_mg": 10, "zinc_mg": 0.07, "carbohydrates_g": 11.8, "fat_g": 0.1, "fiber_g": 2.4},
    "Whole wheat roti": {"calories_kcal": 297, "protein_g": 9.6, "calcium_mg": 22, "vitamin_b12_mcg": 0, "vitamin_d_mcg": 0, "iron_mg": 2.7, "folate_mcg": 36, "vitamin_a_mcg": 0, "vitamin_c_mg": 0, "magnesium_mg": 71, "zinc_mg": 1.4, "carbohydrates_g": 46.4, "fat_g": 8.0, "fiber_g": 8.5},
    "Rajma (kidney beans), cooked": {"calories_kcal": 127, "protein_g": 8.7, "calcium_mg": 28, "vitamin_b12_mcg": 0, "vitamin_d_mcg": 0, "iron_mg": 2.9, "folate_mcg": 130, "vitamin_a_mcg": 0, "vitamin_c_mg": 1.2, "magnesium_mg": 45, "zinc_mg": 1.1, "carbohydrates_g": 22.8, "fat_g": 0.5, "fiber_g": 6.4},
    "Tomato, raw": {"calories_kcal": 18, "protein_g": 0.88, "calcium_mg": 10, "vitamin_b12_mcg": 0, "vitamin_d_mcg": 0, "iron_mg": 0.27, "folate_mcg": 15, "vitamin_a_mcg": 42, "vitamin_c_mg": 13.7, "magnesium_mg": 11, "zinc_mg": 0.17, "carbohydrates_g": 3.9, "fat_g": 0.2, "fiber_g": 1.2},
    "Whole grain bread": {"calories_kcal": 252, "protein_g": 12.4, "calcium_mg": 161, "vitamin_b12_mcg": 0, "vitamin_d_mcg": 0, "iron_mg": 2.5, "folate_mcg": 45, "vitamin_a_mcg": 0, "vitamin_c_mg": 0, "magnesium_mg": 76, "zinc_mg": 1.7, "carbohydrates_g": 42.7, "fat_g": 3.5, "fiber_g": 6.0},
    "Amla (Indian gooseberry)": {"calories_kcal": 44, "protein_g": 0.88, "calcium_mg": 25, "vitamin_b12_mcg": 0, "vitamin_d_mcg": 0, "iron_mg": 0.31, "folate_mcg": 6, "vitamin_a_mcg": 14, "vitamin_c_mg": 27.7, "magnesium_mg": 10, "zinc_mg": 0.12, "carbohydrates_g": 10.2, "fat_g": 0.6, "fiber_g": 4.3},
    "Quinoa, cooked": {"calories_kcal": 120, "protein_g": 4.4, "calcium_mg": 17, "vitamin_b12_mcg": 0, "vitamin_d_mcg": 0, "iron_mg": 1.5, "folate_mcg": 42, "vitamin_a_mcg": 0, "vitamin_c_mg": 0, "magnesium_mg": 64, "zinc_mg": 1.1, "carbohydrates_g": 21.3, "fat_g": 1.9, "fiber_g": 2.8},
    "Chickpeas, cooked": {"calories_kcal": 164, "protein_g": 8.9, "calcium_mg": 49, "vitamin_b12_mcg": 0, "vitamin_d_mcg": 0, "iron_mg": 2.9, "folate_mcg": 172, "vitamin_a_mcg": 1, "vitamin_c_mg": 1.3, "magnesium_mg": 48, "zinc_mg": 1.5, "carbohydrates_g": 27.4, "fat_g": 2.6, "fiber_g": 7.6},
    "Carrot, raw": {"calories_kcal": 41, "protein_g": 0.93, "calcium_mg": 33, "vitamin_b12_mcg": 0, "vitamin_d_mcg": 0, "iron_mg": 0.3, "folate_mcg": 19, "vitamin_a_mcg": 835, "vitamin_c_mg": 5.9, "magnesium_mg": 12, "zinc_mg": 0.24, "carbohydrates_g": 9.6, "fat_g": 0.2, "fiber_g": 2.8},
    "Guava": {"calories_kcal": 68, "protein_g": 2.55, "calcium_mg": 18, "vitamin_b12_mcg": 0, "vitamin_d_mcg": 0, "iron_mg": 0.26, "folate_mcg": 49, "vitamin_a_mcg": 31, "vitamin_c_mg": 228.3, "magnesium_mg": 22, "zinc_mg": 0.23, "carbohydrates_g": 14.3, "fat_g": 1.0, "fiber_g": 5.4},
    "Potato, baked": {"calories_kcal": 93, "protein_g": 2.5, "calcium_mg": 15, "vitamin_b12_mcg": 0, "vitamin_d_mcg": 0, "iron_mg": 1.1, "folate_mcg": 28, "vitamin_a_mcg": 0, "vitamin_c_mg": 9.6, "magnesium_mg": 28, "zinc_mg": 0.3, "carbohydrates_g": 21.2, "fat_g": 0.1, "fiber_g": 2.2},
    "Broccoli, cooked": {"calories_kcal": 35, "protein_g": 2.4, "calcium_mg": 40, "vitamin_b12_mcg": 0, "vitamin_d_mcg": 0, "iron_mg": 0.67, "folate_mcg": 108, "vitamin_a_mcg": 77, "vitamin_c_mg": 64.9, "magnesium_mg": 21, "zinc_mg": 0.45, "carbohydrates_g": 7.2, "fat_g": 0.4, "fiber_g": 3.3},
    "Pumpkin seeds": {"calories_kcal": 574, "protein_g": 29.8, "calcium_mg": 55, "vitamin_b12_mcg": 0, "vitamin_d_mcg": 0, "iron_mg": 8.1, "folate_mcg": 58, "vitamin_a_mcg": 0, "vitamin_c_mg": 1.9, "magnesium_mg": 550, "zinc_mg": 7.6, "carbohydrates_g": 14.7, "fat_g": 49.1, "fiber_g": 6.5},
    "Sweet potato, baked": {"calories_kcal": 90, "protein_g": 2.0, "calcium_mg": 38, "vitamin_b12_mcg": 0, "vitamin_d_mcg": 0, "iron_mg": 0.69, "folate_mcg": 6, "vitamin_a_mcg": 961, "vitamin_c_mg": 19.6, "magnesium_mg": 27, "zinc_mg": 0.32, "carbohydrates_g": 20.7, "fat_g": 0.2, "fiber_g": 3.3},
}

def insert_exact_foods():
    db = SessionLocal()
    
    count = 0
    for food_name, nuts in FOODS_TO_INSERT.items():
        existing = db.query(FoodItem).filter_by(name=food_name).first()
        if not existing:
            item = FoodItem(
                name=food_name,
                tags="mentor_exact",
                calories_kcal=nuts["calories_kcal"],
                protein_g=nuts["protein_g"],
                carbohydrates_g=nuts["carbohydrates_g"],
                fat_g=nuts["fat_g"],
                fiber_g=nuts["fiber_g"],
                iron_mg=nuts["iron_mg"],
                calcium_mg=nuts["calcium_mg"],
                vitamin_d_mcg=nuts["vitamin_d_mcg"],
                vitamin_b12_mcg=nuts["vitamin_b12_mcg"],
                folate_mcg=nuts["folate_mcg"],
                vitamin_a_mcg=nuts["vitamin_a_mcg"],
                vitamin_c_mg=nuts["vitamin_c_mg"],
                magnesium_mg=nuts["magnesium_mg"],
                zinc_mg=nuts["zinc_mg"],
                is_vegetarian=True,
                is_vegan=True,
                is_gluten_free=True,
                is_dairy_free=True,
                is_nut_free=True
            )
            db.add(item)
            count += 1
            
    db.commit()
    db.close()
    print(f"Inserted {count} exact mentor foods.")

if __name__ == "__main__":
    insert_exact_foods()
