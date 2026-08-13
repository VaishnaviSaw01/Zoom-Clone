"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { getMeeting, joinMeeting } from "@/lib/api";

/**
 * JoinMeetingForm — handles the join flow:
 * 1. User enters a meeting code (or the code is pre-filled from URL params)
 * 2. On submit: calls GET /meetings/{code} to validate, then POST /join
 * 3. On success: navigates to /meeting/[code]
 * 4. On failure: shows a clear inline error
 */
export default function JoinMeetingForm({
  initialCode = "",
}: {
  initialCode?: string;
}) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode);
  const [displayName, setDisplayName] = useState("Vaishnavi");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If the invite link contains a full URL, extract just the code
  function normaliseCode(raw: string): string {
    try {
      const url = new URL(raw);
      return url.searchParams.get("code") ?? raw.trim();
    } catch {
      return raw.trim();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const meetingCode = normaliseCode(code);

    if (!meetingCode) {
      setError("Please enter a meeting ID or invite link.");
      return;
    }
    if (!displayName.trim()) {
      setError("Please enter your display name.");
      return;
    }

    setLoading(true);
    try {
      // Step 1: validate the code exists
      await getMeeting(meetingCode);
      // Step 2: create participant record
      await joinMeeting(meetingCode, { display_name: displayName.trim() });
      // Step 3: navigate
      router.push(`/meeting/${meetingCode}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      if (msg.includes("404") || msg.toLowerCase().includes("not found")) {
        setError(
          "That meeting ID doesn't exist. Please check the code and try again."
        );
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error banner */}
      {error && (
        <div
          id="join-error-banner"
          className="flex items-start gap-3 bg-red-50 border border-red-200
                     rounded-xl px-4 py-3 animate-fade-in"
        >
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Meeting code / invite link */}
      <div>
        <label
          htmlFor="meeting-code-input"
          className="block text-sm font-medium text-zoom-dark mb-1.5"
        >
          Meeting ID or Invite Link
        </label>
        <input
          id="meeting-code-input"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. abc-def-ghij or paste invite link"
          className="input-field"
          autoFocus
        />
      </div>

      {/* Display name */}
      <div>
        <label
          htmlFor="display-name-input"
          className="block text-sm font-medium text-zoom-dark mb-1.5"
        >
          Your Name
        </label>
        <input
          id="display-name-input"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Enter your display name"
          className="input-field"
        />
      </div>

      <button
        id="join-submit-btn"
        type="submit"
        disabled={loading}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? "Joining…" : "Join Meeting"}
      </button>
    </form>
  );
}
