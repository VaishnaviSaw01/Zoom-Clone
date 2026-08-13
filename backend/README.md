# Zoom Clone — Backend

FastAPI backend powering the Zoom Clone SDE assignment.

## Quick Start

```bash
cd zoom-clone/backend

# 1. Create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Seed the database
python -m app.seed

# 4. Run the dev server
uvicorn app.main:app --reload
```

API is now live at **http://localhost:8000**.  
Auto-generated docs: **http://localhost:8000/docs**

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/meetings/instant` | Create instant meeting |
| POST | `/meetings/schedule` | Schedule a future meeting |
| GET | `/meetings/upcoming` | Upcoming scheduled meetings |
| GET | `/meetings/recent` | Recent instant/ended meetings |
| GET | `/meetings/{code}` | Validate / fetch meeting by code |
| POST | `/meetings/{code}/join` | Join — creates participant record |
| GET | `/meetings/{code}/participants` | List participants |
| GET | `/health` | Health check |
