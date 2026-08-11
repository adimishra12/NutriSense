from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from auth import router as auth_router
from health_profile import router as health_profile_router
from food_diary import router as food_diary_router
import models

app = FastAPI(title="NutriSense API")

# Create database tables
Base.metadata.create_all(bind=engine)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router)
app.include_router(health_profile_router)
app.include_router(food_diary_router)

@app.get("/")
def root():
    return {
        "message": "NutriSense Backend Running 🚀"
    }