"""
schemas.py — Pydantic request / response models (DTOs).

Kept strictly separate from SQLAlchemy ORM models so that:
  1. We never accidentally leak ORM internals (lazy-loaded relationships, etc.)
     into API responses.
  2. Request schemas can validate + coerce input independently of DB state.
  3. Response schemas let us shape the JSON payload exactly as the frontend
     expects, without being tied to table column names.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


# ---------------------------------------------------------------------------
# User schemas
# ---------------------------------------------------------------------------
class UserBase(BaseModel):
    name: str
    email: str
    avatar_color: str = "#0E71EB"


class UserResponse(UserBase):
    id: int
    personal_meeting_id: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    name: Optional[str] = None
    avatar_color: Optional[str] = None



# ---------------------------------------------------------------------------
# Meeting schemas
# ---------------------------------------------------------------------------
class InstantMeetingRequest(BaseModel):
    """Body for POST /meetings/instant — nothing required from the client."""
    title: str = "Instant Meeting"


class ScheduleMeetingRequest(BaseModel):
    """Body for POST /meetings/schedule."""
    title: str
    description: Optional[str] = None
    scheduled_start: datetime          # ISO-8601 datetime from the frontend
    duration_minutes: int = 60


class MeetingResponse(BaseModel):
    id: int
    meeting_code: str
    host_id: int
    title: str
    description: Optional[str]
    status: str
    scheduled_start: Optional[datetime]
    duration_minutes: Optional[int]
    invite_link: str
    created_at: datetime
    ended_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Participant schemas
# ---------------------------------------------------------------------------
class JoinMeetingRequest(BaseModel):
    """Body for POST /meetings/{meeting_code}/join."""
    display_name: str


class ParticipantResponse(BaseModel):
    id: int
    meeting_id: int
    display_name: str
    joined_at: datetime
    left_at: Optional[datetime]
    is_host: bool

    model_config = {"from_attributes": True}
