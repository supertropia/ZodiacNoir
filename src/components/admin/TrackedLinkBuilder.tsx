"use client";

import { useRef, useState } from "react";
import { SHAREABLE_SOURCES, buildTrackedUrl } from "@/lib/traffic-sources";

export type LinkDestinationGroup = { label: string; items: { path: string; label: string }[] };

const FALLBACK_ORIGIN = "https://zodiacnoirweb.com";

/**
 * Generador de links con seguimiento: eliges la página (inicio, un producto, un artículo…), opcionalmente
 * un nombre de campaña, y aparece el link listo para cada red. Los de YouTube e Instagram van primero.
 */
export function TrackedLinkBuilder({ groups }: { groups: LinkDestinationGroup[] }) {
  const firstPath = groups.find((g) => g.items.length > 0)?.items[0]?.path ?? "/";
  const [path, setPath] = useState(firstPath);
  const [campaign, setCampaign] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  const origin = typeof window !== "undefined" ? window.location.origin : FALLBACK_ORIGIN;

  const copy = async (key: string) => {
    const url = buildTrackedUrl(origin, path, key, campaign);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Si el navegador no deja copiar solo, se selecciona el link para copiarlo con Ctrl+C.
      inputs.current[key]?.select();
    }
  };

  const rows = [
    ...SHAREABLE_SOURCES.map((s) => ({ key: s.key, label: s.label })),
    { key: "sin-seguimiento", label: "Sin seguimiento" },
  ];

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="destino" className="block font-ui text-xs uppercase tracking-wide text-gold-dim">
            ¿A qué página lleva el link?
          </label>
          <select
            id="destino"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gold/30 bg-noir-surface px-3 py-2.5 font-ui text-sm text-gold-pale"
          >
            {groups
              .filter((g) => g.items.length > 0)
              .map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.items.map((item) => (
                    <option key={item.path} value={item.path}>
                      {item.label}
                    </option>
                  ))}
                </optgroup>
              ))}
          </select>
        </div>
        <div>
          <label htmlFor="campana" className="block font-ui text-xs uppercase tracking-wide text-gold-dim">
            Nombre de campaña (opcional)
          </label>
          <input
            id="campana"
            value={campaign}
            onChange={(e) => setCampaign(e.target.value)}
            maxLength={60}
            placeholder="ej. video eclipse"
            className="mt-1 w-full rounded-lg border border-gold/30 bg-noir-surface px-3 py-2.5 font-ui text-sm text-gold-pale placeholder:text-gold-dim/70"
          />
        </div>
      </div>
      <p className="mt-2 font-ui text-xs text-gold-dim">
        Con un nombre de campaña, las estadísticas separan, por ejemplo, el video de eclipses del video de tránsitos aunque
        los dos lleven al mismo producto.
      </p>

      <ul className="mt-5 space-y-2">
        {rows.map((row, index) => {
          const url = buildTrackedUrl(origin, path, row.key, campaign);
          return (
            <li
              key={row.key}
              className={`flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2.5 ${
                index < 2 ? "border-gold/40 bg-gold/5" : "border-gold/15"
              }`}
            >
              <span className={`w-40 shrink-0 font-ui text-sm text-gold-pale ${index < 2 ? "font-medium" : ""}`}>{row.label}</span>
              <input
                ref={(el) => {
                  inputs.current[row.key] = el;
                }}
                readOnly
                value={url}
                aria-label={`Link para ${row.label}`}
                onFocus={(e) => e.currentTarget.select()}
                className="min-w-0 flex-1 basis-56 rounded-md border border-gold/15 bg-noir-bg px-2 py-1.5 font-ui text-xs text-gold-pale/80"
              />
              <button
                type="button"
                onClick={() => copy(row.key)}
                className="focus-ring shrink-0 rounded-full border border-gold/40 px-4 py-1.5 font-ui text-xs uppercase tracking-wide text-gold transition hover:border-gold hover:bg-gold/10"
              >
                {copiedKey === row.key ? "¡Copiado!" : "Copiar"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
