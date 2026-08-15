"use client";

import { useEffect, useState } from "react";

function getParts(targetIso: string) {
  const diff = new Date(targetIso).getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

/** Cuenta regresiva en vivo hasta una fecha ISO (ej. próximo eclipse o luna llena). */
export function CountdownTimer({ targetIso }: { targetIso: string }) {
  const [parts, setParts] = useState(() => getParts(targetIso));

  useEffect(() => {
    const id = setInterval(() => setParts(getParts(targetIso)), 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  if (!parts) {
    return <p className="font-ui text-sm text-gold-dim">Este evento ya está en curso.</p>;
  }

  const cells = [
    { label: "días", value: parts.days },
    { label: "hs", value: parts.hours },
    { label: "min", value: parts.minutes },
    { label: "seg", value: parts.seconds },
  ];

  return (
    <div className="flex gap-3">
      {cells.map((c) => (
        <div key={c.label} className="flex flex-col items-center rounded-lg border border-gold/25 bg-noir-bg/40 px-3 py-2 min-w-[3.5rem]">
          <span className="font-display text-xl text-gold tabular-nums">{String(c.value).padStart(2, "0")}</span>
          <span className="font-ui text-[10px] uppercase tracking-wide text-gold-dim">{c.label}</span>
        </div>
      ))}
    </div>
  );
}
