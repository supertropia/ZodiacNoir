"use client";

import { useMemo, useState } from "react";

export type SubscriberRow = {
  email: string;
  /** Fecha de alta (ISO). */
  createdAt: string;
  /** Fecha de baja (ISO) o null si sigue activo. */
  unsubscribedAt: string | null;
  /** Etiqueta del origen ya escrita en español, por ejemplo "YouTube". */
  sourceLabel: string;
};

type StatusFilter = "todos" | "activos" | "bajas" | "nuevos7" | "nuevos30";

const DAY_MS = 24 * 60 * 60 * 1000;
const PAGE_SIZE = 50;

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Buenos_Aires",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : dateFormatter.format(date);
}

// Evita que Excel interprete como fórmula un texto que empieza con = + - @.
function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function SubscribersTable({ rows, truncated }: { rows: SubscriberRow[]; truncated: boolean }) {
  const [status, setStatus] = useState<StatusFilter>("activos");
  const [source, setSource] = useState("");
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const sources = useMemo(() => Array.from(new Set(rows.map((r) => r.sourceLabel))).sort(), [rows]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const created = new Date(r.createdAt).getTime();
      if (status === "activos" && r.unsubscribedAt) return false;
      if (status === "bajas" && !r.unsubscribedAt) return false;
      if (status === "nuevos7" && now - created > 7 * DAY_MS) return false;
      if (status === "nuevos30" && now - created > 30 * DAY_MS) return false;
      if (source && r.sourceLabel !== source) return false;
      if (q && !r.email.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, status, source, query]);

  function resetView() {
    setVisible(PAGE_SIZE);
  }

  function downloadCsv() {
    const header = ["Correo", "Estado", "Fecha de alta", "Fecha de baja", "Origen"];
    const lines = [header.map(csvCell).join(";")];
    for (const r of filtered) {
      lines.push(
        [r.email, r.unsubscribedAt ? "Baja" : "Activo", formatDate(r.createdAt), formatDate(r.unsubscribedAt), r.sourceLabel]
          .map(csvCell)
          .join(";")
      );
    }
    // El carácter inicial (BOM) hace que Excel respete las tildes; el punto y coma, que separe las columnas.
    const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `suscriptores-zodiac-noir-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  const fieldClass =
    "focus-ring w-full rounded-lg border border-gold/25 bg-noir-bg px-3 py-2 font-ui text-sm text-gold-pale";

  return (
    <details className="mb-10 rounded-xl border border-gold/25 bg-noir-surface/40 p-5" aria-label="Lista de suscriptores">
      <summary className="cursor-pointer font-display text-xl text-gold-pale">
        Lista de suscriptores <span className="font-ui text-sm text-gold-dim">({rows.length})</span>
      </summary>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="block font-ui text-xs text-gold-dim">
          Mostrar
          <select
            className={`${fieldClass} mt-1`}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as StatusFilter);
              resetView();
            }}
          >
            <option value="activos">Activos (reciben el newsletter)</option>
            <option value="bajas">Dados de baja</option>
            <option value="nuevos7">Nuevos: últimos 7 días</option>
            <option value="nuevos30">Nuevos: últimos 30 días</option>
            <option value="todos">Todos</option>
          </select>
        </label>
        <label className="block font-ui text-xs text-gold-dim">
          Origen
          <select
            className={`${fieldClass} mt-1`}
            value={source}
            onChange={(e) => {
              setSource(e.target.value);
              resetView();
            }}
          >
            <option value="">Todos los orígenes</option>
            {sources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="block font-ui text-xs text-gold-dim">
          Buscar por correo
          <input
            type="search"
            className={`${fieldClass} mt-1`}
            value={query}
            placeholder="Escribe parte del correo"
            onChange={(e) => {
              setQuery(e.target.value);
              resetView();
            }}
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="font-ui text-sm text-gold-pale" role="status">
          {filtered.length} {filtered.length === 1 ? "persona" : "personas"}
        </p>
        <button
          type="button"
          onClick={downloadCsv}
          disabled={filtered.length === 0}
          className="focus-ring rounded-full border border-gold/40 px-4 py-2 font-ui text-sm text-gold transition hover:bg-gold/10 disabled:opacity-50"
        >
          Descargar lo que ves (Excel / CSV)
        </button>
      </div>

      {truncated && (
        <p className="mt-3 font-ui text-xs text-gold-dim">
          Se muestran los {rows.length} suscriptores más recientes. Los totales de arriba cuentan a todos.
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="mt-4 font-ui text-sm text-gold-pale">No hay nadie que coincida con este filtro.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left font-ui text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-gold-dim">
                <th className="py-2 pr-4 font-medium">Correo</th>
                <th className="py-2 pr-4 font-medium">Estado</th>
                <th className="py-2 pr-4 font-medium">Alta</th>
                <th className="py-2 pr-4 font-medium">Baja</th>
                <th className="py-2 font-medium">Origen</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, visible).map((r) => (
                <tr key={r.email} className="border-t border-gold/15 text-gold-pale">
                  <td className="break-all py-2 pr-4">{r.email}</td>
                  <td className="py-2 pr-4">
                    {r.unsubscribedAt ? (
                      <span className="rounded-full border border-gold/30 px-2 py-0.5 text-xs text-gold-dim">Baja</span>
                    ) : (
                      <span className="rounded-full border border-gold/50 bg-gold/10 px-2 py-0.5 text-xs text-gold">Activo</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap py-2 pr-4">{formatDate(r.createdAt)}</td>
                  <td className="whitespace-nowrap py-2 pr-4">{formatDate(r.unsubscribedAt) || "—"}</td>
                  <td className="py-2">{r.sourceLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length > visible && (
        <button
          type="button"
          onClick={() => setVisible((v) => v + PAGE_SIZE)}
          className="focus-ring mt-4 rounded-full border border-gold/40 px-4 py-2 font-ui text-sm text-gold transition hover:bg-gold/10"
        >
          Mostrar más ({filtered.length - visible} restantes)
        </button>
      )}
    </details>
  );
}
