"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Copy, Wifi, WifiOff, Clock } from "lucide-react";
import VideoTile, { colorFromName } from "@/components/MeetingRoom/VideoTile";
import Controls from "@/components/MeetingRoom/Controls";
import ParticipantList from "@/components/MeetingRoom/ParticipantList";
import { getMeeting, getParticipants, joinMeeting } from "@/lib/api";
import type { Meeting, Participant } from "@/lib/types";

// ---------------------------------------------------------------------------
// Simulated extra participants for the video grid (makes the UI look alive)
// ---------------------------------------------------------------------------
const SIM_PARTICIPANTS = [
  { name: "Arjun Mehta", muted: true, camOff: false },
  { name: "Priya Sharma", muted: false, camOff: false },
  { name: "Rohit Gupta", muted: true, camOff: true },
  { name: "Anjali Singh", muted: false, camOff: false },
];

/** Format seconds as mm:ss */
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/**
 * MeetingRoomPage — /meeting/[meetingId]
 *
 * Architecture:
 * - Fetches real meeting data from backend on mount
 * - Joins the meeting (creates participant record) on mount
 * - Renders a simulated video grid (no WebRTC — convincing UI state)
 * - State (mute, camera, participant panel) lives here; passed down as props
 */
export default function MeetingRoomPage() {
  const router = useRouter();
  const params = useParams();
  const meetingCode = params.meetingId as string;

  // ---- Server-fetched state ----
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ---- UI state ----
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isParticipantListOpen, setIsParticipantListOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0); // seconds
  const [copied, setCopied] = useState(false);

  // ---- Load meeting + join on mount ----
  useEffect(() => {
    async function init() {
      try {
        const m = await getMeeting(meetingCode);
        setMeeting(m);

        // Join (creates participant record in DB)
        try {
          await joinMeeting(meetingCode, { display_name: "Vaishnavi" });
        } catch {
          // If already joined (e.g. page refresh), swallow the error
        }

        const ps = await getParticipants(meetingCode);
        setParticipants(ps);
      } catch (err) {
        setLoadError(
          err instanceof Error ? err.message : "Meeting not found"
        );
      }
    }
    init();
  }, [meetingCode]);

  // ---- Call timer ----
  useEffect(() => {
    const interval = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // ---- Handlers ----
  const handleLeave = useCallback(() => {
    router.push("/");
  }, [router]);

  async function handleCopyLink() {
    if (!meeting) return;
    await navigator.clipboard.writeText(meeting.invite_link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ---- Error state ----
  if (loadError) {
    return (
      <div className="min-h-screen bg-zoom-dark flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <WifiOff className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-white text-xl font-bold">Meeting Not Found</h2>
          <p className="text-gray-400 text-sm max-w-xs">{loadError}</p>
          <button
            onClick={() => router.push("/")}
            className="btn-primary mt-2"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // ---- Video grid layout ----
  // Show the current user + simulated participants
  const totalTiles = 1 + SIM_PARTICIPANTS.length; // 5 tiles
  const gridCols =
    totalTiles <= 1
      ? "grid-cols-1"
      : totalTiles <= 2
      ? "grid-cols-2"
      : totalTiles <= 4
      ? "grid-cols-2"
      : "grid-cols-3 lg:grid-cols-3";

  return (
    <div className="h-screen bg-zoom-dark flex flex-col overflow-hidden">
      {/* ---- Top bar ---- */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3
                      bg-zoom-dark border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Status dot */}
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse-slow" />
            <span className="text-xs text-green-400 font-medium hidden sm:block">Live</span>
          </div>
          {/* Meeting title */}
          <h1 className="text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-xs">
            {meeting?.title ?? "Loading…"}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Timer */}
          <div className="flex items-center gap-1.5 text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs font-mono">{formatDuration(elapsed)}</span>
          </div>

          {/* Meeting code */}
          <div className="hidden sm:flex items-center gap-1.5 bg-white/5 rounded-lg px-3 py-1.5">
            <span className="text-xs text-gray-400 font-mono">{meetingCode}</span>
            <button
              id="copy-meeting-code-topbar"
              onClick={handleCopyLink}
              title="Copy invite link"
              className="text-gray-400 hover:text-white transition-colors"
            >
              {copied ? (
                <span className="text-xs text-green-400">Copied!</span>
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Connection indicator */}
          <Wifi className="w-4 h-4 text-green-400 hidden sm:block" />
        </div>
      </div>

      {/* ---- Main content (grid + optional side panel) ---- */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video grid */}
        <div className="flex-1 p-3 sm:p-4 overflow-hidden">
          <div className={`grid ${gridCols} gap-2 sm:gap-3 h-full auto-rows-fr`}>
            {/* Self tile */}
            <VideoTile
              name="Vaishnavi (You)"
              isMuted={isMuted}
              isCameraOff={isCameraOff}
              isActive={true}
            />

            {/* Simulated participant tiles */}
            {SIM_PARTICIPANTS.map((p) => (
              <VideoTile
                key={p.name}
                name={p.name}
                isMuted={p.muted}
                isCameraOff={p.camOff}
              />
            ))}
          </div>
        </div>

        {/* Participant list side panel */}
        {isParticipantListOpen && (
          <ParticipantList
            participants={
              participants.length > 0
                ? participants
                : [
                    // Fallback simulated list while API loads
                    {
                      id: 0,
                      meeting_id: 0,
                      display_name: "Vaishnavi (You)",
                      joined_at: new Date().toISOString(),
                      left_at: null,
                      is_host: true,
                    },
                    ...SIM_PARTICIPANTS.map((p, i) => ({
                      id: i + 1,
                      meeting_id: 0,
                      display_name: p.name,
                      joined_at: new Date().toISOString(),
                      left_at: null,
                      is_host: false,
                    })),
                  ]
            }
            onClose={() => setIsParticipantListOpen(false)}
          />
        )}
      </div>

      {/* ---- Controls bar ---- */}
      <Controls
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        isParticipantListOpen={isParticipantListOpen}
        onToggleMute={() => setIsMuted((v) => !v)}
        onToggleCamera={() => setIsCameraOff((v) => !v)}
        onToggleParticipants={() => setIsParticipantListOpen((v) => !v)}
        onLeave={handleLeave}
      />
    </div>
  );
}
