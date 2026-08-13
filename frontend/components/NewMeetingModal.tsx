"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Video, X, Loader2 } from "lucide-react";
import { createInstantMeeting } from "@/lib/api";
import type { Meeting } from "@/lib/types";

interface NewMeetingModalProps {
  onClose: () => void;
}

/**
 * NewMeetingModal — displayed when user clicks "New Meeting".
 *
 * Step 1: Show a "Start" button → calls POST /meetings/instant
 * Step 2: Show the generated meeting code + copyable invite link
 * Step 3: Redirect to /meeting/[meetingId]
 */
export default function NewMeetingModal({ onClose }: NewMeetingModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setLoading(true);
    setError(null);
    try {
      const m = await createInstantMeeting({ title: "Instant Meeting" });
      setMeeting(m);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create meeting");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!meeting) return;
    await navigator.clipboard.writeText(meeting.invite_link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleJoin() {
    if (!meeting) return;
    onClose();
    router.push(`/meeting/${meeting.meeting_code}`);
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-0">
          <h2 className="text-lg font-bold text-zoom-dark">New Meeting</h2>
          <button
            id="close-new-meeting-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600
                       transition-colors duration-150"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {!meeting ? (
            <>
              {/* Illustration */}
              <div className="w-16 h-16 mx-auto bg-zoom-blue-light rounded-2xl flex items-center justify-center">
                <Video className="w-8 h-8 text-zoom-blue" />
              </div>
              <p className="text-center text-sm text-gray-500">
                Start an instant meeting and share the link with others.
              </p>

              {error && (
                <p className="text-sm text-red-600 text-center bg-red-50 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <button
                id="start-instant-meeting-btn"
                onClick={handleStart}
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Video className="w-4 h-4" />
                )}
                {loading ? "Creating…" : "Start Instant Meeting"}
              </button>
            </>
          ) : (
            <>
              {/* Success state */}
              <div className="text-center space-y-1">
                <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <Video className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-zoom-dark">
                  Meeting Created!
                </h3>
                <p className="text-sm text-gray-500">
                  Share this ID or link with participants
                </p>
              </div>

              {/* Meeting code */}
              <div className="bg-zoom-light-gray rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Meeting ID</p>
                <p
                  id="generated-meeting-code"
                  className="font-mono text-lg font-bold text-zoom-dark tracking-wider"
                >
                  {meeting.meeting_code}
                </p>
              </div>

              {/* Invite link */}
              <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5">
                <p className="flex-1 text-xs text-gray-600 truncate font-mono">
                  {meeting.invite_link}
                </p>
                <button
                  id="copy-invite-link-btn"
                  onClick={handleCopy}
                  className="flex-shrink-0 text-xs font-semibold text-zoom-blue hover:text-zoom-blue-dark
                             flex items-center gap-1 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>

              <button
                id="join-my-meeting-btn"
                onClick={handleJoin}
                className="btn-primary w-full"
              >
                Join Meeting Now
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
