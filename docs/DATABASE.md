# NutriSense Database Architecture

This document describes the SQLite database schema implemented for the NutriSense application (`backend/data/nutrisense.db`).

The database strictly adheres to a normalized 9-table schema designed for comprehensive nutritional assessment, tracking, and personalized meal planning.

## 1. `users`
Core user identity and authentication.
- **id**: Primary Key
- **email**: Unique user email
- **password_hash**: Bcrypt hashed password
- **full_name**: User's full name (mapped from first/last on API layer)
- **created_at**: Timestamp of registration

## 2. `health_profiles`
Detailed health and dietary configuration for each user.
- **id**: Primary Key
- **user_id**: Foreign Key to `users`
- **age_years**: User age
- **gender**: Integer (0 = Male, 1 = Female)
- **height_cm**: Height in centimeters
- **weight_kg**: Weight in kilograms
- **activity_level**: Daily activity factor
- **health_goal**: Primary nutritional goal
- **diet_restrictions**: Comma-separated list of dietary rules (e.g., Vegetarian)
- **conditions**: User allergies and medical conditions

## 3. `food_items`
Central food database, combining items from IFCT 2017 and USDA FoodData Central.
- **id**: Primary Key
- **name**: Descriptive name
- **tags**: Categorization and origin identifiers
- **Nutrients (per 100g)**: `calories_kcal`, `protein_g`, `iron_mg`, `calcium_mg`, `vitamin_d_mcg`, `vitamin_b12_mcg`, `folate_mcg`, `vitamin_a_mcg`, `vitamin_c_mg`, `magnesium_mg`, `zinc_mg`
- **Macronutrients (UI Support)**: `carbohydrates_g`, `fat_g`, `fiber_g`
- **Metadata**: `is_vegetarian`, `is_vegan`, `fdc_id`, `data_type`, `serving_description`, `serving_gram_weight`, `ingredients`

## 4. `diary_entries`
Logged meals and dynamically scaled consumed nutrients.
- **id**: Primary Key
- **user_id**: Foreign Key to `users`
- **entry_date**: Date of consumption
- **meal_type**: Breakfast, Lunch, Dinner, Snack
- **food_id**: Foreign Key to `food_items`
- **food_name**: Cached name for display
- **portion_grams**: Amount consumed
- **Consumed Nutrients**: Scaled based on portion (matching `food_items` nutrient columns)

## 5. `assessments`
Algorithmic analysis of nutritional risk.
- **id**: Primary Key
- **user_id**: Foreign Key
- **diary_days_used**: Number of days analyzed
- **features_json**: JSON payload of extracted features
- **risks_json**: JSON payload of predicted risks
- **overall_score**: Final calculated health score

## 6. `lab_results`
Biomarker measurements (Optional).
- **id**: Primary Key
- **user_id**: Foreign Key
- **hemoglobin_g_dl**, **serum_vitamin_d**, **ferritin**, **vitamin_b12**, **calcium**: Specific clinical markers

## 7. `meal_plans`
Personalized meal recommendations.
- **id**: Primary Key
- **user_id**: Foreign Key
- **assessment_id**: Foreign Key to source assessment
- **focus_nutrients**: Targeted nutrients
- **diet_filter**: Constraints
- **plan_json**: Full structured meal plan

## 8. `progress_snapshots`
Longitudinal tracking of risk reduction over time.
- **id**: Primary Key
- **user_id**: Foreign Key
- **assessment_id**: Foreign Key to `assessments`
- **avg_risk**, **iron_risk**, **vitamin_d_risk**: Point-in-time risk values

## 9. `symptom_responses`
Questionnaire responses mapping symptoms to potential deficiencies.
- **id**: Primary Key
- **user_id**: Foreign Key
- **responses**: JSON structure of answers
