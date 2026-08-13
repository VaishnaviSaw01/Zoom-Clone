"use client";

import { useEffect, useRef } from "react";
import { MicOff, VideoOff, CameraOff } from "lucide-react";

interface VideoTileProps {
  name: string;
  /** Hex color for the avatar background */
  color?: string;
  isMuted?: boolean;
  isCameraOff?: boolean;
  /** If true this tile gets a highlight ring (pinned/speaking) */
  isActive?: boolean;
  /**
   * Live MediaStream for the self-tile.
   * When provided and camera is on, renders a real <video> element.
   * Undefined for remote participant tiles (which stay as initials avatars).
   */
  stream?: MediaStream | null;
  /** If true, shows a "Camera blocked" badge on the tile */
  cameraBlocked?: boolean;
  /** Whether to mirror the video horizontally (default true, false for screen share) */
  isMirrored?: boolean;
  /**
   * Live microphone level 0-100 (from AnalyserNode).
   * When provided, renders a VU bar indicator on the self-tile.
   */
  audioLevel?: number;
}

/** Derive initials from a display name (up to 2 chars). */
function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Deterministic color from name (so the same name always gets the same color). */
const COLORS = [
  "#0E71EB", "#7C3AED", "#059669", "#D97706",
  "#DC2626", "#0891B2", "#9333EA", "#16A34A",
];

export function colorFromName(name: string): string {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xff_ffff;
  return COLORS[Math.abs(hash) % COLORS.length];
}

/**
 * VideoTile — renders one participant in the meeting grid.
 *
 * Self tile: pass `stream` prop → shows real camera feed via <video>
 * Remote tiles: no stream → shows initials avatar (no WebRTC signaling in scope)
 * Audio level bars shown on self-tile when audioLevel prop is provided.
 */
export default function VideoTile({
  name,
  color,
  isMuted = false,
  isCameraOff = false,
  isActive = false,
  stream,
  cameraBlocked = false,
  isMirrored = true,
  audioLevel,
}: VideoTileProps) {
  const bg = color ?? colorFromName(name);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  const showLiveFeed = stream && !isCameraOff && !cameraBlocked;

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, showLiveFeed]);

  // VU bar config
  const barFactors = [0.5, 0.8, 1.0, 0.8, 0.5];
  const showAudioBars = audioLevel !== undefined && !isMuted;

  return (
    <div
      className={`relative flex items-center justify-center rounded-2xl overflow-hidden
                  aspect-video transition-all duration-200
                  ${isCameraOff || cameraBlocked ? "bg-zinc-800" : "bg-zoom-dark"}
                  ${isActive ? "ring-2 ring-zoom-blue ring-offset-2 ring-offset-zoom-dark" : ""}`}
    >
      {/* --- Live video feed (self-tile only) --- */}
      {showLiveFeed && (
        <video
          ref={videoRef}
          autoPlay
          muted       /* always muted — no self-echo */
          playsInline
          className={`w-full h-full object-cover ${isMirrored ? "scale-x-[-1]" : ""}`}
        />
      )}

      {/* --- Initials / avatar overlay when camera is off or no stream --- */}
      {!showLiveFeed && (
        <div className="flex flex-col items-center gap-2">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white
                       text-xl font-bold shadow-lg"
            style={{ backgroundColor: bg }}
          >
            {initials(name)}
          </div>
          <span className="text-xs text-gray-400">{name}</span>
          {cameraBlocked && (
            <span className="text-[10px] text-amber-400 flex items-center gap-1 mt-0.5">
              <CameraOff className="w-3 h-3" /> camera blocked
            </span>
          )}
        </div>
      )}

      {/* --- Name label + audio bars (always shown) --- */}
      <div className="absolute bottom-2 left-3 flex items-center gap-1.5">
        <span className="bg-black/50 text-white text-xs px-2 py-0.5 rounded-md font-medium backdrop-blur-sm">
          {name}
        </span>

        {/* Live VU bars (self-tile only, when unmuted) */}
        {showAudioBars ? (
          <div className="flex items-end gap-[1.5px] bg-black/40 px-1.5 py-1 rounded-md">
            {barFactors.map((factor, i) => {
              const h = Math.max(2, (audioLevel / 100) * 12 * factor);
              return (
                <div
                  key={i}
                  className="w-[2.5px] rounded-full transition-all duration-75"
                  style={{
                    height: `${h}px`,
                    backgroundColor:
                      audioLevel > 60
                        ? "#22c55e"
                        : audioLevel > 20
                        ? "#86efac"
                        : "#4ade80",
                  }}
                />
              );
            })}
          </div>
        ) : isMuted ? (
          <span className="bg-red-600/80 rounded-md p-0.5">
            <MicOff className="w-2.5 h-2.5 text-white" />
          </span>
        ) : null}
      </div>

      {/* --- Camera-off icon (top-right) --- */}
      {(isCameraOff || cameraBlocked) && (
        <div className="absolute top-2 right-2 text-gray-500">
          <VideoOff className="w-3.5 h-3.5" />
        </div>
      )}
    </div>
  );
}
