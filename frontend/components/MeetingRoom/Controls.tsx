"use client";

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
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleParticipants: () => void;
  onLeave: () => void;
}

interface CtrlBtnProps {
  id: string;
  onClick: () => void;
  active?: boolean;
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
  className?: string;
}

function CtrlBtn({ id, onClick, active, label, icon, danger, className = "" }: CtrlBtnProps) {
  return (
    <button
      id={id}
      onClick={onClick}
      title={label}
      className={`
        flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl
        transition-colors duration-150 cursor-pointer select-none
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

/**
 * Controls — the bottom bar of the meeting room.
 * All state (muted, camera off, etc.) is managed by the parent; this component
 * is purely presentational + event-emitting.
 */
export default function Controls({
  isMuted,
  isCameraOff,
  isParticipantListOpen,
  onToggleMute,
  onToggleCamera,
  onToggleParticipants,
  onLeave,
}: ControlsProps) {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 py-4 px-4
                    bg-zoom-dark border-t border-white/5">
      {/* Mute */}
      <CtrlBtn
        id="ctrl-mute"
        onClick={onToggleMute}
        active={isMuted}
        label={isMuted ? "Unmute" : "Mute"}
        icon={
          isMuted ? (
            <MicOff className="w-5 h-5 text-red-400" />
          ) : (
            <Mic className="w-5 h-5" />
          )
        }
      />

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

      {/* Share screen (decorative) */}
      <CtrlBtn
        id="ctrl-share"
        onClick={() => {}}
        label="Share Screen"
        icon={<MonitorUp className="w-5 h-5" />}
      />

      {/* Chat (decorative) */}
      <CtrlBtn
        id="ctrl-chat"
        onClick={() => {}}
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

      {/* More (decorative) */}
      <CtrlBtn
        id="ctrl-more"
        onClick={() => {}}
        label="More"
        icon={<MoreHorizontal className="w-5 h-5" />}
      />

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
