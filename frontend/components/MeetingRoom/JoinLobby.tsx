"use client";

import { useEffect, useRef, useState } from "react";
import {
  Mic, MicOff, Video, VideoOff, CameraOff,
  Users, Lock, ChevronRight, X,
} from "lucide-react";
import { colorFromName } from "./VideoTile";
import { useAudioLevel } from "@/hooks/useAudioLevel";

interface JoinLobbyProps {
  meetingTitle: string;
  meetingCode: string;
  userName: string;
  stream: MediaStream | null;
  audioTrack: MediaStreamTrack | null;
  videoTrack: MediaStreamTrack | null;
  permissionDenied: boolean;
  noCameraAvailable: boolean;
  onJoin: (startMuted: boolean, startCameraOff: boolean) => void;
  onCancel: () => void;
}

export default function JoinLobby({
  meetingTitle,
  meetingCode,
  userName,
  stream,
  audioTrack,
  videoTrack,
  permissionDenied,
  noCameraAvailable,
  onJoin,
  onCancel,
}: JoinLobbyProps) {
  const [camOff, setCamOff] = useState(false);
  const [micOff, setMicOff] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const audioLevel = useAudioLevel(audioTrack, !micOff);
  const avatarBg = colorFromName(userName);
  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  function toggleCam() {
    if (videoTrack) videoTrack.enabled = !camOff;
    setCamOff((v) => !v);
  }

  function toggleMic() {
    if (audioTrack) audioTrack.enabled = !micOff;
    setMicOff((v) => !v);
  }

  const showVideo = !!(stream && !camOff && !permissionDenied && !noCameraAvailable);
  const barFactors = [0.45, 0.7, 1.0, 0.7, 0.45];

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center p-4 z-50">
      <div
        className="w-full max-w-4xl bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden
                    flex flex-col lg:flex-row"
        style={{ border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* LEFT — camera preview */}
        <div
          className="flex-1 relative bg-zinc-950 flex items-center justify-center"
          style={{ minHeight: "300px" }}
        >
          {showVideo && (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
          )}

          {!showVideo && (
            <div className="flex flex-col items-center gap-3 z-10">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center
                           text-white text-3xl font-bold shadow-xl"
                style={{ backgroundColor: avatarBg }}
              >
                {initials}
              </div>
              <span className="text-sm text-gray-400">{userName}</span>
              {(permissionDenied || noCameraAvailable) && (
                <span className="text-xs text-amber-400 flex items-center gap-1">
                  <CameraOff className="w-3.5 h-3.5" /> Camera unavailable
                </span>
              )}
            </div>
          )}

          {/* Name badge */}
          <div
            className="absolute bottom-16 left-4 text-white text-sm font-medium
                        px-3 py-1 rounded-full"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          >
            {userName} (You)
          </div>

          {/* Mic + Camera toggles overlaid at bottom */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
            {/* Mic */}
            <button
              id="lobby-toggle-mic"
              onClick={toggleMic}
              title={micOff ? "Unmute" : "Mute"}
              className={`w-11 h-11 rounded-full flex items-center justify-center
                          shadow-lg transition-all duration-150
                          ${micOff ? "bg-red-600 hover:bg-red-700" : "bg-white/20 hover:bg-white/30"}`}
              style={{ backdropFilter: "blur(8px)" }}
            >
              {micOff ? (
                <MicOff className="w-5 h-5 text-white" />
              ) : (
                <div className="relative w-5 h-5 flex items-center justify-center">
                  <Mic className="w-5 h-5 text-white" />
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-end gap-[1.5px]">
                    {barFactors.map((f, i) => (
                      <div
                        key={i}
                        className="w-[2px] rounded-full transition-all duration-75"
                        style={{
                          height: `${Math.max(2, (audioLevel / 100) * 10 * f)}px`,
                          backgroundColor: audioLevel > 50 ? "#22c55e" : "#86efac",
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </button>

            {/* Camera */}
            <button
              id="lobby-toggle-cam"
              onClick={toggleCam}
              title={camOff ? "Start Video" : "Stop Video"}
              disabled={permissionDenied || noCameraAvailable}
              className={`w-11 h-11 rounded-full flex items-center justify-center
                          shadow-lg transition-all duration-150
                          disabled:opacity-40 disabled:cursor-not-allowed
                          ${camOff ? "bg-red-600 hover:bg-red-700" : "bg-white/20 hover:bg-white/30"}`}
              style={{ backdropFilter: "blur(8px)" }}
            >
              {camOff ? (
                <VideoOff className="w-5 h-5 text-white" />
              ) : (
                <Video className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>

        {/* RIGHT — meeting info + join */}
        <div className="lg:w-80 flex flex-col justify-between p-6 gap-5 flex-shrink-0">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Ready to join?
              </p>
              <h1 className="text-xl font-bold text-white leading-snug">
                {meetingTitle || "Meeting"}
              </h1>
              <p className="text-xs text-gray-500 font-mono mt-1">{meetingCode}</p>
            </div>
            <button
              id="lobby-cancel-btn"
              onClick={onCancel}
              className="p-1.5 rounded-lg text-gray-500 hover:text-white
                         hover:bg-white/10 transition-colors flex-shrink-0 mt-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Status rows */}
          <div className="space-y-2.5">
            {/* Mic */}
            <div
              className="flex items-center justify-between rounded-xl px-4 py-3"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              <div className="flex items-center gap-3">
                {micOff
                  ? <MicOff className="w-4 h-4 text-red-400" />
                  : <Mic    className="w-4 h-4 text-green-400" />}
                <span className="text-sm text-gray-300">Microphone</span>
              </div>
              <div className="flex items-center gap-2">
                {!micOff && (
                  <div className="flex items-end gap-[2px] h-4">
                    {barFactors.map((f, i) => (
                      <div
                        key={i}
                        className="w-[2.5px] rounded-full transition-all duration-75"
                        style={{
                          height: `${Math.max(3, (audioLevel / 100) * 16 * f)}px`,
                          backgroundColor: audioLevel > 50 ? "#22c55e" : "#4ade80",
                        }}
                      />
                    ))}
                  </div>
                )}
                <span className={`text-xs font-medium ${micOff ? "text-red-400" : "text-green-400"}`}>
                  {micOff ? "Off" : "On"}
                </span>
              </div>
            </div>

            {/* Camera */}
            <div
              className="flex items-center justify-between rounded-xl px-4 py-3"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              <div className="flex items-center gap-3">
                {camOff || permissionDenied || noCameraAvailable
                  ? <VideoOff className="w-4 h-4 text-red-400" />
                  : <Video    className="w-4 h-4 text-green-400" />}
                <span className="text-sm text-gray-300">Camera</span>
              </div>
              <span className={`text-xs font-medium ${
                camOff || permissionDenied || noCameraAvailable
                  ? "text-red-400"
                  : "text-green-400"
              }`}>
                {permissionDenied || noCameraAvailable ? "Blocked" : camOff ? "Off" : "On"}
              </span>
            </div>

            {/* Participants note */}
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-400">Others may already be in the call</span>
            </div>

            <div className="flex items-center gap-2.5 px-4 py-1">
              <Lock className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
              <span className="text-xs text-gray-600">End-to-end encrypted</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              id="lobby-join-btn"
              onClick={() => onJoin(micOff, camOff)}
              className="w-full flex items-center justify-center gap-2
                         bg-zoom-blue hover:bg-zoom-blue-dark active:scale-95
                         text-white font-semibold py-3 rounded-xl
                         transition-all duration-150 text-sm"
              style={{ boxShadow: "0 4px 24px rgba(14,113,235,0.35)" }}
            >
              Join Now
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              id="lobby-join-silent-btn"
              onClick={() => onJoin(true, true)}
              className="w-full text-sm text-gray-500 hover:text-gray-300
                         py-1.5 transition-colors duration-150"
            >
              Join without camera &amp; mic
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
