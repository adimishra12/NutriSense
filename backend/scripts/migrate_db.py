import sqlite3

current_db = "backend/data/nutrisense.db"
mentor_db = "backend/data/mentor_nutrisense.db"

def migrate():
    # Connect to both DBs
    conn_curr = sqlite3.connect(current_db)
    conn_ment = sqlite3.connect(mentor_db)
    
    # 1. Read all food items from mentor DB
    c_ment = conn_ment.cursor()
    c_ment.execute("SELECT * FROM food_items")
    mentor_foods = c_ment.fetchall()
    
    # Get column names
    c_ment.execute("PRAGMA table_info(food_items)")
    mentor_columns = [row[1] for row in c_ment.fetchall()]
    
    # 2. Read diary entries and unknown foods from current DB before deleting
    c_curr = conn_curr.cursor()
    c_curr.execute("SELECT id, name FROM food_items WHERE data_type = 'unknown'")
    unknown_foods = c_curr.fetchall()
    
    c_curr.execute("SELECT id, food_id, food_name FROM diary_entries")
    diary_entries = c_curr.fetchall()
    
    # Create mapping by exact name match (case-insensitive)
    mentor_names_lower = {row[mentor_columns.index('name')].lower(): row[0] for row in mentor_foods}
    
    diary_updates = []
    for d_id, f_id, f_name in diary_entries:
        if f_name.lower() in mentor_names_lower:
            new_f_id = mentor_names_lower[f_name.lower()]
            diary_updates.append((new_f_id, d_id))
        else:
            print(f"Warning: Could not map diary entry food: {f_name}")
            
    # 3. Clear existing food_items in current DB
    c_curr.execute("DELETE FROM food_items")
    
    # 4. Insert mentor foods into current DB
    # We need to construct the INSERT query based on current schema
    c_curr.execute("PRAGMA table_info(food_items)")
    curr_columns = [row[1] for row in c_curr.fetchall()]
    
    insert_sql = f"INSERT INTO food_items ({', '.join(curr_columns)}) VALUES ({', '.join(['?'] * len(curr_columns))})"
    
    rows_to_insert = []
    for m_row in mentor_foods:
        # Create a dictionary for this row
        m_dict = dict(zip(mentor_columns, m_row))
        
        # Build the tuple for insertion
        insert_tuple = []
        for col in curr_columns:
            if col in m_dict:
                insert_tuple.append(m_dict[col])
            else:
                # Assign default values for application-specific columns
                if col in ['fat_g', 'carbohydrates_g', 'fiber_g']:
                    insert_tuple.append(0.0)
                elif col in ['is_dairy_free', 'is_gluten_free', 'is_nut_free']:
                    insert_tuple.append(1)  # Defaulting to True (1) as they are negative flags
                else:
                    insert_tuple.append(None)
        rows_to_insert.append(tuple(insert_tuple))
        
    c_curr.executemany(insert_sql, rows_to_insert)
    
    # 5. Update diary entries with new food IDs
    update_sql = "UPDATE diary_entries SET food_id = ? WHERE id = ?"
    c_curr.executemany(update_sql, diary_updates)
    
    conn_curr.commit()
    print(f"Migration successful! Inserted {len(rows_to_insert)} foods and updated {len(diary_updates)} diary entries.")
    
    conn_curr.close()
    conn_ment.close()

if __name__ == "__main__":
    migrate()
