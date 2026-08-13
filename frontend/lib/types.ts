/**
 * types.ts — Shared TypeScript interfaces matching the Pydantic response schemas.
 *
 * Keep these in sync with backend/app/schemas.py.
 * These are the shapes FastAPI returns — always use these instead of `any`.
 */

export type MeetingStatus = "instant" | "scheduled" | "ended";

export interface User {
  id: number;
  name: string;
  email: string;
  avatar_color: string;
  created_at: string; // ISO-8601 string from JSON
}

export interface Meeting {
  id: number;
  meeting_code: string;
  host_id: number;
  title: string;
  description: string | null;
  status: MeetingStatus;
  scheduled_start: string | null; // ISO-8601 or null for instant meetings
  duration_minutes: number | null;
  invite_link: string;
  created_at: string;
}

export interface Participant {
  id: number;
  meeting_id: number;
  display_name: string;
  joined_at: string;
  left_at: string | null;
  is_host: boolean;
}

// ---- Request payloads ----

export interface InstantMeetingRequest {
  title?: string;
}

export interface ScheduleMeetingRequest {
  title: string;
  description?: string;
  scheduled_start: string; // ISO-8601
  duration_minutes: number;
}

export interface JoinMeetingRequest {
  display_name: string;
}
