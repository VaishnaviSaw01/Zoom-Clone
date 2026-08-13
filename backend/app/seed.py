"""
seed.py — Populate the database with realistic sample data.

Run with:
    cd zoom-clone/backend
    python -m app.seed

What it creates:
  • 1 user  : Vaishnavi (the always-logged-in default user)
  • 4 past meetings  (status = instant | ended)
  • 3 upcoming scheduled meetings

The script is idempotent: if the default user already exists, it skips
re-seeding to avoid duplicate rows.
"""

from datetime import datetime, timedelta, timezone

from app.database import SessionLocal, engine, Base
from app import models

# Make sure tables exist before seeding
Base.metadata.create_all(bind=engine)


PAST_MEETINGS = [
    {
        "title": "Sprint Planning - Week 32",
        "status": models.MeetingStatus.ended,
        "days_ago": 1,
        "duration_minutes": 90,
    },
    {
        "title": "Product Review Q3",
        "status": models.MeetingStatus.ended,
        "days_ago": 3,
        "duration_minutes": 60,
    },
    {
        "title": "Design Sync",
        "status": models.MeetingStatus.instant,
        "days_ago": 5,
        "duration_minutes": 30,
    },
    {
        "title": "Backend Architecture Discussion",
        "status": models.MeetingStatus.ended,
        "days_ago": 7,
        "duration_minutes": 120,
    },
]

UPCOMING_MEETINGS = [
    {
        "title": "Weekly Team Standup",
        "description": "Daily sync for the dev team. Discuss blockers and progress.",
        "days_from_now": 1,
        "duration_minutes": 30,
    },
    {
        "title": "Client Demo - Phase 2",
        "description": "Showcase Phase 2 features to the stakeholders.",
        "days_from_now": 3,
        "duration_minutes": 60,
    },
    {
        "title": "Quarterly Roadmap Planning",
        "description": "Q4 roadmap alignment across all teams.",
        "days_from_now": 7,
        "duration_minutes": 120,
    },
]


def _make_code(index: int, prefix: str) -> str:
    return f"{prefix}{index:03d}-seed-{index:04d}"


def seed():
    db = SessionLocal()
    try:
        # ---- User ----
        existing_user = db.query(models.User).filter_by(email="vaishnavi@zoomclone.dev").first()
        if existing_user:
            print("[OK] Default user already exists -- skipping seed.")
            return

        user = models.User(
            name="Vaishnavi",
            email="vaishnavi@zoomclone.dev",
            avatar_color="#0E71EB",
            personal_meeting_id="pmi-987-6543",
        )
        db.add(user)
        db.flush()  # get user.id without committing

        now = datetime.now(timezone.utc)
        frontend = "http://localhost:3000"

        # ---- Past meetings ----
        for i, m in enumerate(PAST_MEETINGS):
            created = now - timedelta(days=m["days_ago"])
            code = f"past-{i+1:03d}-{i+1:04d}"
            meeting = models.Meeting(
                meeting_code=code,
                host_id=user.id,
                title=m["title"],
                status=m["status"],
                duration_minutes=m["duration_minutes"],
                invite_link=f"{frontend}/join?code={code}",
                created_at=created,
            )
            db.add(meeting)

        # ---- Upcoming meetings ----
        for i, m in enumerate(UPCOMING_MEETINGS):
            scheduled = now + timedelta(days=m["days_from_now"])
            code = f"sched-{i+1:03d}-{i+1:04d}"
            meeting = models.Meeting(
                meeting_code=code,
                host_id=user.id,
                title=m["title"],
                description=m.get("description"),
                status=models.MeetingStatus.scheduled,
                scheduled_start=scheduled,
                duration_minutes=m["duration_minutes"],
                invite_link=f"{frontend}/join?code={code}",
            )
            db.add(meeting)

        db.commit()
        print("[OK] Seed complete.")
        print(f"  User    : Vaishnavi (id={user.id})")
        print(f"  Past    : {len(PAST_MEETINGS)} meetings")
        print(f"  Upcoming: {len(UPCOMING_MEETINGS)} meetings")

    except Exception as exc:
        db.rollback()
        raise exc
    finally:
        db.close()


if __name__ == "__main__":
    seed()
