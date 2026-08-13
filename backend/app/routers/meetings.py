"""
routers/meetings.py — All meeting-related endpoints.

Routes:
  POST   /meetings/instant          → create instant meeting
  POST   /meetings/schedule         → create scheduled meeting
  GET    /meetings/upcoming         → scheduled meetings in the future
  GET    /meetings/recent           → ended/instant meetings (most recent first)
  GET    /meetings/{meeting_code}   → validate / fetch a single meeting
"""

import random
import string
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/meetings", tags=["meetings"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
FRONTEND_ORIGIN = "http://localhost:3000"  # used to build invite links


def _generate_meeting_code(length: int = 10) -> str:
    """Generate a random alphanumeric meeting code (e.g. abc-def-ghij)."""
    chars = string.ascii_lowercase + string.digits
    raw = "".join(random.choices(chars, k=length))
    # Format as xxx-xxx-xxxx
    return f"{raw[:3]}-{raw[3:6]}-{raw[6:]}"


def _get_default_user(db: Session) -> models.User:
    """Return the seeded default user, raising 500 if missing."""
    user = db.query(models.User).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No default user found. Run: python -m app.seed",
        )
    return user


# ---------------------------------------------------------------------------
# POST /meetings/instant
# ---------------------------------------------------------------------------
@router.post("/instant", response_model=schemas.MeetingResponse, status_code=201)
def create_instant_meeting(
    body: schemas.InstantMeetingRequest,
    db: Session = Depends(get_db),
):
    """
    Create a new instant meeting for the default user.
    Returns a unique meeting_code and a shareable invite_link.
    """
    host = _get_default_user(db)
    code = _generate_meeting_code()

    # Ensure code uniqueness (astronomically unlikely collision, but be safe)
    while db.query(models.Meeting).filter(models.Meeting.meeting_code == code).first():
        code = _generate_meeting_code()

    invite_link = f"{FRONTEND_ORIGIN}/join?code={code}"

    meeting = models.Meeting(
        meeting_code=code,
        host_id=host.id,
        title=body.title or "Instant Meeting",
        status=models.MeetingStatus.instant,
        invite_link=invite_link,
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting


# ---------------------------------------------------------------------------
# POST /meetings/schedule
# ---------------------------------------------------------------------------
@router.post("/schedule", response_model=schemas.MeetingResponse, status_code=201)
def schedule_meeting(
    body: schemas.ScheduleMeetingRequest,
    db: Session = Depends(get_db),
):
    """
    Create a new scheduled meeting.
    Stores scheduled_start and duration_minutes on the Meeting row.
    """
    host = _get_default_user(db)
    code = _generate_meeting_code()

    while db.query(models.Meeting).filter(models.Meeting.meeting_code == code).first():
        code = _generate_meeting_code()

    invite_link = f"{FRONTEND_ORIGIN}/join?code={code}"

    meeting = models.Meeting(
        meeting_code=code,
        host_id=host.id,
        title=body.title,
        description=body.description,
        status=models.MeetingStatus.scheduled,
        scheduled_start=body.scheduled_start,
        duration_minutes=body.duration_minutes,
        invite_link=invite_link,
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting


# ---------------------------------------------------------------------------
# POST /meetings/pmi  — start or reuse the Personal Meeting Room
# Must be declared BEFORE /{meeting_code} to avoid route shadowing
# ---------------------------------------------------------------------------
@router.post("/pmi", response_model=schemas.MeetingResponse, status_code=201)
def start_pmi_meeting(db: Session = Depends(get_db)):
    """
    Create (or fetch existing) a meeting whose code equals the host's PMI.
    The same room is always reused for a user's Personal Meeting ID.
    """
    host = _get_default_user(db)
    if not host.personal_meeting_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Personal Meeting ID not yet generated. Call GET /users/me first.",
        )

    code = host.personal_meeting_id
    existing = (
        db.query(models.Meeting)
        .filter(models.Meeting.meeting_code == code)
        .first()
    )
    if existing:
        return existing

    invite_link = f"{FRONTEND_ORIGIN}/join?code={code}"
    meeting = models.Meeting(
        meeting_code=code,
        host_id=host.id,
        title=f"{host.name}'s Personal Meeting Room",
        status=models.MeetingStatus.instant,
        invite_link=invite_link,
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting


# ---------------------------------------------------------------------------
# GET /meetings/upcoming  — must be declared BEFORE /{meeting_code}
# ---------------------------------------------------------------------------
@router.get("/upcoming", response_model=list[schemas.MeetingResponse])
def get_upcoming_meetings(db: Session = Depends(get_db)):
    """
    Return all scheduled meetings whose scheduled_start is in the future,
    ordered soonest-first.
    """
    now = datetime.now(timezone.utc)
    meetings = (
        db.query(models.Meeting)
        .filter(
            models.Meeting.status == models.MeetingStatus.scheduled,
            models.Meeting.scheduled_start >= now,
        )
        .order_by(models.Meeting.scheduled_start.asc())
        .all()
    )
    return meetings


# ---------------------------------------------------------------------------
# GET /meetings/recent
# ---------------------------------------------------------------------------
@router.get("/recent", response_model=list[schemas.MeetingResponse])
def get_recent_meetings(db: Session = Depends(get_db)):
    """
    Return the 10 most recent non-scheduled meetings (instant + ended),
    newest first.
    """
    meetings = (
        db.query(models.Meeting)
        .filter(models.Meeting.status != models.MeetingStatus.scheduled)
        .order_by(func.coalesce(models.Meeting.ended_at, models.Meeting.created_at).desc())
        .limit(10)
        .all()
    )
    return meetings


# ---------------------------------------------------------------------------
# PATCH /meetings/{meeting_code}/end  — mark a meeting as ended
# Must be declared BEFORE /{meeting_code} to avoid route shadowing
# ---------------------------------------------------------------------------
@router.patch("/{meeting_code}/end", response_model=schemas.MeetingResponse)
def end_meeting(meeting_code: str, db: Session = Depends(get_db)):
    """
    Mark a meeting as ended (status = 'ended').
    Called by the frontend when the host (or any participant) leaves.
    This ensures the meeting appears in the 'Recent' list with the correct status.
    """
    meeting = (
        db.query(models.Meeting)
        .filter(models.Meeting.meeting_code == meeting_code)
        .first()
    )
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meeting with code '{meeting_code}' not found.",
        )
    meeting.status = models.MeetingStatus.ended
    meeting.ended_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(meeting)
    return meeting


# ---------------------------------------------------------------------------
# GET /meetings/{meeting_code}  — validate / fetch single meeting
# ---------------------------------------------------------------------------
@router.get("/{meeting_code}", response_model=schemas.MeetingResponse)
def get_meeting(meeting_code: str, db: Session = Depends(get_db)):
    """
    Fetch a meeting by its code. Used by the join flow to validate the code
    before creating a participant record.
    """
    meeting = (
        db.query(models.Meeting)
        .filter(models.Meeting.meeting_code == meeting_code)
        .first()
    )
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meeting with code '{meeting_code}' not found.",
        )
    return meeting
