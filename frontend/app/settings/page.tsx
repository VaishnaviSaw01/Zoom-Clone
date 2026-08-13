"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Sun,
  Moon,
  Monitor,
  User,
  Mic,
  Video,
  Copy,
  Check,
  Loader2,
  Save,
  Play,
  AlertCircle,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import { useUser, getInitials } from "@/lib/user-context";
import { updateMe, startPmiMeeting } from "@/lib/api";
import type { Theme } from "@/lib/user-context";

type Tab = "general" | "profile" | "pmi" | "audio" | "video";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "general", label: "General", icon: <Monitor className="w-4 h-4" /> },
  { id: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
  { id: "pmi", label: "Personal Meeting ID", icon: <Copy className="w-4 h-4" /> },
  { id: "audio", label: "Audio", icon: <Mic className="w-4 h-4" /> },
  { id: "video", label: "Video", icon: <Video className="w-4 h-4" /> },
];

const AVATAR_COLORS = [
  "#0E71EB",
  "#7C3AED",
  "#059669",
  "#D97706",
  "#DC2626",
  "#0891B2",
  "#9333EA",
  "#DB2777",
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function GeneralTab() {
  const { theme, setTheme } = useUser();

  const options: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: "light", label: "Light", icon: <Sun className="w-5 h-5" /> },
    { value: "dark", label: "Dark", icon: <Moon className="w-5 h-5" /> },
    { value: "system", label: "System", icon: <Monitor className="w-5 h-5" /> },
  ];

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-zoom-dark dark:text-gray-100 mb-1">
          Appearance
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Choose how ZoomClone looks for you.
        </p>
        <div className="flex gap-3 flex-wrap">
          {options.map((opt) => (
            <button
              key={opt.value}
              id={`theme-${opt.value}-btn`}
              onClick={() => setTheme(opt.value)}
              className={`flex flex-col items-center gap-2 px-6 py-4 rounded-xl border-2
                          transition-all duration-150 cursor-pointer
                          ${
                            theme === opt.value
                              ? "border-zoom-blue bg-zoom-blue-light dark:bg-zoom-blue/10 text-zoom-blue"
                              : "border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-zinc-600"
                          }`}
            >
              {opt.icon}
              <span className="text-sm font-medium">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProfileTab() {
  const { user, setUser } = useUser();
  const [name, setName] = useState(user?.name ?? "");
  const [selectedColor, setSelectedColor] = useState(
    user?.avatar_color ?? "#0E71EB"
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setSelectedColor(user.avatar_color);
    }
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Display name cannot be empty.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const updated = await updateMe({
        name: name.trim(),
        avatar_color: selectedColor,
      });
      setUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const initials = getInitials(name || user?.name || "V");

  return (
    <section className="space-y-6 max-w-sm">
      <h2 className="text-base font-semibold text-zoom-dark dark:text-gray-100">
        Profile
      </h2>

      {/* Avatar preview */}
      <div className="flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center
                     text-white text-2xl font-bold shadow-md"
          style={{ backgroundColor: selectedColor }}
        >
          {initials}
        </div>
        <div>
          <p className="text-sm font-medium text-zoom-dark dark:text-gray-100">
            {name || "Your Name"}
          </p>
          <p className="text-xs text-gray-400">{user?.email}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2.5">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Display name */}
        <div>
          <label
            htmlFor="profile-name"
            className="block text-sm font-medium text-zoom-dark dark:text-gray-300 mb-1.5"
          >
            Display Name
          </label>
          <input
            id="profile-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
            placeholder="Your display name"
          />
        </div>

        {/* Avatar color picker */}
        <div>
          <label className="block text-sm font-medium text-zoom-dark dark:text-gray-300 mb-2">
            Avatar Color
          </label>
          <div className="flex gap-2 flex-wrap">
            {AVATAR_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                id={`avatar-color-${color.replace("#", "")}`}
                onClick={() => setSelectedColor(color)}
                className={`w-8 h-8 rounded-full transition-all duration-150
                            ${selectedColor === color ? "ring-2 ring-offset-2 ring-zoom-dark dark:ring-gray-300 scale-110" : "hover:scale-110"}`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        <button
          id="profile-save-btn"
          type="submit"
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <Check className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
        </button>
      </form>
    </section>
  );
}

function PmiTab() {
  const { user } = useUser();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);

  const pmi = user?.personal_meeting_id;
  const inviteLink = pmi
    ? `${window.location.origin}/join?code=${pmi}`
    : "";

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleStart() {
    setStarting(true);
    try {
      const meeting = await startPmiMeeting();
      router.push(`/meeting/${meeting.meeting_code}`);
    } catch (err) {
      console.error(err);
    } finally {
      setStarting(false);
    }
  }

  return (
    <section className="space-y-6 max-w-md">
      <h2 className="text-base font-semibold text-zoom-dark dark:text-gray-100">
        Personal Meeting ID
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Your PMI is a fixed meeting room that you can reuse anytime. The meeting
        code never changes.
      </p>

      {/* PMI display */}
      <div className="bg-zoom-light-gray dark:bg-zinc-700 rounded-xl p-4">
        <p className="text-xs text-gray-400 mb-1">Meeting ID</p>
        <p
          id="settings-pmi-value"
          className="font-mono text-2xl font-bold text-zoom-dark dark:text-gray-100 tracking-widest"
        >
          {pmi ?? "Loading…"}
        </p>
      </div>

      {/* Invite link */}
      <div>
        <p className="text-xs text-gray-400 mb-1.5">Invite Link</p>
        <div className="flex items-center gap-2 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 bg-white dark:bg-zinc-800">
          <p className="flex-1 text-xs text-gray-600 dark:text-gray-400 truncate font-mono">
            {inviteLink}
          </p>
          <button
            id="settings-copy-pmi-btn"
            onClick={handleCopy}
            className="flex-shrink-0 text-xs font-semibold text-zoom-blue hover:text-zoom-blue-dark
                       flex items-center gap-1 transition-colors"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <button
        id="settings-start-pmi-btn"
        onClick={handleStart}
        disabled={starting || !pmi}
        className="btn-primary flex items-center gap-2"
      >
        {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
        {starting ? "Starting…" : "Start Meeting with PMI"}
      </button>
    </section>
  );
}

function AudioTab() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0); // 0–100
  const animFrameRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Enumerate devices
  useEffect(() => {
    async function enumerate() {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const all = await navigator.mediaDevices.enumerateDevices();
        const mics = all.filter((d) => d.kind === "audioinput");
        setDevices(mics);
        if (mics.length > 0) setSelectedDevice(mics[0].deviceId);
      } catch {
        setPermissionDenied(true);
      }
    }
    enumerate();
  }, []);

  // Start live VU meter when device changes
  useEffect(() => {
    if (!selectedDevice || permissionDenied) return;

    let stopped = false;

    async function startMeter() {
      // Stop previous stream
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close();
      cancelAnimationFrame(animFrameRef.current);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: { exact: selectedDevice } },
        });
        if (stopped) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;

        const ctx = new AudioContext();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        const data = new Uint8Array(analyser.frequencyBinCount);

        const tick = () => {
          analyser.getByteFrequencyData(data);
          const avg = data.reduce((a, b) => a + b, 0) / data.length;
          setVolumeLevel(Math.min(100, Math.round((avg / 128) * 100)));
          animFrameRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        // permission re-revoked or device unavailable
      }
    }

    startMeter();
    return () => {
      stopped = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close();
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [selectedDevice, permissionDenied]);

  function playTestTone() {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 440;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.5);
  }

  // Build meter bars
  const bars = 20;
  const filledBars = Math.round((volumeLevel / 100) * bars);

  return (
    <section className="space-y-6 max-w-md">
      <h2 className="text-base font-semibold text-zoom-dark dark:text-gray-100">
        Audio
      </h2>

      {permissionDenied ? (
        <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            Microphone access was denied. Enable it in your browser settings to
            use audio features.
          </p>
        </div>
      ) : (
        <>
          {/* Microphone selector */}
          <div>
            <label
              htmlFor="mic-device-select"
              className="block text-sm font-medium text-zoom-dark dark:text-gray-300 mb-1.5"
            >
              Microphone
            </label>
            <select
              id="mic-device-select"
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="input-field"
            >
              {devices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Microphone ${d.deviceId.slice(0, 8)}`}
                </option>
              ))}
            </select>
          </div>

          {/* Live VU meter */}
          <div>
            <p className="text-sm font-medium text-zoom-dark dark:text-gray-300 mb-2">
              Input Level
            </p>
            <div
              id="vu-meter"
              className="flex items-end gap-0.5 h-8"
              aria-label={`Input level: ${volumeLevel}%`}
            >
              {Array.from({ length: bars }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-sm transition-all duration-75 ${
                    i < filledBars
                      ? i < 14
                        ? "bg-green-500"
                        : i < 17
                        ? "bg-yellow-400"
                        : "bg-red-500"
                      : "bg-gray-200 dark:bg-zinc-700"
                  }`}
                  style={{ height: `${20 + (i / bars) * 80}%` }}
                />
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Speak to see your mic level
            </p>
          </div>

          {/* Test speaker */}
          <div>
            <p className="text-sm font-medium text-zoom-dark dark:text-gray-300 mb-2">
              Speaker
            </p>
            <button
              id="test-speaker-btn"
              onClick={playTestTone}
              className="btn-secondary flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Test Speaker
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function VideoTab() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [noCameraFound, setNoCameraFound] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Enumerate cameras
  useEffect(() => {
    async function enumerate() {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        const all = await navigator.mediaDevices.enumerateDevices();
        const cams = all.filter((d) => d.kind === "videoinput");
        if (cams.length === 0) {
          setNoCameraFound(true);
          return;
        }
        setDevices(cams);
        setSelectedDevice(cams[0].deviceId);
      } catch (err) {
        const e = err as DOMException;
        if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
          setPermissionDenied(true);
        } else {
          setNoCameraFound(true);
        }
      }
    }
    enumerate();
  }, []);

  // Start camera preview when device changes
  useEffect(() => {
    if (!selectedDevice || permissionDenied || noCameraFound) return;

    let stopped = false;

    async function startCamera() {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: selectedDevice } },
        });
        if (stopped) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        // device removed mid-session
      }
    }

    startCamera();
    return () => {
      stopped = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [selectedDevice, permissionDenied, noCameraFound]);

  return (
    <section className="space-y-6 max-w-md">
      <h2 className="text-base font-semibold text-zoom-dark dark:text-gray-100">
        Video
      </h2>

      {permissionDenied ? (
        <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            Camera access was denied. Enable it in your browser settings to preview video.
          </p>
        </div>
      ) : noCameraFound ? (
        <div className="flex items-center gap-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No camera detected on this device.
          </p>
        </div>
      ) : (
        <>
          {/* Camera selector */}
          <div>
            <label
              htmlFor="camera-device-select"
              className="block text-sm font-medium text-zoom-dark dark:text-gray-300 mb-1.5"
            >
              Camera
            </label>
            <select
              id="camera-device-select"
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="input-field"
            >
              {devices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Camera ${d.deviceId.slice(0, 8)}`}
                </option>
              ))}
            </select>
          </div>

          {/* Live preview */}
          <div className="rounded-2xl overflow-hidden bg-black aspect-video">
            <video
              id="camera-preview"
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-xs text-gray-400 -mt-3">
            Live camera preview — no recording
          </p>
        </>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Settings Page
// ---------------------------------------------------------------------------
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("general");

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-zoom-dark dark:text-gray-100 mb-6">
          Settings
        </h1>

        <div className="flex flex-col sm:flex-row gap-6">
          {/* Tab list */}
          <nav className="sm:w-52 flex-shrink-0">
            <ul className="flex flex-row sm:flex-col gap-1 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0">
              {TABS.map((tab) => (
                <li key={tab.id}>
                  <button
                    id={`settings-tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm
                                font-medium transition-colors duration-150 whitespace-nowrap
                                ${
                                  activeTab === tab.id
                                    ? "bg-zoom-blue-light dark:bg-zoom-blue/20 text-zoom-blue"
                                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700"
                                }`}
                  >
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Tab content */}
          <div className="flex-1 bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700 p-6">
            {activeTab === "general" && <GeneralTab />}
            {activeTab === "profile" && <ProfileTab />}
            {activeTab === "pmi" && <PmiTab />}
            {activeTab === "audio" && <AudioTab />}
            {activeTab === "video" && <VideoTab />}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
