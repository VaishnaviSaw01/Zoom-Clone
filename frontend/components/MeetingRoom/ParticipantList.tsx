"use client";

import { X, Crown, MicOff, Mic, UserX } from "lucide-react";
import type { Participant } from "@/lib/types";
import { colorFromName } from "./VideoTile";

interface ParticipantListProps {
  participants: Participant[];
  isHost: boolean;
  /** Simulated muted-by-host set (local state, no signaling) */
  mutedByHost: Set<number>;
  onMuteParticipant: (participantId: number) => void;
  onRemoveParticipant: (participantId: number) => void;
  onMuteAll: () => void;
  onClose: () => void;
}

/**
 * ParticipantList — slide-in side panel listing all participants.
 *
 * For host: shows per-participant Mute and Remove buttons, plus a Mute All button.
 * These actions update local simulation state (no real WebRTC signaling).
 */
export default function ParticipantList({
  participants,
  isHost,
  mutedByHost,
  onMuteParticipant,
  onRemoveParticipant,
  onMuteAll,
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

      {/* Mute All (host only) */}
      {isHost && (
        <div className="px-4 py-2.5 border-b border-white/5">
          <button
            id="mute-all-btn"
            onClick={onMuteAll}
            className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg
                       bg-white/10 hover:bg-white/20 text-white text-xs font-medium
                       transition-colors duration-150"
          >
            <MicOff className="w-3.5 h-3.5" />
            Mute All
          </button>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto py-2">
        {participants.length === 0 ? (
          <p className="text-xs text-gray-500 text-center mt-8">
            No participants yet
          </p>
        ) : (
          participants.map((p) => {
            const bg = colorFromName(p.display_name);
            const inits = p.display_name
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            const isMutedByHost = mutedByHost.has(p.id);

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
                  {inits}
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

                {/* Status + host controls */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Mute indicator — show for everyone */}
                  <span className="text-gray-500">
                    {isMutedByHost ? (
                      <MicOff className="w-3.5 h-3.5 text-red-400" />
                    ) : (
                      <Mic className="w-3.5 h-3.5 text-gray-500" />
                    )}
                  </span>

                  {/* Host-only controls — don't show for the host themselves */}
                  {isHost && !p.is_host && (
                    <>
                      <button
                        id={`mute-participant-${p.id}`}
                        onClick={() => onMuteParticipant(p.id)}
                        title={isMutedByHost ? "Unmute" : "Mute"}
                        className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10
                                   transition-colors text-[10px] font-medium"
                      >
                        {isMutedByHost ? "Unmute" : "Mute"}
                      </button>
                      <button
                        id={`remove-participant-${p.id}`}
                        onClick={() => onRemoveParticipant(p.id)}
                        title="Remove from meeting"
                        className="p-1 rounded text-gray-400 hover:text-red-400 hover:bg-white/10
                                   transition-colors"
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
