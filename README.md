# ZoomClone — Full-Stack Video Meeting Application

A production-shaped Zoom clone built as an SDE graded assignment. It demonstrates a clean separation between a Python **FastAPI** backend and a **Next.js 14** frontend, backed by **SQLite** via SQLAlchemy. The video meeting room is a convincing UI-state simulation (no WebRTC required for this scope).

---

## Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend framework | Next.js 14 (App Router) | Server/client component split, file-based routing, built-in SSR |
| Frontend language | TypeScript | Catches API shape mismatches at compile time |
| Styling | Tailwind CSS | Utility-first; easy to build Zoom's clean aesthetic quickly |
| Backend framework | FastAPI | Async Python, auto-generates OpenAPI docs, Pydantic validation built-in |
| ORM | SQLAlchemy 2.0 | Clean model definitions; trivial to swap SQLite → PostgreSQL |
| Database | SQLite | Zero-config for local/assignment use; same query interface as Postgres |
| Icons | lucide-react | Consistent icon set matching modern UI standards |

---

## Setup Instructions

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm 9+

---

### Backend

```bash
# From repo root
cd zoom-clone/backend

# 1. Create virtual environment
python -m venv venv

# 2. Activate it
# Windows PowerShell:
venv\Scripts\Activate.ps1
# Windows CMD:
venv\Scripts\activate.bat
# macOS/Linux:
source venv/bin/activate

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Seed the database (creates zoom.db with sample data)
python -m app.seed

# 5. Start the dev server
uvicorn app.main:app --reload
```

Backend is live at: **http://localhost:8000**  
Interactive API docs: **http://localhost:8000/docs**

---

### Frontend

```bash
# From repo root
cd zoom-clone/frontend

# 1. Install Node dependencies
npm install

# 2. Create environment file
cp .env.local.example .env.local
# (No edits needed for local development — defaults to localhost:8000)

# 3. Start the dev server
npm run dev
```

Frontend is live at: **http://localhost:3000**

### `.env.local` example

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Database Schema

### Tables

#### `users`
| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `name` | VARCHAR(100) | Display name |
| `email` | VARCHAR(200) UNIQUE | Unique identifier |
| `avatar_color` | VARCHAR(20) | Hex color for avatar UI |
| `created_at` | DATETIME | UTC timestamp |

#### `meetings`
| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `meeting_code` | VARCHAR(20) UNIQUE **INDEXED** | Used as the join key (fast lookup) |
| `host_id` | INTEGER FK → users.id | The creator of the meeting |
| `title` | VARCHAR(200) | Human-readable title |
| `description` | TEXT NULL | Optional agenda / notes |
| `status` | VARCHAR(20) | `instant` / `scheduled` / `ended` |
| `scheduled_start` | DATETIME NULL | NULL for instant meetings |
| `duration_minutes` | INTEGER NULL | Planned duration |
| `invite_link` | VARCHAR(500) | Full join URL |
| `created_at` | DATETIME | UTC timestamp |

#### `participants`
| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `meeting_id` | INTEGER FK → meetings.id | Which meeting |
| `display_name` | VARCHAR(100) | Name shown in the room |
| `joined_at` | DATETIME | When they entered |
| `left_at` | DATETIME NULL | NULL = still in call |
| `is_host` | BOOLEAN | First joiner becomes host |

### Relationship Diagram

```
users (1) ──────── (N) meetings
                        │
                   (1) meetings ──── (N) participants
```

### Design Justifications

**Why `meeting_code` as a separate column (not the PK)?**  
The integer PK is stable and cheap to use as a FK target in `participants`. The `meeting_code` is user-facing and could theoretically change format in future versions without breaking FK references. The `UNIQUE` constraint + `Index` on `meeting_code` gives O(log n) join lookups without making it the clustered key.

**Why is `status` on `meetings`, not derived from `participants`?**  
Status represents the *room's* lifecycle (`instant` → `ended`, `scheduled` → `instant` → `ended`). Deriving it from participant presence would require a live-attendance count query every time the dashboard loads — unnecessary complexity at this scale. A simple string column lets us transition state explicitly (e.g. when the host ends the call).

**Why are `scheduled_start` and `duration_minutes` on `meetings`, not `participants`?**  
These fields describe the *event*, not an attendee. Every participant joins the same scheduled time and duration. Putting them on `participants` would denormalise data and require updating N rows if the host reschedules.

**Why is `left_at` nullable on `participants`?**  
`left_at IS NULL` means the participant is still active. This allows the backend to distinguish "in call" from "left" without a separate boolean column, and also enables computing per-session duration (`left_at - joined_at`).

---

## Folder Structure

```
zoom-clone/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI app + CORS + router registration
│   │   ├── database.py      # SQLAlchemy engine + session factory
│   │   ├── models.py        # ORM models (User, Meeting, Participant)
│   │   ├── schemas.py       # Pydantic request/response DTOs
│   │   ├── seed.py          # Database seeder (python -m app.seed)
│   │   └── routers/
│   │       ├── __init__.py
│   │       ├── meetings.py      # /meetings/* endpoints
│   │       └── participants.py  # /meetings/{code}/join + participants
│   ├── requirements.txt
│   └── README.md
│
├── frontend/
│   ├── app/
│   │   ├── layout.tsx              # Root layout + metadata
│   │   ├── globals.css             # Tailwind + global styles
│   │   ├── page.tsx                # Dashboard (/)
│   │   ├── join/page.tsx           # Join meeting (/join)
│   │   ├── schedule/page.tsx       # Schedule meeting (/schedule)
│   │   └── meeting/[meetingId]/
│   │       └── page.tsx            # Meeting room (/meeting/[id])
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── MeetingCard.tsx
│   │   ├── NewMeetingModal.tsx
│   │   ├── JoinMeetingForm.tsx
│   │   ├── ScheduleForm.tsx
│   │   └── MeetingRoom/
│   │       ├── VideoTile.tsx
│   │       ├── Controls.tsx
│   │       └── ParticipantList.tsx
│   ├── lib/
│   │   ├── api.ts             # Centralised fetch client (no inline fetches)
│   │   └── types.ts           # TypeScript interfaces matching Pydantic schemas
│   ├── .env.local.example
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── tsconfig.json
│
└── README.md   ← you are here
```

---

## Assumptions Made

1. **No authentication** — A single default user "Vaishnavi" (seeded in the DB) is assumed to always be logged in. The `users` table exists and is fully normalised so the schema looks production-ready, but the frontend never prompts for login.

2. **Simulated video grid** — The meeting room renders a 5-tile video grid using avatar/initials placeholders. No WebRTC media streams are involved. Mute and camera-off states are local UI toggles only — appropriate for an assignment with this timeline.

3. **Meeting code format** — Codes follow the format `xxx-xxx-xxxx` (10 lowercase alphanumeric chars). They are randomly generated and collision-checked at creation time.

4. **Participant join on page load** — Navigating to `/meeting/[id]` automatically calls `POST /meetings/{code}/join` with display name "Vaishnavi". A real app would ask for the name first via the join form.

5. **No WebSocket / polling** — The participant list is fetched once on mount. A production app would use WebSockets or SSE to sync participant state in real time.

6. **SQLite only** — Suitable for local development and graded demos. Swapping to PostgreSQL requires only changing `DATABASE_URL` in `database.py` and installing `psycopg2`.

7. **CORS origins** — Only `localhost:3000` is whitelisted. Update `allow_origins` in `main.py` for deployed environments.

---

## Deployment Links

| Service | URL |
|---|---|
| Frontend (Vercel) | _TODO: add after deploy_ |
| Backend (Render / Railway) | _TODO: add after deploy_ |

---

## API Reference

Full interactive docs at: `http://localhost:8000/docs` (Swagger UI auto-generated by FastAPI)
