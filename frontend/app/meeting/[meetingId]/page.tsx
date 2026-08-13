"use client";

import { useEffect, useState, useCallback, useRef, memo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Copy, Wifi, WifiOff, Clock } from "lucide-react";
import VideoTile from "@/components/MeetingRoom/VideoTile";
import Controls from "@/components/MeetingRoom/Controls";
import ParticipantList from "@/components/MeetingRoom/ParticipantList";
import ChatPanel from "@/components/MeetingRoom/ChatPanel";
import JoinLobby from "@/components/MeetingRoom/JoinLobby";
import { getMeeting, getParticipants, joinMeeting, endMeeting } from "@/lib/api";
import { useMediaStream } from "@/hooks/useMediaStream";
import { useAudioLevel } from "@/hooks/useAudioLevel";
import { useUser } from "@/lib/user-context";
import type { Meeting, Participant } from "@/lib/types";

// ---------------------------------------------------------------------------
// Simulated remote participants (no WebRTC signaling in scope)
// ---------------------------------------------------------------------------
const SIM_PARTICIPANTS = [
  { name: "Arjun Mehta", muted: true, camOff: false },
  { name: "Priya Sharma", muted: false, camOff: false },
  { name: "Rohit Gupta", muted: true, camOff: true },
  { name: "Anjali Singh", muted: false, camOff: false },
];

/** Format seconds as mm:ss */
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ---------------------------------------------------------------------------
// Floating emoji reaction — live-stream style
// ALL random values are pre-computed at spawn time so they never change
// on subsequent re-renders (audio-level state fires ~60 fps).
// ---------------------------------------------------------------------------
interface FloatingEmoji {
  id: number;
  emoji: string;
  /** fixed left position, % of screen width (right-side cluster) */
  x: number;
  /** animation delay in seconds — staggers so emojis fire one-by-one */
  delay: number;
  /** small horizontal drift so emojis fan out slightly */
  drift: number;
}

let emojiIdCounter = 0;

// ---------------------------------------------------------------------------
// EmojiOverlay — isolated in React.memo so audio-level re-renders
// in the parent never touch this subtree.
// ---------------------------------------------------------------------------
const EmojiOverlay = memo(function EmojiOverlay({
  emojis,
}: {
  emojis: FloatingEmoji[];
}) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {emojis.map((e) => (
        /*
         * Two-level DOM trick:
         *  • outer div  → handles fixed X position + horizontal drift (static transform, never changes)
         *  • inner span → runs the emojiFloat animation (translateY only)
         * This keeps the two transforms on separate elements so they don't conflict.
         */
        <div
          key={e.id}
          style={{
            position: "absolute",
            left: `${e.x}%`,
            bottom: "80px",            /* always start just above the controls bar */
            transform: `translateX(${e.drift}px)`,
          }}
        >
          <span
            className="emoji-float text-4xl block"
            style={{ animationDelay: `${e.delay}s` }}
          >
            {e.emoji}
          </span>
        </div>
      ))}
    </div>
  );
});

/**
 * MeetingRoomPage — /meeting/[meetingId]
 *
 * Camera/mic: uses useMediaStream() hook to acquire real getUserMedia streams.
 *   - Mute button: sets audioTrack.enabled = false (actual track-level mute)
 *   - Camera off: sets videoTrack.enabled = false + swaps tile to initials avatar
 *   - Permission denied / no camera: shows initials tile with a fallback badge
 *
 * Audio level meter: real AnalyserNode measures live mic level → animated bars.
 *
 * Remote participants: rendered as labeled initials tiles (no WebRTC signaling —
 * see README > Assumptions for rationale).
 *
 * Host controls: Mute All and Remove Participant operate on local simulation state.
 */
export default function MeetingRoomPage() {
  const router = useRouter();
  const params = useParams();
  const meetingCode = params.meetingId as string;
  const { user } = useUser();

  // Stabilise displayName in a ref so the join useEffect doesn't re-fire
  // every render (user?.name ?? "You" would recreate the string each time).
  const displayNameRef = useRef<string>(user?.name ?? "You");
  const displayName = displayNameRef.current;

  // ---- Server-fetched state ----
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [dbParticipants, setDbParticipants] = useState<Participant[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [removedIds, setRemovedIds] = useState<Set<number>>(new Set());
  // Pre-seed with sim participants who start muted so mutedByHost is the
  // single source of truth — video tiles read ONLY from this set.
  const [mutedByHost, setMutedByHost] = useState<Set<number>>(
    () => new Set(SIM_PARTICIPANTS.flatMap((p, i) => (p.muted ? [1000 + i] : [])))
  );
  const [isHostUser, setIsHostUser] = useState(false);
  const hasJoinedRef = useRef(false); // prevent double-join on StrictMode

  // ---- Real media ----
  const { stream, videoTrack, audioTrack, permissionDenied, noCameraAvailable } =
    useMediaStream();

  // ---- UI state ----
  const [lobbyDone, setLobbyDone] = useState(false); // false = show pre-join lobby
  const [isMuted, setIsMuted]     = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isParticipantListOpen, setIsParticipantListOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [copied, setCopied] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  // ---- Floating emoji reactions ----
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);

  // ---- Live mic level ----
  const audioLevel = useAudioLevel(audioTrack, !isMuted);

  // ---- Load meeting + join ONCE on mount ----
  useEffect(() => {
    if (hasJoinedRef.current) return;
    hasJoinedRef.current = true;

    async function init() {
      try {
        const m = await getMeeting(meetingCode);
        setMeeting(m);

        try {
          const joined = await joinMeeting(meetingCode, {
            display_name: displayName,
          });
          if (joined?.is_host) setIsHostUser(true);
        } catch {
          // Page refresh: already joined — fetch existing
        }

        const ps = await getParticipants(meetingCode);
        setDbParticipants(ps);

        const myRecord = ps.find((p) => p.display_name === displayName);
        if (myRecord?.is_host) setIsHostUser(true);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Meeting not found");
      }
    }
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingCode]); // intentionally omit displayName — stabilised via ref

  // ---- Call timer ----
  useEffect(() => {
    const interval = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // ---- Track-level mute (real mic) ----
  function handleToggleMute() {
    if (audioTrack) {
      audioTrack.enabled = isMuted; // if currently muted, re-enable
    }
    setIsMuted((v) => !v);
  }

  // ---- Track-level camera toggle (real camera) ----
  function handleToggleCamera() {
    if (videoTrack) {
      videoTrack.enabled = isCameraOff; // if currently off, re-enable
    }
    setIsCameraOff((v) => !v);
  }

  // ---- Host controls ----
  function handleMuteAll() {
    const nonHostIds = new Set<number>(
      dbParticipants
        .filter((p) => !p.is_host)
        .map((p) => p.id)
    );
    SIM_PARTICIPANTS.forEach((_, i) => nonHostIds.add(1000 + i));
    setMutedByHost(nonHostIds);
  }

  function handleMuteParticipant(id: number) {
    setMutedByHost((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleRemoveParticipant(id: number) {
    setRemovedIds((prev) => new Set(Array.from(prev).concat(id)));
  }

  async function handleToggleShare() {
    if (screenStream) {
      screenStream.getTracks().forEach((t) => t.stop());
      setScreenStream(null);
    } else {
      try {
        const s = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        s.getVideoTracks()[0].onended = () => setScreenStream(null);
        setScreenStream(s);
      } catch (err) {
        console.error("Screen share failed", err);
      }
    }
  }

  const handleLeave = useCallback(async () => {
    stream?.getTracks().forEach((t) => t.stop());
    screenStream?.getTracks().forEach((t) => t.stop());
    // Mark meeting as ended so it shows in recents with correct status
    try {
      await endMeeting(meetingCode);
    } catch {
      // Best-effort — don't block navigation
    }
    // Use hard navigation so the dashboard's useEffect always re-runs
    // and picks up the newly ended meeting in the recents list.
    window.location.href = "/";
  }, [stream, screenStream, meetingCode]);

  async function handleCopyLink() {
    if (!meeting) return;
    await navigator.clipboard.writeText(meeting.invite_link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ---- Emoji reaction ----
  function handleReaction(emoji: string) {
    // Spawn 6-8 emojis. ALL random values frozen here — never recalculated on re-render.
    const count = Math.floor(Math.random() * 3) + 6;
    const newEmojis: FloatingEmoji[] = Array.from({ length: count }, (_, i) => ({
      id: ++emojiIdCounter,
      emoji,
      // Right side of screen, slight random spread (82% – 90%)
      x: 82 + Math.random() * 8,
      // Stagger launch so they fire sequentially, not all at once
      delay: i * 0.15,
      // Small random drift left/right so they fan out naturally
      drift: (Math.random() - 0.5) * 40,
    }));
    setFloatingEmojis((prev) => [...prev, ...newEmojis]);

    // Remove after animation finishes (3s anim + max delay ~1.05s + 0.5s buffer)
    setTimeout(() => {
      const ids = new Set(newEmojis.map((e) => e.id));
      setFloatingEmojis((prev) => prev.filter((e) => !ids.has(e.id)));
    }, 4600);
  }

  // ---- Lobby → Meeting transition ----
  function handleJoin(startMuted: boolean, startCameraOff: boolean) {
    // Apply track-level state from lobby choices
    if (audioTrack) audioTrack.enabled = !startMuted;
    if (videoTrack) videoTrack.enabled = !startCameraOff;
    setIsMuted(startMuted);
    setIsCameraOff(startCameraOff);
    setLobbyDone(true);
  }

  // ---- Pre-join lobby ----
  if (!lobbyDone) {
    return (
      <JoinLobby
        meetingTitle={meeting?.title ?? ""}
        meetingCode={meetingCode}
        userName={displayName}
        stream={stream}
        audioTrack={audioTrack}
        videoTrack={videoTrack}
        permissionDenied={permissionDenied}
        noCameraAvailable={noCameraAvailable}
        onJoin={handleJoin}
        onCancel={() => router.push("/")}
      />
    );
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
            id="meeting-error-home-btn"
            onClick={() => router.push("/")}
            className="btn-primary mt-2"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // ---- Build participant list for the side panel ----
  const activeDbParticipants = dbParticipants.filter((p) => !removedIds.has(p.id));
  const activeSimParticipants = SIM_PARTICIPANTS
    .map((p, i) => ({
      id: 1000 + i,
      meeting_id: 0,
      display_name: p.name,
      joined_at: new Date().toISOString(),
      left_at: null,
      is_host: false,
      origMuted: p.muted,
      origCamOff: p.camOff,
    }))
    .filter((p) => !removedIds.has(p.id));

  const panelParticipants: Participant[] = activeDbParticipants.length > 0
    ? [...activeDbParticipants, ...activeSimParticipants]
    : [
        {
          id: 0,
          meeting_id: 0,
          display_name: `${displayName} (You)`,
          joined_at: new Date().toISOString(),
          left_at: null,
          is_host: true,
        },
        ...activeSimParticipants,
      ];

  // ---- Video grid layout ----
  const totalTiles = 1 + activeSimParticipants.length;
  const gridCols =
    totalTiles <= 1
      ? "grid-cols-1"
      : totalTiles <= 2
      ? "grid-cols-2"
      : totalTiles <= 4
      ? "grid-cols-2"
      : "grid-cols-3 lg:grid-cols-3";

  return (
    <div className="h-screen bg-zoom-dark flex flex-col overflow-hidden relative">
      {/* ---- Floating emoji reactions (live-stream style) ---- */}
      <EmojiOverlay emojis={floatingEmojis} />

      {/* ---- Top bar ---- */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3
                      bg-zoom-dark border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse-slow" />
            <span className="text-xs text-green-400 font-medium hidden sm:block">
              Live
            </span>
          </div>
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

          {/* Mic level indicator (VU bars) — always visible in top bar */}
          <div
            className="hidden sm:flex items-end gap-[2px] h-4"
            title={isMuted ? "Muted" : `Mic level: ${Math.round(audioLevel)}%`}
          >
            {[0.3, 0.55, 0.8, 0.6, 0.35].map((factor, i) => {
              const barHeight = isMuted
                ? 3
                : Math.max(3, (audioLevel / 100) * 16 * factor);
              return (
                <div
                  key={i}
                  className="w-[3px] rounded-full transition-all duration-75"
                  style={{
                    height: `${barHeight}px`,
                    backgroundColor: isMuted
                      ? "#6b7280"
                      : audioLevel > 60
                      ? "#22c55e"
                      : audioLevel > 20
                      ? "#86efac"
                      : "#4b5563",
                  }}
                />
              );
            })}
          </div>

          {/* Meeting code */}
          <div className="hidden sm:flex items-center gap-1.5 bg-white/5 rounded-lg px-3 py-1.5">
            <span className="text-xs text-gray-400 font-mono">
              {meetingCode}
            </span>
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

          <Wifi className="w-4 h-4 text-green-400 hidden sm:block" />
        </div>
      </div>

      {/* ---- Main content (grid + optional side panel) ---- */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main View */}
        <div className="flex-1 p-3 sm:p-4 overflow-hidden flex flex-col sm:flex-row gap-3">
          {screenStream ? (
            <>
              {/* Screen share large view */}
              <div className="flex-1 bg-black rounded-2xl overflow-hidden relative">
                <VideoTile
                  name={`${displayName}'s Screen`}
                  isActive={true}
                  stream={screenStream}
                  isMirrored={false}
                />
              </div>

              {/* Small thumbnails side/bottom rail */}
              <div className="w-full sm:w-48 flex sm:flex-col gap-2 overflow-x-auto sm:overflow-y-auto shrink-0">
                <div className="w-32 sm:w-full shrink-0">
                  <VideoTile
                    name={`${displayName} (You)`}
                    isMuted={isMuted}
                    isCameraOff={isCameraOff}
                    stream={stream}
                    cameraBlocked={permissionDenied || noCameraAvailable}
                    audioLevel={audioLevel}
                  />
                </div>
                {activeSimParticipants.map((p) => (
                  <div key={p.id} className="w-32 sm:w-full shrink-0">
                    <VideoTile
                      name={p.display_name}
                      isMuted={mutedByHost.has(p.id)}
                      isCameraOff={p.origCamOff}
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* Regular Grid */
            <div className={`w-full grid ${gridCols} gap-2 sm:gap-3 h-full auto-rows-fr`}>
              {/* Self tile — real camera or fallback */}
              <VideoTile
                name={`${displayName} (You)`}
                isMuted={isMuted}
                isCameraOff={isCameraOff}
                isActive={true}
                stream={stream}
                cameraBlocked={permissionDenied || noCameraAvailable}
                audioLevel={audioLevel}
              />

              {/* Simulated remote participant tiles */}
              {activeSimParticipants.map((p) => (
                <VideoTile
                  key={p.id}
                  name={p.display_name}
                  isMuted={mutedByHost.has(p.id)}
                  isCameraOff={p.origCamOff}
                />
              ))}
            </div>
          )}
        </div>

        {/* Side Panels */}
        {isParticipantListOpen && (
          <ParticipantList
            participants={panelParticipants}
            isHost={isHostUser}
            mutedByHost={mutedByHost}
            onMuteParticipant={handleMuteParticipant}
            onRemoveParticipant={handleRemoveParticipant}
            onMuteAll={handleMuteAll}
            onClose={() => setIsParticipantListOpen(false)}
          />
        )}

        {isChatOpen && (
          <ChatPanel onClose={() => setIsChatOpen(false)} />
        )}
      </div>

      {/* ---- Controls bar ---- */}
      <Controls
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        isParticipantListOpen={isParticipantListOpen}
        isChatOpen={isChatOpen}
        isHost={isHostUser}
        isSharing={!!screenStream}
        audioLevel={audioLevel}
        onToggleMute={handleToggleMute}
        onToggleCamera={handleToggleCamera}
        onToggleParticipants={() => {
          setIsParticipantListOpen((v) => !v);
          setIsChatOpen(false);
        }}
        onToggleShare={handleToggleShare}
        onToggleChat={() => {
          setIsChatOpen((v) => !v);
          setIsParticipantListOpen(false);
        }}
        onMuteAll={handleMuteAll}
        onLeave={handleLeave}
        onReaction={handleReaction}
      />
    </div>
  );
}
