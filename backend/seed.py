import requests
import random
from datetime import datetime, timedelta

BASE_URL = "http://127.0.0.1:8000"

def seed_data():
    print("Seeding data for mentor presentation...")
    email = f"mentor_test_{random.randint(1000, 9999)}@example.com"
    password = "Test@1234!"

    # 1. Signup
    print(f"Signing up with {email}...")
    signup_res = requests.post(f"{BASE_URL}/auth/signup", json={
        "first_name": "Mentor",
        "last_name": "Test",
        "email": email,
        "password": password
    })
    
    if signup_res.status_code != 200:
        print("Signup failed:", signup_res.json())
        return

    # 2. Login
    login_res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": email,
        "password": password
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Create Health Profile
    print("Creating Health Profile...")
    profile_res = requests.post(f"{BASE_URL}/health-profile/", json={
        "age_years": 30,
        "gender": 1,
        "height_cm": 170.0,
        "weight_kg": 65.0,
        "activity_level": "moderate",
        "diet_restrictions": ["none"],
        "conditions": "none",
        "health_goal": "stay healthy"
    }, headers=headers)
    
    # 4. Search some foods to use
    print("Fetching food items...")
    foods_res = requests.get(f"{BASE_URL}/foods/search?q=apple", headers=headers)
    apple = foods_res.json()[0] if foods_res.json() else {"id": 1, "name": "Apple"}
    
    foods_res = requests.get(f"{BASE_URL}/foods/search?q=chicken", headers=headers)
    chicken = foods_res.json()[0] if foods_res.json() else {"id": 2, "name": "Chicken"}
    
    foods_res = requests.get(f"{BASE_URL}/foods/search?q=rice", headers=headers)
    rice = foods_res.json()[0] if foods_res.json() else {"id": 3, "name": "Rice"}

    available_foods = [apple, chicken, rice]

    # 5. Log 10 consecutive days of complete meals
    print("Logging 10 consecutive days of meals...")
    today = datetime.now()
    meals = ["Breakfast", "Lunch", "Snack", "Dinner"]
    
    for i in range(10, 0, -1):
        date_str = (today - timedelta(days=i)).strftime("%Y-%m-%d")
        for meal in meals:
            food = random.choice(available_foods)
            requests.post(f"{BASE_URL}/diary/entries", json={
                "food_id": food["id"],
                "food_name": food["name"],
                "entry_date": date_str,
                "meal_type": meal,
                "portion_grams": random.randint(100, 300)
            }, headers=headers)
        print(f"  Logged complete meals for {date_str}")

    # 6. Save Lab Results
    print("Saving Lab Results...")
    requests.post(f"{BASE_URL}/lab-results/", json={
        "hemoglobin_g_dl": 14.5,
        "serum_vitamin_d": 45.0,
        "ferritin": 50.0,
        "vitamin_b12": 350.0,
        "calcium": 9.0
    }, headers=headers)

    # 7. Run Assessment
    print("Running Assessment...")
    assessment_res = requests.post(f"{BASE_URL}/assessment/run", headers=headers)
    
    if assessment_res.status_code == 200:
        score = assessment_res.json().get("overall_score")
        print(f"Assessment ran successfully! Overall Score: {score}")
    else:
        print("Assessment failed:", assessment_res.json())

    print("="*40)
    print("All done! Here are the credentials for your mentor:")
    print(f"Email: {email}")
    print(f"Password: {password}")
    print("="*40)

if __name__ == "__main__":
    seed_data()
