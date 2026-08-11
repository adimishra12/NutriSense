#!/bin/bash
set -e

echo "Downloading USDA FoodData Central sample..."
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
mkdir -p "$DIR/../data/usda_raw"

# Using the public USDA API to fetch a subset of foundation foods.
# In a full production environment, this script would download the bulk zip:
# curl -O https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_foundation_food_json_YYYY-MM-DD.zip

# For this development environment, we fetch 50 common items using the DEMO_KEY
API_KEY="${USDA_API_KEY:-DEMO_KEY}"

curl -s "https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${API_KEY}&dataType=Foundation&pageSize=50" -o "$DIR/../data/usda_raw/foundation_sample.json"

echo "USDA data downloaded successfully to data/usda_raw/foundation_sample.json"
