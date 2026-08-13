/**
 * api.ts — Centralized API client.
 *
 * ALL backend calls must go through this file — no inline fetch() calls
 * scattered across components. This makes it trivial to:
 *   • Swap the base URL via env var
 *   • Add auth headers later
 *   • Mock the API in tests
 */

import type {
  Meeting,
  Participant,
  InstantMeetingRequest,
  ScheduleMeetingRequest,
  JoinMeetingRequest,
} from "./types";

// Read from environment variable — never hardcode localhost in committed code.
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ---------------------------------------------------------------------------
// Generic fetch wrapper with error handling
// ---------------------------------------------------------------------------
async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    // Try to parse the FastAPI error detail
    let detail = `HTTP ${res.status}`;
    try {
      const errorBody = await res.json();
      detail = errorBody.detail ?? detail;
    } catch {
      // ignore JSON parse errors on error responses
    }
    throw new Error(detail);
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Meetings API
// ---------------------------------------------------------------------------

/** Create an instant meeting for the default user. */
export async function createInstantMeeting(
  body: InstantMeetingRequest = {}
): Promise<Meeting> {
  return apiFetch<Meeting>("/meetings/instant", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Schedule a meeting with a future start time. */
export async function scheduleMeeting(
  body: ScheduleMeetingRequest
): Promise<Meeting> {
  return apiFetch<Meeting>("/meetings/schedule", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Validate a meeting code — returns the Meeting or throws on 404. */
export async function getMeeting(meetingCode: string): Promise<Meeting> {
  return apiFetch<Meeting>(`/meetings/${encodeURIComponent(meetingCode)}`);
}

/** Return all upcoming scheduled meetings (future scheduled_start). */
export async function getUpcomingMeetings(): Promise<Meeting[]> {
  return apiFetch<Meeting[]>("/meetings/upcoming");
}

/** Return the 10 most recent instant / ended meetings. */
export async function getRecentMeetings(): Promise<Meeting[]> {
  return apiFetch<Meeting[]>("/meetings/recent");
}

// ---------------------------------------------------------------------------
// Participants API
// ---------------------------------------------------------------------------

/** Join a meeting — creates a participant record and returns it. */
export async function joinMeeting(
  meetingCode: string,
  body: JoinMeetingRequest
): Promise<Participant> {
  return apiFetch<Participant>(
    `/meetings/${encodeURIComponent(meetingCode)}/join`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
}

/** List all participants currently associated with a meeting. */
export async function getParticipants(
  meetingCode: string
): Promise<Participant[]> {
  return apiFetch<Participant[]>(
    `/meetings/${encodeURIComponent(meetingCode)}/participants`
  );
}
