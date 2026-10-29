# Environment & Startup Guidelines for AI Agents

## 1. Runtime Environment (CRITICAL)
- **Node Runtime**: Always use **Node 22 LTS** (`/opt/homebrew/opt/node@22/bin`), NEVER system default Node 24 on macOS ARM64 (Node 24 causes deadlocks in Turbopack/Next.js compilers).
- **Backend Environment**: Python virtualenv is in `backend/venv`. Always activate `source venv/bin/activate` or invoke via `./venv/bin/python` / `./venv/bin/uvicorn`.

## 2. Server Startup Commands
### Frontend (Port 3000):
```bash
cd frontend
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
npm run dev
```

### Backend (Port 8000):
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

## 3. Port & Networking
- Frontend binds to `http://localhost:3000` and `http://127.0.0.1:3000`.
- Backend runs on `http://127.0.0.1:8000` (docs at `http://127.0.0.1:8000/docs`).
- If port conflicts occur (`EADDRINUSE`), kill cleanly using:
  `kill -9 $(lsof -t -i:3000)` and `kill -9 $(lsof -t -i:8000)`.
