import sys
import os

# add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from models import User
import bcrypt

def update_password():
    db = SessionLocal()
    user = db.query(User).filter(User.email == 'test1@gmail.com').first()
    if not user:
        print("User not found")
        return

    hashed_password = bcrypt.hashpw(
        "Test@1234!".encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

    user.password_hash = hashed_password
    db.commit()
    print("Password updated successfully")

if __name__ == "__main__":
    update_password()
