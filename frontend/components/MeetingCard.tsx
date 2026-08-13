"use client";

import { Calendar, Clock, Copy, ExternalLink } from "lucide-react";
import type { Meeting } from "@/lib/types";
import { useState } from "react";

interface MeetingCardProps {
  meeting: Meeting;
  /** "upcoming" shows scheduled_start; "recent" shows created_at */
  variant: "upcoming" | "recent";
}

/** Format a UTC ISO string to a friendly local time string. */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_BADGE: Record<string, string> = {
  instant: "bg-blue-100 text-blue-700",
  scheduled: "bg-purple-100 text-purple-700",
  ended: "bg-gray-100 text-gray-500",
};

/**
 * MeetingCard — renders one meeting in either the Upcoming or Recent list.
 * Shows title, status badge, time, duration, and a copy-link button.
 */
export default function MeetingCard({ meeting, variant }: MeetingCardProps) {
  const [copied, setCopied] = useState(false);

  const dateStr =
    variant === "upcoming" && meeting.scheduled_start
      ? formatDate(meeting.scheduled_start)
      : formatDate(meeting.created_at);

  async function handleCopy() {
    await navigator.clipboard.writeText(meeting.invite_link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="card p-4 flex flex-col sm:flex-row sm:items-center gap-3 animate-fade-in">
      {/* Color dot */}
      <div className="w-10 h-10 rounded-xl bg-zoom-blue-light flex items-center justify-center flex-shrink-0">
        <Calendar className="w-5 h-5 text-zoom-blue" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm text-zoom-dark truncate">
          {meeting.title}
        </h3>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {dateStr}
          </span>
          {meeting.duration_minutes && (
            <span className="text-xs text-gray-400">
              {meeting.duration_minutes} min
            </span>
          )}
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              STATUS_BADGE[meeting.status] ?? "bg-gray-100 text-gray-500"
            }`}
          >
            {meeting.status}
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5 font-mono">
          {meeting.meeting_code}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          id={`copy-link-${meeting.meeting_code}`}
          onClick={handleCopy}
          title="Copy invite link"
          className="p-2 rounded-lg text-gray-400 hover:text-zoom-blue hover:bg-zoom-blue-light
                     transition-colors duration-150"
        >
          {copied ? (
            <span className="text-xs text-green-600 font-medium">Copied!</span>
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
        <a
          href={`/meeting/${meeting.meeting_code}`}
          id={`join-btn-${meeting.meeting_code}`}
          className="text-xs font-semibold text-zoom-blue hover:text-zoom-blue-dark
                     flex items-center gap-1 transition-colors duration-150"
        >
          Join <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
