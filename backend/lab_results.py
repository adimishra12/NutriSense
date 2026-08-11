from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import LabResult, User
from schemas import LabResultRequest, LabResultResponse
from jwt_utils import get_current_user
from datetime import datetime, timezone

router = APIRouter(
    prefix="/lab-results",
    tags=["Lab Results"],
)

@router.get("/", response_model=LabResultResponse)
def get_lab_results(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the lab results for the authenticated user.
    """
    lab_result = db.query(LabResult).filter(LabResult.user_id == current_user.id).first()
    if not lab_result:
        raise HTTPException(status_code=404, detail="Lab results not found")
    return lab_result


@router.post("/", response_model=LabResultResponse)
def save_lab_results(
    data: LabResultRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create or update lab results for the authenticated user.
    """
    lab_result = db.query(LabResult).filter(LabResult.user_id == current_user.id).first()
    
    if lab_result:
        # Update existing
        if data.hemoglobin_g_dl is not None:
            lab_result.hemoglobin_g_dl = data.hemoglobin_g_dl
        if data.serum_vitamin_d is not None:
            lab_result.serum_vitamin_d = data.serum_vitamin_d
        if data.ferritin is not None:
            lab_result.ferritin = data.ferritin
        if data.vitamin_b12 is not None:
            lab_result.vitamin_b12 = data.vitamin_b12
        if data.calcium is not None:
            lab_result.calcium = data.calcium
            
        lab_result.updated_at = datetime.now(timezone.utc)
    else:
        # Create new
        lab_result = LabResult(
            user_id=current_user.id,
            hemoglobin_g_dl=data.hemoglobin_g_dl,
            serum_vitamin_d=data.serum_vitamin_d,
            ferritin=data.ferritin,
            vitamin_b12=data.vitamin_b12,
            calcium=data.calcium,
            updated_at=datetime.now(timezone.utc)
        )
        db.add(lab_result)
        
    db.commit()
    db.refresh(lab_result)
    return lab_result
