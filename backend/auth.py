from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import bcrypt

from database import get_db
from models import User
from schemas import SignupRequest, LoginRequest, ProfileUpdateRequest, PasswordUpdateRequest
from jwt_utils import create_access_token, get_current_user

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post("/signup")
def signup(request: SignupRequest, db: Session = Depends(get_db)):

    existing_user = db.query(User).filter(
        User.email == request.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    hashed_password = bcrypt.hashpw(
        request.password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

    new_user = User(
        full_name=f"{request.first_name} {request.last_name}".strip(),
        email=request.email,
        password_hash=hashed_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User registered successfully"
    }


@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):

    user = db.query(User).filter(
        User.email == request.email
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not bcrypt.checkpw(
        request.password.encode("utf-8"),
        user.password_hash.encode("utf-8")
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token(data={"sub": user.id})

    # Keep API contract the same for the frontend
    parts = user.full_name.split(" ")
    first_name = parts[0] if len(parts) > 0 else ""
    last_name = " ".join(parts[1:]) if len(parts) > 1 else ""

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "first_name": first_name,
            "last_name": last_name,
            "email": user.email,
            "has_completed_onboarding": user.health_profile is not None
        }
    }


@router.get("/profile")
def get_profile(current_user: User = Depends(get_current_user)):
    return {
        "full_name": current_user.full_name,
        "email": current_user.email
    }


@router.put("/profile")
def update_profile(
    request: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if request.email != current_user.email:
        existing = db.query(User).filter(User.email == request.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use by another account")
            
    current_user.full_name = request.full_name.strip()
    current_user.email = request.email
    
    db.commit()
    db.refresh(current_user)
    
    parts = current_user.full_name.split(" ")
    first_name = parts[0] if len(parts) > 0 else ""
    last_name = " ".join(parts[1:]) if len(parts) > 1 else ""
    
    return {
        "message": "Profile updated successfully",
        "user": {
            "id": current_user.id,
            "first_name": first_name,
            "last_name": last_name,
            "email": current_user.email,
            "has_completed_onboarding": current_user.health_profile is not None
        }
    }


@router.put("/profile/password")
def update_password(
    request: PasswordUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not bcrypt.checkpw(
        request.current_password.encode("utf-8"),
        current_user.password_hash.encode("utf-8")
    ):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect"
        )
        
    hashed_password = bcrypt.hashpw(
        request.new_password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")
    
    current_user.password_hash = hashed_password
    db.commit()
    
    return {"message": "Password updated successfully"}