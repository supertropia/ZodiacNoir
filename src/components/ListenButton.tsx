"use client";

import { useEffect, useRef, useState } from "react";

type Status = "idle" | "playing" | "paused";

export function ListenButton({ text }: { text: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [supported, setSupported] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSupported(false);
      return;
    }

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const pickSpanishVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    return (
      voices.find((v) => v.lang === "es-AR") ||
      voices.find((v) => v.lang.startsWith("es")) ||
      voices[0]
    );
  };

  const play = () => {
    const synth = window.speechSynthesis;

    if (status === "paused") {
      synth.resume();
      setStatus("playing");
      return;
    }

    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-AR";
    utterance.rate = 0.98;
    const voice = pickSpanishVoice();
    if (voice) utterance.voice = voice;

    utterance.onend = () => setStatus("idle");
    utterance.onerror = () => setStatus("idle");

    utteranceRef.current = utterance;
    synth.speak(utterance);
    setStatus("playing");
  };

  const pause = () => {
    window.speechSynthesis.pause();
    setStatus("paused");
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setStatus("idle");
  };

  if (!supported) return null;

  return (
    <div className="flex items-center gap-2 rounded-full border border-gold/40 bg-noir-surface/60 px-3 py-2">
      <span className="font-ui text-xs uppercase tracking-wide text-gold-dim">Escuchar este artículo</span>
      {status !== "playing" ? (
        <button
          onClick={play}
          aria-label="Reproducir"
          className="focus-ring flex h-8 w-8 items-center justify-center rounded-full bg-gold text-noir-bg transition hover:bg-gold-bright"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
        </button>
      ) : (
        <button
          onClick={pause}
          aria-label="Pausar"
          className="focus-ring flex h-8 w-8 items-center justify-center rounded-full bg-gold text-noir-bg transition hover:bg-gold-bright"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
        </button>
      )}
      <button
        onClick={stop}
        aria-label="Detener"
        className="focus-ring flex h-8 w-8 items-center justify-center rounded-full border border-gold/40 text-gold transition hover:bg-gold/10"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="14" height="14" /></svg>
      </button>
    </div>
  );
}
