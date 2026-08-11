import urllib.request
import csv
import json
import os

import ssl

url = "https://unpkg.com/@ifct2017/compositions/index.csv"
output_json = "/Users/adityamishra/Documents/GitHub/AI-Based-Nutritional-Assessment-Sys-for-Deficiency-Detection---Personalized-Meal-Planning-July-2026/backend/ifct_data.json"
temp_csv = "/tmp/ifct_temp.csv"

def run():
    print("Downloading IFCT CSV...")
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, context=ctx) as response, open(temp_csv, 'wb') as out_file:
        out_file.write(response.read())
    
    data = {}
    print("Parsing CSV...")
    with open(temp_csv, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            code = row.get("Food Code; code", "").strip()
            if not code:
                continue
                
            name = row.get("Food Name; name", "").strip()
            
            def safe_float(val):
                try:
                    return float(val)
                except:
                    return 0.0

            # Map IFCT columns to our schema
            calories = safe_float(row.get("Energy; enerc"))
            protein = safe_float(row.get("Protein; protcnt"))
            carbs = safe_float(row.get("Carbohydrate; choavldf"))
            fat = safe_float(row.get("Total Fat; fatce"))
            fiber = safe_float(row.get("Dietary Fiber; fibtg"))
            iron = safe_float(row.get("Iron (Fe); fe"))
            calcium = safe_float(row.get("Calcium (Ca); ca"))
            vit_d = safe_float(row.get("Vitamin D; vitd"))
            vit_b12 = 0.0 # B12 generally not listed for IFCT plant foods
            folate = safe_float(row.get("Folates (B9); folsum"))
            vit_a = safe_float(row.get("Vitamin A; vita"))

            data[code] = {
                "source": "ifct",
                "external_id": code,
                "name": name,
                "serving_size": 100,
                "serving_unit": "g",
                "calories": calories,
                "protein_g": protein,
                "carbohydrates_g": carbs,
                "fat_g": fat,
                "fiber_g": fiber,
                "iron_mg": iron,
                "calcium_mg": calcium,
                "vitamin_d_mcg": vit_d,
                "vitamin_b12_mcg": vit_b12,
                "folate_mcg": folate,
                "vitamin_a_mcg": vit_a
            }
            
    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
        
    print(f"Saved {len(data)} foods to {output_json}")

if __name__ == "__main__":
    run()
