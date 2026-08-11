import os
import sys

# Add parent directory to path to import backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from models import FoodItem

ALIASES = {
    "Spinach": ["palak"],
    "Rice, raw, milled": ["chawal", "white rice"],
    "Rice, parboiled, milled": ["chawal"],
    "Rice, raw, brown": ["brown rice", "chawal"],
    "Bengal gram, dal": ["chana dal"],
    "Black gram, dal": ["urad dal"],
    "Green gram, dal": ["moong dal"],
    "Red gram, dal": ["toor dal", "arhar dal"],
    "Lentil dal": ["masoor dal", "yellow dal", "dal"],
    "Lentil whole, brown": ["masoor dal", "dal"],
    "Paneer": ["cottage cheese"],
    "Potato": ["aloo"],
    "Onion": ["pyaaz", "pyaz"],
    "Tomato": ["tamatar"],
    "Cauliflower": ["gobi", "cauliflower"],
    "Cabbage": ["patta gobi", "cabbage"],
    "Peas": ["matar"],
    "Eggplant": ["baingan", "brinjal"],
    "Brinjal": ["baingan", "eggplant"],
    "Okra": ["bhindi", "lady finger"],
    "Carrot": ["gajar"],
    "Radish": ["mooli"],
    "Bitter gourd": ["karela"],
    "Bottle gourd": ["lauki"],
    "Milk, whole": ["doodh"],
    "Curd": ["dahi", "yogurt"],
    "Butter": ["makhan"],
    "Ghee": ["ghee"],
    "Egg, whole": ["anda"],
    "Chicken": ["murgh"],
    "Fish": ["machli"]
}

def add_aliases():
    db = SessionLocal()
    count = 0
    
    for food_name, aliases in ALIASES.items():
        # Find foods matching the English name roughly
        foods = db.query(FoodItem).filter(FoodItem.name.ilike(f"%{food_name}%")).all()
        for food in foods:
            existing_tags = food.tags.split(",") if food.tags else []
            existing_tags = [t.strip().lower() for t in existing_tags]
            
            new_tags_added = False
            for alias in aliases:
                if alias.lower() not in existing_tags:
                    existing_tags.append(alias.lower())
                    new_tags_added = True
            
            if new_tags_added:
                food.tags = ", ".join(existing_tags)
                count += 1
                
    db.commit()
    db.close()
    print(f"Added colloquial Indian aliases to {count} food items!")

if __name__ == "__main__":
    add_aliases()
