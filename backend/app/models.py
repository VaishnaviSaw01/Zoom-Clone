"""
models.py — SQLAlchemy ORM models.

Three tables:
  users        — one row per account (we seed a single default user "Vaishnavi")
  meetings     — one row per room, with a UNIQUE meeting_code for fast joins
  participants — join table tracking who entered / left which meeting

Design notes
------------
- meeting_code is a separate column (not the PK) so the integer PK can serve
  as a stable FK target while the code itself can theoretically be recycled or
  reformatted without touching FKs.
- status is a plain string enum column rather than a SQL ENUM type so that
  SQLite (which has no native ENUM) stays compatible. FastAPI / Pydantic will
  validate the value at the API layer.
- scheduled_start and duration_minutes live on Meeting, NOT on Participant,
  because they describe the *room*, not a specific attendee.
- left_at on Participant allows us to compute actual per-person duration and
  to distinguish "still in call" (left_at IS NULL) from "left" rows.
"""

import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.database import Base


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(200), unique=True, nullable=False)
    avatar_color = Column(String(20), default="#0E71EB")  # hex color for avatar
    personal_meeting_id = Column(String(20), unique=True, nullable=True) # Fixed PMI for the user
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # back-reference so we can do user.hosted_meetings
    hosted_meetings = relationship("Meeting", back_populates="host")


# ---------------------------------------------------------------------------
# Meeting status literals
# ---------------------------------------------------------------------------
class MeetingStatus(str, enum.Enum):
    instant = "instant"
    scheduled = "scheduled"
    ended = "ended"


# ---------------------------------------------------------------------------
# Meeting
# ---------------------------------------------------------------------------
class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    meeting_code = Column(String(20), unique=True, nullable=False)
    host_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False, default="Instant Meeting")
    description = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default=MeetingStatus.instant)
    scheduled_start = Column(DateTime, nullable=True)   # NULL for instant meetings
    duration_minutes = Column(Integer, nullable=True, default=60)
    invite_link = Column(String(500), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    ended_at = Column(DateTime, nullable=True)

    host = relationship("User", back_populates="hosted_meetings")
    participants = relationship("Participant", back_populates="meeting", cascade="all, delete-orphan")


# Fast lookup by meeting code (used in join flow)
Index("ix_meetings_meeting_code", Meeting.meeting_code)


# ---------------------------------------------------------------------------
# Participant
# ---------------------------------------------------------------------------
class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=False)
    display_name = Column(String(100), nullable=False)
    joined_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    left_at = Column(DateTime, nullable=True)  # NULL means still in the call
    is_host = Column(Boolean, default=False, nullable=False)

    meeting = relationship("Meeting", back_populates="participants")
