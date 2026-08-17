import requests
import sqlite3

BASE_URL = "http://127.0.0.1:8000"
EMAIL = "munikiran_test_12@example.com"
PASSWORD = "password123"

# 1. Register User
print("Registering new user...")
res = requests.post(f"{BASE_URL}/auth/signup", json={"email": EMAIL, "password": PASSWORD, "first_name": "munikiran", "last_name": ""})
if res.status_code == 400 and "already exists" in res.text:
    print("User exists. Logging in...")
else:
    res.raise_for_status()

# 2. Login
res = requests.post(f"{BASE_URL}/auth/login", json={"email": EMAIL, "password": PASSWORD})
res.raise_for_status()
token = res.json()["access_token"]
user_id = res.json()["user"]["id"]
headers = {"Authorization": f"Bearer {token}"}

# 3. Complete Profile
print("Updating Profile...")
profile_data = {
    "age_years": 25,
    "gender": 1,
    "height_cm": 165.0,
    "weight_kg": 60.0,
    "activity_level": "Light",
    "diet_restrictions": ["Dairy-free"],
    "conditions": "",
    "health_goal": "Improve energy"
}
res = requests.post(f"{BASE_URL}/health-profile/", headers=headers, json=profile_data)
res.raise_for_status()

# 4. Enter Lab Result
print("Entering Lab Result...")
lab_data = {
    "serum_vitamin_d": 32.0
}
res = requests.post(f"{BASE_URL}/lab-results/", headers=headers, json=lab_data)
res.raise_for_status()

# 5. Food mappings
FOOD_MAP = {
    "Oats, dry": 8760,
    "Banana": 8752,
    "Peanuts, roasted": 8764,
    "Brown rice, cooked": 8743,
    "Lentils, cooked (masoor dal)": 8736,
    "Cucumber": 8774,
    "Roasted chana": 8763,
    "Orange": 8749,
    "Whole wheat roti": 8744,
    "Rajma (kidney beans), cooked": 8762,
    "Tomato, raw": 8773,
    "Whole grain bread": 8771,
    "Amla (Indian gooseberry)": 8751,
    "Quinoa, cooked": 8761,
    "Chickpeas, cooked": 8737,
    "Carrot, raw": 8754,
    "Guava": 8750,
    "Potato, baked": 8772,
    "Broccoli, cooked": 8753,
    "Pumpkin seeds": 8747,
    "Sweet potato, baked": 8755,
    "Amla": 8751
}

DIARY = [
    ("2026-08-14", "Breakfast", "Oats, dry", 50),
    ("2026-08-14", "Breakfast", "Banana", 120),
    ("2026-08-14", "Breakfast", "Peanuts, roasted", 20),
    ("2026-08-14", "Lunch", "Brown rice, cooked", 200),
    ("2026-08-14", "Lunch", "Lentils, cooked (masoor dal)", 150),
    ("2026-08-14", "Lunch", "Cucumber", 80),
    ("2026-08-14", "Snack", "Roasted chana", 40),
    ("2026-08-14", "Snack", "Orange", 130),
    ("2026-08-14", "Dinner", "Whole wheat roti", 90),
    ("2026-08-14", "Dinner", "Rajma (kidney beans), cooked", 150),
    ("2026-08-14", "Dinner", "Tomato, raw", 80),
    
    ("2026-08-15", "Breakfast", "Whole grain bread", 70),
    ("2026-08-15", "Breakfast", "Banana", 100),
    ("2026-08-15", "Breakfast", "Amla (Indian gooseberry)", 50),
    ("2026-08-15", "Lunch", "Quinoa, cooked", 160),
    ("2026-08-15", "Lunch", "Chickpeas, cooked", 140),
    ("2026-08-15", "Lunch", "Carrot, raw", 80),
    ("2026-08-15", "Snack", "Guava", 120),
    ("2026-08-15", "Snack", "Peanuts, roasted", 25),
    ("2026-08-15", "Dinner", "Brown rice, cooked", 180),
    ("2026-08-15", "Dinner", "Potato, baked", 150),
    ("2026-08-15", "Dinner", "Broccoli, cooked", 80),

    ("2026-08-16", "Breakfast", "Oats, dry", 45),
    ("2026-08-16", "Breakfast", "Banana", 110),
    ("2026-08-16", "Breakfast", "Pumpkin seeds", 20),
    ("2026-08-16", "Lunch", "Brown rice, cooked", 190),
    ("2026-08-16", "Lunch", "Lentils, cooked (masoor dal)", 160),
    ("2026-08-16", "Lunch", "Sweet potato, baked", 100),
    ("2026-08-16", "Snack", "Roasted chana", 40),
    ("2026-08-16", "Snack", "Orange", 120),
    ("2026-08-16", "Dinner", "Whole wheat roti", 90),
    ("2026-08-16", "Dinner", "Rajma (kidney beans), cooked", 140),
    ("2026-08-16", "Dinner", "Cucumber", 90),

    ("2026-08-17", "Breakfast", "Whole grain bread", 80),
    ("2026-08-17", "Breakfast", "Tomato, raw", 80),
    ("2026-08-17", "Breakfast", "Peanuts, roasted", 20),
    ("2026-08-17", "Lunch", "Quinoa, cooked", 150),
    ("2026-08-17", "Lunch", "Chickpeas, cooked", 150),
    ("2026-08-17", "Lunch", "Carrot, raw", 90),
    ("2026-08-17", "Snack", "Guava", 100),
    ("2026-08-17", "Snack", "Amla", 60),
    ("2026-08-17", "Dinner", "Brown rice, cooked", 200),
    ("2026-08-17", "Dinner", "Potato, baked", 160),
    ("2026-08-17", "Dinner", "Broccoli, cooked", 100)
]

print("Clearing old diary entries just in case...")
conn = sqlite3.connect("backend/data/nutrisense.db")
c = conn.cursor()
c.execute("DELETE FROM diary_entries WHERE user_id = ?", (user_id,))
conn.commit()

print("Entering Diary Data...")
count = 0
for date, meal, food, portion in DIARY:
    food_id = FOOD_MAP[food]
    res = requests.post(f"{BASE_URL}/diary/entries", headers=headers, json={
        "entry_date": date,
        "meal_type": meal,
        "food_id": food_id,
        "food_name": food,
        "portion_grams": portion
    })
    res.raise_for_status()
    count += 1
    
print(f"Total diary entries created: {count}")

print("Running Assessment...")
res = requests.post(f"{BASE_URL}/assessment/run", headers=headers)
res.raise_for_status()
data = res.json()

print(f"\nWellness Score: {data['overall_score']}%")
print("Risks:")
for r in data["risks"]:
    print(f"{r['nutrient'].title()}: {r['percentage']}% {r['risk_level']} | Reasons: {', '.join(r['reasons'])}")

