from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Date, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base

def utc_now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    created_at = Column(DateTime, nullable=False, default=utc_now)

    health_profile = relationship("HealthProfile", back_populates="user", uselist=False)
    diary_entries = relationship("DiaryEntry", back_populates="user")
    assessments = relationship("Assessment", back_populates="user")
    lab_results = relationship("LabResult", back_populates="user")
    meal_plans = relationship("MealPlan", back_populates="user")
    progress_snapshots = relationship("ProgressSnapshot", back_populates="user")
    symptom_responses = relationship("SymptomResponse", back_populates="user")


class HealthProfile(Base):
    __tablename__ = "health_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    age_years = Column(Integer, nullable=False)
    gender = Column(Integer, nullable=False)  # 0 for male, 1 for female (adjust based on UI)
    height_cm = Column(Float, nullable=False)
    weight_kg = Column(Float, nullable=False)
    activity_level = Column(String(50), nullable=False)
    health_goal = Column(String(255), nullable=False)
    diet_restrictions = Column(Text, nullable=False)
    conditions = Column(Text, nullable=False)

    user = relationship("User", back_populates="health_profile")


class FoodItem(Base):
    __tablename__ = "food_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    tags = Column(Text, nullable=False, default="")
    
    # Nutrition (Target Columns)
    calories_kcal = Column(Float, nullable=False, default=0.0)
    protein_g = Column(Float, nullable=False, default=0.0)
    iron_mg = Column(Float, nullable=False, default=0.0)
    calcium_mg = Column(Float, nullable=False, default=0.0)
    vitamin_d_mcg = Column(Float, nullable=False, default=0.0)
    vitamin_b12_mcg = Column(Float, nullable=False, default=0.0)
    folate_mcg = Column(Float, nullable=False, default=0.0)
    vitamin_a_mcg = Column(Float, nullable=False, default=0.0)
    vitamin_c_mg = Column(Float, nullable=False, default=0.0)
    magnesium_mg = Column(Float, nullable=False, default=0.0)
    zinc_mg = Column(Float, nullable=False, default=0.0)
    
    # Retained old columns (UI Compatibility)
    carbohydrates_g = Column(Float, nullable=False, default=0.0)
    fat_g = Column(Float, nullable=False, default=0.0)
    fiber_g = Column(Float, nullable=False, default=0.0)

    # USDA/IFCT details
    is_vegetarian = Column(Boolean, nullable=False, default=False)
    is_vegan = Column(Boolean, nullable=False, default=False)
    fdc_id = Column(String(32), nullable=True)
    data_type = Column(String(32), default='unknown')
    serving_description = Column(String(255), nullable=True)
    serving_gram_weight = Column(Float, nullable=True)
    ingredients = Column(Text, nullable=True)


class DiaryEntry(Base):
    __tablename__ = "diary_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    entry_date = Column(Date, nullable=False, index=True)
    meal_type = Column(String(20), nullable=False)
    food_id = Column(Integer, ForeignKey("food_items.id"), nullable=False, index=True)
    food_name = Column(String(255), nullable=False)
    portion_grams = Column(Float, nullable=False)
    
    # Consumed Nutrients
    calories_kcal = Column(Float, nullable=False, default=0.0)
    protein_g = Column(Float, nullable=False, default=0.0)
    iron_mg = Column(Float, nullable=False, default=0.0)
    calcium_mg = Column(Float, nullable=False, default=0.0)
    vitamin_d_mcg = Column(Float, nullable=False, default=0.0)
    vitamin_b12_mcg = Column(Float, nullable=False, default=0.0)
    folate_mcg = Column(Float, nullable=False, default=0.0)
    vitamin_a_mcg = Column(Float, nullable=False, default=0.0)
    vitamin_c_mg = Column(Float, nullable=False, default=0.0)
    magnesium_mg = Column(Float, nullable=False, default=0.0)
    zinc_mg = Column(Float, nullable=False, default=0.0)
    
    # Retained old columns
    carbohydrates_g = Column(Float, nullable=False, default=0.0)
    fat_g = Column(Float, nullable=False, default=0.0)
    fiber_g = Column(Float, nullable=False, default=0.0)
    
    created_at = Column(DateTime, nullable=False, default=utc_now)

    user = relationship("User", back_populates="diary_entries")


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    diary_days_used = Column(Integer, nullable=False, default=0)
    features_json = Column(Text, nullable=False)
    risks_json = Column(Text, nullable=False)
    overall_score = Column(Float, nullable=False)
    created_at = Column(DateTime, nullable=False, default=utc_now)

    user = relationship("User", back_populates="assessments")


class LabResult(Base):
    __tablename__ = "lab_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    hemoglobin_g_dl = Column(Float, nullable=True)
    serum_vitamin_d = Column(Float, nullable=True)
    ferritin = Column(Float, nullable=True)
    vitamin_b12 = Column(Float, nullable=True)
    calcium = Column(Float, nullable=True)
    updated_at = Column(DateTime, nullable=False, default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="lab_results")


class MealPlan(Base):
    __tablename__ = "meal_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=False)
    focus_nutrients = Column(Text, nullable=False)
    diet_filter = Column(String(50), nullable=False)
    plan_json = Column(Text, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=utc_now)

    user = relationship("User", back_populates="meal_plans")


class ProgressSnapshot(Base):
    __tablename__ = "progress_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=False)
    avg_risk = Column(Float, nullable=False)
    iron_risk = Column(Float, nullable=False)
    vitamin_d_risk = Column(Float, nullable=False)
    created_at = Column(DateTime, nullable=False, default=utc_now)

    user = relationship("User", back_populates="progress_snapshots")


class SymptomResponse(Base):
    __tablename__ = "symptom_responses"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    responses = Column(Text, nullable=False)
    updated_at = Column(DateTime, nullable=False, default=utc_now, onupdate=utc_now)
    
    user = relationship("User", back_populates="symptom_responses")