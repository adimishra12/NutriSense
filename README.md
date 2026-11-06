# NutriSense — AI Nutritional Assessment

AI-Based Nutritional Assessment System for Deficiency Detection and Personalized Meal Planning.

## Tech Stack

- **Frontend**: Next.js 16, Tailwind CSS, React Hot Toast, Chart.js
- **Backend**: FastAPI, Uvicorn, Google Gemini API
- **Auth**: Firebase Authentication

## Getting Started

### Prerequisites

- Node.js 22 LTS
- Python 3.10+

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on http://localhost:3000

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Runs on http://127.0.0.1:8000 (API docs at /docs)
