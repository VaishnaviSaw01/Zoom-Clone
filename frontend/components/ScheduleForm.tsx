"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Copy, Loader2, CheckCircle2 } from "lucide-react";
import { scheduleMeeting } from "@/lib/api";
import type { Meeting } from "@/lib/types";

const DURATION_OPTIONS = [
  { label: "30 minutes", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "1.5 hours", value: 90 },
  { label: "2 hours", value: 120 },
  { label: "3 hours", value: 180 },
];

/**
 * ScheduleForm — full-featured form for creating a scheduled meeting.
 * On submit calls POST /meetings/schedule and shows the invite link.
 */
export default function ScheduleForm() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [duration, setDuration] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Meeting | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Meeting title is required.");
      return;
    }
    if (!dateTime) {
      setError("Please pick a date and time.");
      return;
    }

    const scheduledStart = new Date(dateTime).toISOString();

    if (new Date(scheduledStart) <= new Date()) {
      setError("Scheduled time must be in the future.");
      return;
    }

    setLoading(true);
    try {
      const meeting = await scheduleMeeting({
        title: title.trim(),
        description: description.trim() || undefined,
        scheduled_start: scheduledStart,
        duration_minutes: duration,
      });
      setCreated(meeting);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule meeting");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!created) return;
    await navigator.clipboard.writeText(created.invite_link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ---- Success state ----
  useEffect(() => {
    if (created) {
      const timer = setTimeout(() => {
        router.push("/");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [created, router]);

  if (created) {
    return (
      <div className="space-y-5 animate-slide-up">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-3">
            <CheckCircle2 className="w-7 h-7 text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-zoom-dark">Meeting Scheduled!</h3>
          <p className="text-sm text-gray-500 mt-1">{created.title}</p>
        </div>

        {/* Code */}
        <div className="bg-zoom-light-gray rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Meeting ID</p>
          <p
            id="scheduled-meeting-code"
            className="font-mono text-lg font-bold text-zoom-dark tracking-wider"
          >
            {created.meeting_code}
          </p>
        </div>

        {/* Invite link */}
        <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5">
          <p className="flex-1 text-xs text-gray-600 truncate font-mono">
            {created.invite_link}
          </p>
          <button
            id="copy-scheduled-link-btn"
            onClick={handleCopy}
            className="flex-shrink-0 text-xs font-semibold text-zoom-blue hover:text-zoom-blue-dark
                       flex items-center gap-1 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        <div className="flex gap-3">
          <button
            id="back-to-dashboard-btn"
            className="btn-secondary flex-1"
            onClick={() => router.push("/")}
          >
            Back to Dashboard
          </button>
          <button
            id="join-scheduled-meeting-btn"
            className="btn-primary flex-1"
            onClick={() => router.push(`/meeting/${created.meeting_code}`)}
          >
            Join Now
          </button>
        </div>
        {/* Navigate back automatically so dashboard re-fetches and shows the new meeting */}
        <p className="text-xs text-center text-gray-400 dark:text-gray-500">
          Returning to dashboard in a few seconds…
        </p>
      </div>
    );
  }

  // ---- Form state ----
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label
          htmlFor="schedule-title"
          className="block text-sm font-medium text-zoom-dark mb-1.5"
        >
          Meeting Title <span className="text-red-500">*</span>
        </label>
        <input
          id="schedule-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Weekly Team Standup"
          className="input-field"
        />
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="schedule-description"
          className="block text-sm font-medium text-zoom-dark mb-1.5"
        >
          Description{" "}
          <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="schedule-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Agenda, topics to discuss…"
          rows={3}
          className="input-field resize-none"
        />
      </div>

      {/* Date/time */}
      <div>
        <label
          htmlFor="schedule-datetime"
          className="block text-sm font-medium text-zoom-dark mb-1.5"
        >
          Date & Time <span className="text-red-500">*</span>
        </label>
        <input
          id="schedule-datetime"
          type="datetime-local"
          value={dateTime}
          onChange={(e) => setDateTime(e.target.value)}
          className="input-field"
          min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
        />
      </div>

      {/* Duration */}
      <div>
        <label
          htmlFor="schedule-duration"
          className="block text-sm font-medium text-zoom-dark mb-1.5"
        >
          Duration
        </label>
        <select
          id="schedule-duration"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="input-field"
        >
          {DURATION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <button
        id="schedule-submit-btn"
        type="submit"
        disabled={loading}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <CalendarDays className="w-4 h-4" />
        )}
        {loading ? "Scheduling…" : "Schedule Meeting"}
      </button>
    </form>
  );
}
