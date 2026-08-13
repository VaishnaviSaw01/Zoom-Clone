"use client";

import { useState, useEffect, useRef } from "react";

export interface MediaStreamState {
  stream: MediaStream | null;
  videoTrack: MediaStreamTrack | null;
  audioTrack: MediaStreamTrack | null;
  /** true if the browser denied permission */
  permissionDenied: boolean;
  /** true if no camera hardware is available (but not a permission error) */
  noCameraAvailable: boolean;
}

/**
 * useMediaStream — requests camera + mic via getUserMedia on mount.
 *
 * Returns the live stream, individual tracks, and fallback states for:
 *   - permissionDenied: user said "Block" in the browser prompt
 *   - noCameraAvailable: no camera hardware found (headless machine, etc.)
 *
 * The caller is responsible for displaying an appropriate fallback UI.
 */
export function useMediaStream(): MediaStreamState {
  const [state, setState] = useState<MediaStreamState>({
    stream: null,
    videoTrack: null,
    audioTrack: null,
    permissionDenied: false,
    noCameraAvailable: false,
  });

  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function acquire() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        setState({
          stream,
          videoTrack: stream.getVideoTracks()[0] ?? null,
          audioTrack: stream.getAudioTracks()[0] ?? null,
          permissionDenied: false,
          noCameraAvailable: false,
        });
      } catch (err) {
        if (cancelled) return;
        const e = err as DOMException;
        const denied =
          e.name === "NotAllowedError" ||
          e.name === "PermissionDeniedError";
        const noCamera =
          e.name === "NotFoundError" ||
          e.name === "DevicesNotFoundError" ||
          e.name === "OverconstrainedError";

        if (denied) {
          // Try audio-only as fallback
          try {
            const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
              audio: true,
            });
            if (cancelled) { audioOnlyStream.getTracks().forEach((t) => t.stop()); return; }
            streamRef.current = audioOnlyStream;
            setState({
              stream: audioOnlyStream,
              videoTrack: null,
              audioTrack: audioOnlyStream.getAudioTracks()[0] ?? null,
              permissionDenied: true, // video blocked
              noCameraAvailable: false,
            });
          } catch {
            setState((s) => ({ ...s, permissionDenied: true }));
          }
        } else if (noCamera) {
          // Try audio-only
          try {
            const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
              audio: true,
            });
            if (cancelled) { audioOnlyStream.getTracks().forEach((t) => t.stop()); return; }
            streamRef.current = audioOnlyStream;
            setState({
              stream: audioOnlyStream,
              videoTrack: null,
              audioTrack: audioOnlyStream.getAudioTracks()[0] ?? null,
              permissionDenied: false,
              noCameraAvailable: true,
            });
          } catch {
            setState((s) => ({ ...s, noCameraAvailable: true }));
          }
        } else {
          // Unknown error — treat as no camera
          setState((s) => ({ ...s, noCameraAvailable: true }));
        }
      }
    }

    acquire();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return state;
}
