from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import User, HealthProfile
from schemas import HealthProfileRequest, HealthProfileResponse
from jwt_utils import get_current_user

router = APIRouter(
    prefix="/health-profile",
    tags=["Health Profile"]
)


@router.post("/", response_model=HealthProfileResponse)
def create_health_profile(
    request: HealthProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Check if profile already exists
    existing = db.query(HealthProfile).filter(
        HealthProfile.user_id == current_user.id
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Health profile already exists"
        )

    profile = HealthProfile(
        user_id=current_user.id,
        age_years=request.age_years,
        gender=request.gender,
        height_cm=request.height_cm,
        weight_kg=request.weight_kg,
        activity_level=request.activity_level,
        diet_restrictions=",".join(request.diet_restrictions),
        conditions=request.conditions,
        health_goal=request.health_goal,
    )

    db.add(profile)


    db.commit()
    db.refresh(profile)

    return profile


@router.get("/", response_model=HealthProfileResponse)
def get_health_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(HealthProfile).filter(
        HealthProfile.user_id == current_user.id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Health profile not found"
        )

    return profile
