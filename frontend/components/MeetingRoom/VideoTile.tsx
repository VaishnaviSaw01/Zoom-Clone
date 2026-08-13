"use client";

import { MicOff, VideoOff } from "lucide-react";

interface VideoTileProps {
  name: string;
  /** Hex color for the avatar background */
  color?: string;
  isMuted?: boolean;
  isCameraOff?: boolean;
  /** If true this tile gets a highlight ring (pinned/speaking) */
  isActive?: boolean;
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
 * VideoTile — a placeholder video tile for the meeting room grid.
 * When the camera is "on", shows a dark background with initials.
 * When "off", shows a gray background with a VideoOff icon.
 *
 * No real WebRTC — this is a convincing UI-state simulation.
 */
export default function VideoTile({
  name,
  color,
  isMuted = false,
  isCameraOff = false,
  isActive = false,
}: VideoTileProps) {
  const bg = color ?? colorFromName(name);

  return (
    <div
      className={`relative flex items-center justify-center rounded-2xl overflow-hidden
                  aspect-video transition-all duration-200
                  ${
                    isCameraOff
                      ? "bg-zoom-dark-2"
                      : "bg-zoom-dark"
                  }
                  ${isActive ? "ring-2 ring-zoom-blue ring-offset-2 ring-offset-zoom-dark" : ""}
                  `}
    >
      {/* Avatar / initials */}
      {isCameraOff ? (
        <div className="flex flex-col items-center gap-2">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white
                       text-xl font-bold shadow-lg"
            style={{ backgroundColor: bg }}
          >
            {initials(name)}
          </div>
          <span className="text-xs text-gray-400">{name}</span>
        </div>
      ) : (
        /* "Camera on" — show initials on a dark gradient (simulated feed) */
        <div
          className="w-full h-full flex items-center justify-center"
          style={{
            background: `radial-gradient(ellipse at 60% 30%, ${bg}33 0%, #1C1C1E 70%)`,
          }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white
                       text-2xl font-bold shadow-xl"
            style={{ backgroundColor: bg }}
          >
            {initials(name)}
          </div>
        </div>
      )}

      {/* Name label */}
      <div className="absolute bottom-2 left-3 flex items-center gap-1.5">
        <span className="bg-black/50 text-white text-xs px-2 py-0.5 rounded-md font-medium backdrop-blur-sm">
          {name}
        </span>
        {isMuted && (
          <span className="bg-red-600/80 rounded-md p-0.5">
            <MicOff className="w-2.5 h-2.5 text-white" />
          </span>
        )}
      </div>

      {/* Camera off overlay icon */}
      {isCameraOff && (
        <div className="absolute top-2 right-2 text-gray-500">
          <VideoOff className="w-3.5 h-3.5" />
        </div>
      )}
    </div>
  );
}
