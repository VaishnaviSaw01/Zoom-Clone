"use client";

import { useState, useEffect, useRef } from "react";

/**
 * useAudioLevel — measures the real-time RMS audio level of a MediaStreamTrack.
 *
 * Returns a number 0–100 updated ~20 times/sec via Web Audio AnalyserNode.
 * When `enabled` is false (i.e., mic is muted), returns 0 immediately.
 */
export function useAudioLevel(
  audioTrack: MediaStreamTrack | null,
  enabled: boolean
): number {
  const [level, setLevel] = useState(0);
  const rafRef = useRef<number>(0);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    if (!audioTrack || !enabled) {
      setLevel(0);
      return;
    }

    // Create AudioContext + AnalyserNode
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;

    const ms = new MediaStream([audioTrack]);
    const source = ctx.createMediaStreamSource(ms);
    source.connect(analyser);

    ctxRef.current = ctx;
    analyserRef.current = analyser;

    const buf = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(buf);
      // Compute RMS as a 0-100 value
      let sum = 0;
      Array.from(buf).forEach((v) => { sum += v * v; });
      const rms = Math.sqrt(sum / buf.length);
      setLevel(Math.min(100, (rms / 128) * 100));
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      source.disconnect();
      ctx.close();
      ctxRef.current = null;
      analyserRef.current = null;
    };
  }, [audioTrack, enabled]);

  return level;
}
