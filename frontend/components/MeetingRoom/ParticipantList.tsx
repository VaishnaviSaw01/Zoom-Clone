"use client";

import { X, Crown, MicOff } from "lucide-react";
import type { Participant } from "@/lib/types";
import { colorFromName } from "./VideoTile";

interface ParticipantListProps {
  participants: Participant[];
  onClose: () => void;
}

/**
 * ParticipantList — slide-in side panel listing all participants in the meeting.
 * Shows host crown, mute indicator (simulated — we mark host as unmuted).
 */
export default function ParticipantList({
  participants,
  onClose,
}: ParticipantListProps) {
  return (
    <aside className="w-72 bg-zoom-dark-2 border-l border-white/5 flex flex-col animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <h2 className="text-sm font-semibold text-white">
          Participants ({participants.length})
        </h2>
        <button
          id="close-participant-list"
          onClick={onClose}
          className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10
                     transition-colors duration-150"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-2">
        {participants.length === 0 ? (
          <p className="text-xs text-gray-500 text-center mt-8">
            No participants yet
          </p>
        ) : (
          participants.map((p) => {
            const bg = colorFromName(p.display_name);
            const initials = p.display_name
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <div
                key={p.id}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5
                           transition-colors duration-100"
              >
                {/* Avatar */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center
                             text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: bg }}
                >
                  {initials}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{p.display_name}</p>
                  {p.is_host && (
                    <p className="text-xs text-yellow-400 flex items-center gap-1">
                      <Crown className="w-3 h-3" /> Host
                    </p>
                  )}
                </div>

                {/* Simulated mute state — non-host participants are "muted" */}
                {!p.is_host && (
                  <MicOff className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
