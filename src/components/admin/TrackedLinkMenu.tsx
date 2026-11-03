"use client";

import { useEffect, useRef, useState } from "react";
import { SHAREABLE_SOURCES, buildTrackedUrl } from "@/lib/traffic-sources";

/**
 * Botón «Copiar link» con seguimiento. Al tocarlo se abre una lista de fuentes (YouTube, Instagram…):
 * eliges una y se copia el link de esta página con la fuente marcada, para que /admin/estadisticas
 * sepa de dónde llegó cada visita. Opcionalmente le pones un nombre de campaña (por ejemplo, el del video).
 */
export function TrackedLinkMenu({ path, label = "Copiar link" }: { path: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const [campaign, setCampaign] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const copy = async (key: string) => {
    const url = buildTrackedUrl(window.location.origin, path, key, campaign);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      window.prompt("Copia este link:", url);
    }
  };

  const itemClass =
    "focus-ring flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left font-ui text-sm text-gold-pale transition hover:bg-gold/10";

  return (
    <div ref={boxRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className="focus-ring rounded-full border border-gold/40 px-4 py-2 font-ui text-xs uppercase tracking-wide text-gold transition hover:border-gold hover:bg-gold/10"
      >
        {label} ▾
      </button>

      {open && (
        <div
          role="group"
          aria-label="Elige dónde vas a compartir el link"
          className="absolute right-0 z-20 mt-2 w-72 max-w-[calc(100vw-2.5rem)] rounded-xl border border-gold/30 bg-noir-bg p-3 shadow-xl"
        >
          <label className="block font-ui text-xs uppercase tracking-wide text-gold-dim" htmlFor={`campana-${path}`}>
            Nombre de campaña (opcional)
          </label>
          <input
            id={`campana-${path}`}
            value={campaign}
            onChange={(e) => setCampaign(e.target.value)}
            maxLength={60}
            placeholder="ej. video eclipse"
            className="mt-1 w-full rounded-lg border border-gold/30 bg-noir-surface px-3 py-2 font-ui text-sm text-gold-pale placeholder:text-gold-dim/70"
          />
          <p className="mt-1 font-ui text-[11px] text-gold-dim">
            Sirve para distinguir, por ejemplo, dos videos de YouTube que llevan al mismo producto.
          </p>

          <ul className="mt-3 max-h-64 space-y-0.5 overflow-y-auto">
            {SHAREABLE_SOURCES.map((source, index) => (
              <li key={source.key} className={index === 2 ? "mt-1 border-t border-gold/15 pt-1" : undefined}>
                <button type="button" onClick={() => copy(source.key)} className={itemClass}>
                  <span className={index < 2 ? "font-medium" : undefined}>Para {source.label}</span>
                  <span className="text-xs text-gold">{copiedKey === source.key ? "¡Copiado!" : "Copiar"}</span>
                </button>
              </li>
            ))}
            <li className="mt-1 border-t border-gold/15 pt-1">
              <button type="button" onClick={() => copy("sin-seguimiento")} className={itemClass}>
                <span>Sin seguimiento</span>
                <span className="text-xs text-gold">{copiedKey === "sin-seguimiento" ? "¡Copiado!" : "Copiar"}</span>
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
