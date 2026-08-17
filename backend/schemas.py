from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime


class SignupRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ProfileUpdateRequest(BaseModel):
    full_name: str
    email: EmailStr


class PasswordUpdateRequest(BaseModel):
    current_password: str
    new_password: str


class HealthProfileRequest(BaseModel):
    age_years: int
    gender: int
    height_cm: float
    weight_kg: float
    activity_level: str
    diet_restrictions: List[str]
    conditions: str
    health_goal: str


class HealthProfileResponse(BaseModel):
    id: int
    user_id: int
    age_years: int
    gender: int
    height_cm: float
    weight_kg: float
    activity_level: str
    diet_restrictions: str
    conditions: str
    health_goal: str

    class Config:
        from_attributes = True


class FoodSearchResult(BaseModel):
    id: int
    name: str
    tags: str = ""
    calories_kcal: float
    protein_g: float
    iron_mg: float
    calcium_mg: float
    vitamin_d_mcg: float
    vitamin_b12_mcg: float
    folate_mcg: float
    vitamin_a_mcg: float
    vitamin_c_mg: float = 0
    magnesium_mg: float = 0
    zinc_mg: float = 0
    
    # Old columns
    carbohydrates_g: float = 0
    fat_g: float = 0
    fiber_g: float = 0
    
    is_vegetarian: bool = False
    is_vegan: bool = False
    fdc_id: Optional[str] = None
    data_type: str = "unknown"
    serving_description: Optional[str] = None
    serving_gram_weight: Optional[float] = None
    ingredients: Optional[str] = None


class DiaryEntryRequest(BaseModel):
    entry_date: date
    meal_type: str
    food_name: str
    portion_grams: float
    food_id: int


class DiaryEntryResponse(BaseModel):
    id: int
    user_id: int
    entry_date: date
    meal_type: str
    food_name: str
    portion_grams: float
    food_id: int
    
    calories_kcal: float
    protein_g: float
    iron_mg: float
    calcium_mg: float
    vitamin_d_mcg: float
    vitamin_b12_mcg: float
    folate_mcg: float
    vitamin_a_mcg: float
    vitamin_c_mg: float = 0
    magnesium_mg: float = 0
    zinc_mg: float = 0
    
    # Old columns
    carbohydrates_g: float = 0
    fat_g: float = 0
    fiber_g: float = 0

    class Config:
        from_attributes = True


class DiarySummary(BaseModel):
    days_logged: int
    avg_calories_kcal: float = 0
    avg_protein_g: float = 0
    avg_iron_mg: float = 0
    avg_calcium_mg: float = 0
    avg_vitamin_d_mcg: float = 0
    avg_vitamin_b12_mcg: float = 0
    avg_folate_mcg: float = 0
    avg_vitamin_a_mcg: float = 0
    avg_vitamin_c_mg: float = 0
    avg_magnesium_mg: float = 0
    avg_zinc_mg: float = 0
    
    avg_carbohydrates_g: float = 0
    avg_fat_g: float = 0
    avg_fiber_g: float = 0


class LabResultRequest(BaseModel):
    hemoglobin_g_dl: Optional[float] = None
    serum_vitamin_d: Optional[float] = None
    ferritin: Optional[float] = None
    vitamin_b12: Optional[float] = None
    calcium: Optional[float] = None


class LabResultResponse(BaseModel):
    id: int
    user_id: int
    hemoglobin_g_dl: Optional[float] = None
    serum_vitamin_d: Optional[float] = None
    ferritin: Optional[float] = None
    vitamin_b12: Optional[float] = None
    calcium: Optional[float] = None
    updated_at: datetime

    class Config:
        from_attributes = True