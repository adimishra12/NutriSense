import sqlite3
import os
import shutil
from datetime import datetime, timezone

def migrate():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(base_dir, "data")
    db_path = os.path.join(data_dir, "nutrisense.db")
    bak_path = os.path.join(data_dir, "nutrisense.db.bak")

    if not os.path.exists(db_path):
        print("No existing database found to migrate.")
        return

    # Backup
    print("Backing up database...")
    shutil.copy2(db_path, bak_path)

    # Read old data using sqlite3
    old_conn = sqlite3.connect(bak_path)
    old_conn.row_factory = sqlite3.Row
    old_c = old_conn.cursor()

    old_users = old_c.execute("SELECT * FROM users").fetchall()
    
    # We check if old tables exist to prevent crashing on re-runs
    old_health_profiles = []
    try:
        old_health_profiles = old_c.execute("SELECT * FROM health_profiles").fetchall()
    except: pass
    
    old_food_items = []
    try:
        old_food_items = old_c.execute("SELECT * FROM food_items").fetchall()
    except: pass

    old_diary_entries = []
    try:
        old_diary_entries = old_c.execute("SELECT * FROM diary_entries").fetchall()
    except: pass

    old_conn.close()

    # Drop old db and recreate using SQLAlchemy
    print("Recreating database schema...")
    os.remove(db_path)
    
    import sys
    sys.path.append(base_dir)
    from database import engine, Base
    import models # ensures models are registered
    Base.metadata.create_all(bind=engine)

    new_conn = sqlite3.connect(db_path)
    new_c = new_conn.cursor()

    now_iso = datetime.now(timezone.utc).isoformat()

    print(f"Migrating {len(old_users)} users...")
    for u in old_users:
        full_name = f"{u['first_name']} {u['last_name']}".strip()
        new_c.execute(
            "INSERT INTO users (id, email, password_hash, full_name, created_at) VALUES (?, ?, ?, ?, ?)",
            (u['id'], u['email'], u['password'], full_name, now_iso)
        )

    print(f"Migrating {len(old_health_profiles)} health profiles...")
    for hp_row in old_health_profiles:
        hp = dict(hp_row)
        # Determine gender int. Assuming 'male' -> 0, 'female' -> 1
        gender_int = 0 if str(hp.get('gender', 'male')).lower() == 'male' else 1
        new_c.execute(
            """INSERT INTO health_profiles 
            (id, user_id, age_years, gender, height_cm, weight_kg, activity_level, health_goal, diet_restrictions, conditions) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (hp['id'], hp['user_id'], hp['age'], gender_int, hp['height_cm'], hp['weight_kg'], 
             hp['activity_level'], hp['health_goal'], hp['dietary_preference'], hp.get('allergies', 'none'))
        )

    print(f"Migrating {len(old_food_items)} food items...")
    for f_row in old_food_items:
        f = dict(f_row)
        tags = f"{f['source']}, {f['external_id']}"
        new_c.execute(
            """INSERT INTO food_items 
            (id, name, tags, calories_kcal, protein_g, iron_mg, calcium_mg, vitamin_d_mcg, vitamin_b12_mcg, 
            folate_mcg, vitamin_a_mcg, vitamin_c_mg, magnesium_mg, zinc_mg, carbohydrates_g, fat_g, fiber_g, 
            is_vegetarian, is_vegan, fdc_id, data_type, serving_description, serving_gram_weight, ingredients) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (f['id'], f['name'], tags, f.get('calories', 0), f.get('protein_g', 0), f.get('iron_mg', 0), 
             f.get('calcium_mg', 0), f.get('vitamin_d_mcg', 0), f.get('vitamin_b12_mcg', 0), f.get('folate_mcg', 0), 
             f.get('vitamin_a_mcg', 0), 0, 0, 0, f.get('carbohydrates_g', 0), f.get('fat_g', 0), f.get('fiber_g', 0),
             True if f['source']=='ifct' else False, False, f['external_id'], f['source'], "100g", f.get('serving_gram_weight', 100), "")
        )

    print(f"Migrating {len(old_diary_entries)} diary entries...")
    for d_row in old_diary_entries:
        d = dict(d_row)
        new_c.execute(
            """INSERT INTO diary_entries 
            (id, user_id, entry_date, meal_type, food_id, food_name, portion_grams, calories_kcal, protein_g, iron_mg, calcium_mg, 
            vitamin_d_mcg, vitamin_b12_mcg, folate_mcg, vitamin_a_mcg, vitamin_c_mg, magnesium_mg, zinc_mg, carbohydrates_g, fat_g, fiber_g, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (d['id'], d['user_id'], d['date'], d['meal_type'], d['food_id'], d['food_name'], d['portion_grams'],
             d.get('calories', 0), d.get('protein_g', 0), d.get('iron_mg', 0), d.get('calcium_mg', 0), d.get('vitamin_d_mcg', 0),
             d.get('vitamin_b12_mcg', 0), d.get('folate_mcg', 0), d.get('vitamin_a_mcg', 0), 0, 0, 0, 
             d.get('carbohydrates_g', 0), d.get('fat_g', 0), d.get('fiber_g', 0), now_iso)
        )

    new_conn.commit()
    new_conn.close()
    print("Migration complete!")

if __name__ == "__main__":
    migrate()
