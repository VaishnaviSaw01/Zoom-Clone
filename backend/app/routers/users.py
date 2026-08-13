"""
routers/users.py — User-related endpoints.

Routes:
  GET   /users/me    → fetch the default logged-in user (generates PMI on first call)
  PATCH /users/me    → update display name / avatar color
"""

import random
import string

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.routers.meetings import _get_default_user

router = APIRouter(prefix="/users", tags=["users"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _generate_pmi() -> str:
    """Generate a fixed Personal Meeting ID in the format xxx-xxxx-xxxx."""
    digits = string.digits
    a = "".join(random.choices(digits, k=3))
    b = "".join(random.choices(digits, k=4))
    c = "".join(random.choices(digits, k=4))
    return f"{a}-{b}-{c}"


# ---------------------------------------------------------------------------
# GET /users/me
# ---------------------------------------------------------------------------
@router.get("/me", response_model=schemas.UserResponse)
def get_current_user(db: Session = Depends(get_db)):
    """
    Return the default logged-in user.
    If the user has no Personal Meeting ID yet, generates and persists one.
    """
    user = _get_default_user(db)

    # One-time PMI generation — idempotent on subsequent calls
    if not user.personal_meeting_id:
        pmi = _generate_pmi()
        # Ensure uniqueness (extremely unlikely collision, but be safe)
        while db.query(models.User).filter(
            models.User.personal_meeting_id == pmi
        ).first():
            pmi = _generate_pmi()
        user.personal_meeting_id = pmi
        db.commit()
        db.refresh(user)

    return user


# ---------------------------------------------------------------------------
# PATCH /users/me
# ---------------------------------------------------------------------------
@router.patch("/me", response_model=schemas.UserResponse)
def update_current_user(
    body: schemas.UserUpdate,
    db: Session = Depends(get_db),
):
    """
    Update the default user's profile (name, avatar_color).
    """
    user = _get_default_user(db)

    if body.name is not None:
        user.name = body.name
    if body.avatar_color is not None:
        user.avatar_color = body.avatar_color

    db.commit()
    db.refresh(user)
    return user
