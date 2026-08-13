"""
main.py — FastAPI application entry point.

Responsibilities:
  1. Create all DB tables on startup (idempotent — safe to re-run)
  2. Wire up CORS so the Next.js dev server can call the API
  3. Include the two resource routers
  4. Expose a simple health-check endpoint
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import meetings, participants, users
from app.seed import seed

# ---------------------------------------------------------------------------
# Create tables (runs on every startup; SQLAlchemy skips existing tables)
# ---------------------------------------------------------------------------
Base.metadata.create_all(bind=engine)

# Automatically seed default user if not exists
seed()

# ---------------------------------------------------------------------------
# App instance
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Zoom Clone API",
    description="Backend for the Zoom Clone SDE assignment",
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# CORS
# Allow the Next.js development server origin. In production, replace "*"
# with your deployed frontend URL.
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(meetings.router)
app.include_router(participants.router)
app.include_router(users.router)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok", "service": "zoom-clone-api"}
