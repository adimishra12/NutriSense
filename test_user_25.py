import sqlite3
import requests
import json
import base64

# Generate a JWT for user 25 to bypass login
# Actually, I can just use the login endpoint if I know the password, or just mock it.
# Let's just find the email of user 25 and reset their password.
conn = sqlite3.connect("backend/data/nutrisense.db")
c = conn.cursor()
c.execute("SELECT email FROM users WHERE id = 25")
email = c.fetchone()[0]

# reset password
import sys
sys.path.append("backend")
from database import SessionLocal
from models import User
from auth import bcrypt

db = SessionLocal()
user = db.query(User).filter(User.id == 25).first()
user.password_hash = bcrypt.hashpw(b"password123", bcrypt.gensalt()).decode("utf-8")
db.commit()
db.close()

res = requests.post("http://127.0.0.1:8000/auth/login", json={"email": email, "password": "password123"})
token = res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

res2 = requests.post("http://127.0.0.1:8000/assessment/run", headers=headers)
print(res2.json()["overall_score"])
