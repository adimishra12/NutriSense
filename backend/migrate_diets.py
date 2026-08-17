import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "nutrisense.db")

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Check if columns exist
        cursor.execute("PRAGMA table_info(food_items)")
        columns = [row[1] for row in cursor.fetchall()]
        
        added = False
        if "is_gluten_free" not in columns:
            print("Adding is_gluten_free...")
            cursor.execute("ALTER TABLE food_items ADD COLUMN is_gluten_free BOOLEAN NOT NULL DEFAULT 1")
            added = True
        if "is_dairy_free" not in columns:
            print("Adding is_dairy_free...")
            cursor.execute("ALTER TABLE food_items ADD COLUMN is_dairy_free BOOLEAN NOT NULL DEFAULT 1")
            added = True
        if "is_nut_free" not in columns:
            print("Adding is_nut_free...")
            cursor.execute("ALTER TABLE food_items ADD COLUMN is_nut_free BOOLEAN NOT NULL DEFAULT 1")
            added = True
            
        if added:
            # Basic backfilling based on names
            # Dairy
            dairy_keywords = ['milk', 'cheese', 'paneer', 'yogurt', 'butter', 'cream', 'whey']
            for kw in dairy_keywords:
                cursor.execute(f"UPDATE food_items SET is_dairy_free = 0 WHERE LOWER(name) LIKE '%{kw}%' OR LOWER(ingredients) LIKE '%{kw}%'")
            
            # Gluten
            gluten_keywords = ['wheat', 'bread', 'roti', 'chapati', 'pasta', 'noodle', 'flour', 'barley', 'rye', 'seitan', 'cake', 'biscuit', 'cookie']
            for kw in gluten_keywords:
                cursor.execute(f"UPDATE food_items SET is_gluten_free = 0 WHERE LOWER(name) LIKE '%{kw}%' OR LOWER(ingredients) LIKE '%{kw}%'")
            
            # Nuts
            nut_keywords = ['almond', 'walnut', 'cashew', 'peanut', 'pecan', 'macadamia', 'pistachio', 'hazelnut', 'nut']
            for kw in nut_keywords:
                cursor.execute(f"UPDATE food_items SET is_nut_free = 0 WHERE LOWER(name) LIKE '%{kw}%' OR LOWER(ingredients) LIKE '%{kw}%'")
            
            # Additional vegan constraints (if vegan is true, dairy is definitely free? Wait, if vegan, no dairy. But if vegetarian, might have dairy)
            cursor.execute("UPDATE food_items SET is_dairy_free = 1 WHERE is_vegan = 1")

            print("Migration complete and data backfilled.")
        else:
            print("Columns already exist.")

        conn.commit()
    except Exception as e:
        print(f"Error during migration: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
