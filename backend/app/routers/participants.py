"""
routers/participants.py — Participant-related endpoints.

Routes:
  POST  /meetings/{meeting_code}/join          → create participant record
  GET   /meetings/{meeting_code}/participants  → list all participants
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/meetings", tags=["participants"])


def _get_meeting_or_404(meeting_code: str, db: Session) -> models.Meeting:
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


# ---------------------------------------------------------------------------
# POST /meetings/{meeting_code}/join
# ---------------------------------------------------------------------------
@router.post(
    "/{meeting_code}/join",
    response_model=schemas.ParticipantResponse,
    status_code=201,
)
def join_meeting(
    meeting_code: str,
    body: schemas.JoinMeetingRequest,
    db: Session = Depends(get_db),
):
    """
    Create a participant record for the joining user.
    is_host is True if this is the first participant (i.e., the creator).
    """
    meeting = _get_meeting_or_404(meeting_code, db)

    # Determine host status: first person to join becomes the host
    existing_count = (
        db.query(models.Participant)
        .filter(models.Participant.meeting_id == meeting.id)
        .count()
    )
    is_host = existing_count == 0

    participant = models.Participant(
        meeting_id=meeting.id,
        display_name=body.display_name,
        joined_at=datetime.now(timezone.utc),
        is_host=is_host,
    )
    db.add(participant)
    db.commit()
    db.refresh(participant)
    return participant


# ---------------------------------------------------------------------------
# GET /meetings/{meeting_code}/participants
# ---------------------------------------------------------------------------
@router.get(
    "/{meeting_code}/participants",
    response_model=list[schemas.ParticipantResponse],
)
def list_participants(meeting_code: str, db: Session = Depends(get_db)):
    """
    Return all participant records for a meeting, ordered by join time.
    """
    meeting = _get_meeting_or_404(meeting_code, db)
    participants = (
        db.query(models.Participant)
        .filter(models.Participant.meeting_id == meeting.id)
        .order_by(models.Participant.joined_at.asc())
        .all()
    )
    return participants
