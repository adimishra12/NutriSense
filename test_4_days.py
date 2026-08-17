import requests
import sqlite3
import datetime

BASE_URL = "http://127.0.0.1:8000"
EMAIL = "mentor_test_8438@example.com"
PASSWORD = "password123"

# 1. Login
response = requests.post(f"{BASE_URL}/auth/login", json={"email": EMAIL, "password": PASSWORD})
token = response.json().get("access_token")
headers = {"Authorization": f"Bearer {token}"}
user = response.json().get("user")
user_id = user["id"]

# 2. Clear diary entries for user
conn = sqlite3.connect("backend/data/nutrisense.db")
c = conn.cursor()
c.execute("DELETE FROM diary_entries WHERE user_id = ?", (user_id,))
conn.commit()

def add_day(days_ago):
    date = (datetime.date.today() - datetime.timedelta(days=days_ago)).isoformat()
    for meal in ["Breakfast", "Lunch", "Snack", "Dinner"]:
        requests.post(f"{BASE_URL}/diary/entries", headers=headers, json={
            "entry_date": date,
            "meal_type": meal,
            "food_id": 1,
            "food_name": "Apple",
            "portion_grams": 100
        })

# Add 3 days
for i in range(1, 4):
    add_day(i)

# Test 3 days
res = requests.post(f"{BASE_URL}/assessment/run", headers=headers)
print("3 Days Result:", res.status_code, res.json())

# Add 4th day
add_day(4)

# Test 4 days
res = requests.post(f"{BASE_URL}/assessment/run", headers=headers)
print("4 Days Result:", res.status_code, res.json().get("id", res.json()))
