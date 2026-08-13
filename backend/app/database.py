"""
database.py — SQLAlchemy engine, session factory, and declarative base.

We use SQLite for simplicity; swapping to PostgreSQL later only requires
changing DATABASE_URL and installing psycopg2.
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Store the DB file next to this package so it is easy to locate / delete.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, '..', 'zoom.db')}"

# check_same_thread=False is required for SQLite when used with FastAPI
# (multiple threads can share the same connection pool).
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,  # set True to log SQL statements during development
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# ---------------------------------------------------------------------------
# Dependency injected into FastAPI route handlers
# ---------------------------------------------------------------------------
def get_db():
    """Yield a database session and ensure it is closed after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
