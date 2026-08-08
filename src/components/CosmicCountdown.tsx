"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Props = {
  title: string;
  subtitle?: string | null;
  eventDate: string; // ISO
  articleSlug?: string | null;
  guideUrl?: string | null;
  description?: string | null;
};

function getRemaining(target: number) {
  const now = Date.now();
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds, done: diff <= 0 };
}

export function CosmicCountdown({ title, subtitle, eventDate, articleSlug, guideUrl, description }: Props) {
  const target = new Date(eventDate).getTime();
  const [remaining, setRemaining] = useState(() => getRemaining(target));

  useEffect(() => {
    const id = setInterval(() => setRemaining(getRemaining(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const units = [
    { label: "Días", value: remaining.days },
    { label: "Horas", value: remaining.hours },
    { label: "Minutos", value: remaining.minutes },
    { label: "Segundos", value: remaining.seconds },
  ];

  return (
    <div className="rounded-3xl border border-gold/25 bg-noir-surface/60 px-6 py-12 text-center sm:px-12">
      {subtitle && <p className="font-ui text-xs uppercase tracking-widest2 text-gold-dim">{subtitle}</p>}
      <h2 className="mx-auto mt-3 max-w-xl font-display text-2xl italic text-gold-pale sm:text-3xl">{title}</h2>

      {remaining.done ? (
        <p className="mt-6 font-display text-2xl text-gold">El evento ya está en marcha</p>
      ) : (
        <div className="mt-8 flex flex-wrap items-start justify-center gap-4 sm:gap-8">
          {units.map((u) => (
            <div key={u.label} className="min-w-[70px]">
              <span className="font-display text-4xl font-bold text-gold-pale sm:text-5xl">
                {String(u.value).padStart(2, "0")}
              </span>
              <p className="mt-1 font-ui text-xs uppercase tracking-wide text-gold-dim">{u.label}</p>
            </div>
          ))}
        </div>
      )}

      {description && (
        <p className="mx-auto mt-8 max-w-lg font-body text-lg text-gold-pale/80">{description}</p>
      )}

      {(articleSlug || guideUrl) && (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          {articleSlug && (
            <Link
              href={`/articulos/${articleSlug}`}
              className="focus-ring rounded-full border border-gold/40 px-6 py-3 font-ui text-sm uppercase tracking-wide text-gold transition hover:border-gold hover:bg-gold/10"
            >
              Ver artículo
            </Link>
          )}
          {guideUrl && (
            <a
              href={guideUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring rounded-full bg-gold px-6 py-3 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright"
            >
              Obtener guía
            </a>
          )}
        </div>
      )}
    </div>
  );
}
