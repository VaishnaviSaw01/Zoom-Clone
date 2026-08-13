"use client";

import { useState } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Users,
  PhoneOff,
  MoreHorizontal,
  MonitorUp,
  MessageSquare,
} from "lucide-react";

interface ControlsProps {
  isMuted: boolean;
  isCameraOff: boolean;
  isParticipantListOpen: boolean;
  isChatOpen: boolean;
  isHost: boolean;
  isSharing: boolean;
  /** Live mic level 0-100 from AnalyserNode */
  audioLevel: number;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleParticipants: () => void;
  onToggleShare: () => void;
  onToggleChat: () => void;
  onMuteAll: () => void;
  onLeave: () => void;
  /** Called when the user picks an emoji reaction */
  onReaction: (emoji: string) => void;
}

interface CtrlBtnProps {
  id: string;
  onClick: () => void;
  active?: boolean;
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
  className?: string;
  disabled?: boolean;
}

function CtrlBtn({
  id,
  onClick,
  active,
  label,
  icon,
  danger,
  className = "",
  disabled = false,
}: CtrlBtnProps) {
  return (
    <button
      id={id}
      onClick={onClick}
      title={label}
      disabled={disabled}
      className={`
        flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl
        transition-colors duration-150 cursor-pointer select-none
        disabled:opacity-40 disabled:cursor-not-allowed
        ${
          danger
            ? "bg-red-600 hover:bg-red-700 text-white"
            : active
            ? "bg-white/20 text-white"
            : "text-white hover:bg-white/10"
        }
        ${className}
      `}
    >
      {icon}
      <span className="text-[10px] font-medium hidden sm:block">{label}</span>
    </button>
  );
}

const REACTIONS = ["👍", "❤️", "😂", "👏", "🎉", "🔥", "😮", "🙌"];

/**
 * Controls — the bottom bar of the meeting room.
 * Mute and camera buttons operate on real MediaStreamTrack.enabled in the parent.
 * Mute All is only shown when isHost=true.
 * Audio level bars animate live based on the AnalyserNode output.
 */
export default function Controls({
  isMuted,
  isCameraOff,
  isParticipantListOpen,
  isChatOpen,
  isHost,
  isSharing,
  audioLevel,
  onToggleMute,
  onToggleCamera,
  onToggleParticipants,
  onToggleShare,
  onToggleChat,
  onMuteAll,
  onLeave,
  onReaction,
}: ControlsProps) {
  const [showReactions, setShowReactions] = useState(false);

  function handleReaction(emoji: string) {
    onReaction(emoji);
    setShowReactions(false);
  }

  // Derive bar heights from live audioLevel (0-100)
  const barFactors = [0.4, 0.7, 1.0, 0.7, 0.4];

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 py-4 px-4
                    bg-zoom-dark border-t border-white/5">
      {/* Mute — with live VU bars inside the button */}
      <div className="relative">
        <CtrlBtn
          id="ctrl-mute"
          onClick={onToggleMute}
          active={isMuted}
          label={isMuted ? "Unmute" : "Mute"}
          icon={
            isMuted ? (
              <MicOff className="w-5 h-5 text-red-400" />
            ) : (
              <div className="relative w-5 h-5 flex items-center justify-center">
                <Mic className="w-5 h-5" />
                {/* Live audio level bars overlaid at bottom of icon */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-end gap-[1.5px]">
                  {barFactors.map((factor, i) => {
                    const h = Math.max(2, (audioLevel / 100) * 10 * factor);
                    return (
                      <div
                        key={i}
                        className="w-[2px] rounded-full transition-all duration-75"
                        style={{
                          height: `${h}px`,
                          backgroundColor:
                            audioLevel > 60
                              ? "#22c55e"
                              : audioLevel > 20
                              ? "#86efac"
                              : "#6b7280",
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )
          }
        />
      </div>

      {/* Camera */}
      <CtrlBtn
        id="ctrl-camera"
        onClick={onToggleCamera}
        active={isCameraOff}
        label={isCameraOff ? "Start Video" : "Stop Video"}
        icon={
          isCameraOff ? (
            <VideoOff className="w-5 h-5 text-red-400" />
          ) : (
            <Video className="w-5 h-5" />
          )
        }
      />

      {/* Share screen */}
      <CtrlBtn
        id="ctrl-share"
        onClick={onToggleShare}
        active={isSharing}
        label={isSharing ? "Stop Sharing" : "Share Screen"}
        icon={<MonitorUp className="w-5 h-5" />}
      />

      {/* Chat */}
      <CtrlBtn
        id="ctrl-chat"
        onClick={onToggleChat}
        active={isChatOpen}
        label="Chat"
        icon={<MessageSquare className="w-5 h-5" />}
      />

      {/* Participants */}
      <CtrlBtn
        id="ctrl-participants"
        onClick={onToggleParticipants}
        active={isParticipantListOpen}
        label="Participants"
        icon={<Users className="w-5 h-5" />}
      />

      {/* Mute All — host only */}
      {isHost && (
        <CtrlBtn
          id="ctrl-mute-all"
          onClick={onMuteAll}
          label="Mute All"
          icon={<MicOff className="w-5 h-5" />}
        />
      )}

      {/* Reactions */}
      <div className="relative">
        <CtrlBtn
          id="ctrl-more"
          onClick={() => setShowReactions((v) => !v)}
          label="React"
          icon={<MoreHorizontal className="w-5 h-5" />}
          active={showReactions}
        />
        {showReactions && (
          <div
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2
                        bg-zinc-800 rounded-2xl shadow-xl border border-zinc-700
                        flex flex-wrap gap-1.5 animate-fade-in z-50 w-48"
          >
            {REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="w-10 h-10 flex items-center justify-center text-2xl
                           hover:bg-zinc-700 active:scale-90 rounded-xl
                           transition-all duration-100"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Leave — danger */}
      <CtrlBtn
        id="ctrl-leave"
        onClick={onLeave}
        label="Leave"
        danger
        icon={<PhoneOff className="w-5 h-5" />}
        className="ml-4"
      />
    </div>
  );
}
