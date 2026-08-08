"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import type { NatalChartResult } from "@/lib/astrology";

type Step = "form" | "results" | "email-gate" | "downloaded";

export function NatalChartCalculator() {
  const [step, setStep] = useState<Step>("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [name, setName] = useState("");

  const [chart, setChart] = useState<NatalChartResult | null>(null);
  const [location, setLocation] = useState<{ displayName: string; latitude: number; longitude: number } | null>(null);

  const [email, setEmail] = useState("");
  const [downloading, setDownloading] = useState(false);

  const onCalculate = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/carta-natal/calcular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ birthDate, birthTime, birthPlace }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No pudimos calcular la carta.");
      setChart(data.chart);
      setLocation(data.location);
      setStep("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error.");
    } finally {
      setLoading(false);
    }
  };

  const onDownload = async (e: FormEvent) => {
    e.preventDefault();
    if (!chart || !location) return;
    setDownloading(true);
    setError("");
    try {
      const res = await fetch("/api/carta-natal/descargar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          birthDate,
          birthTime,
          birthPlace,
          latitude: location.latitude,
          longitude: location.longitude,
          chart,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "No pudimos generar el PDF.");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "carta-natal-zodiac-noir.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setStep("downloaded");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error.");
    } finally {
      setDownloading(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gold/25 bg-transparent px-4 py-3 font-ui text-sm text-current placeholder:text-gold-dim/60 focus:border-gold focus:outline-none";
  const labelClass = "mb-1.5 block font-ui text-xs uppercase tracking-wide text-gold-dim";

  if (step === "form") {
    return (
      <form onSubmit={onCalculate} className="mx-auto max-w-md space-y-5">
        {error && (
          <div className="rounded-lg border border-wine/50 bg-wine/10 px-4 py-3 font-ui text-sm text-wine-bright">{error}</div>
        )}
        <div>
          <label className={labelClass}>Nombre (opcional)</label>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Para personalizar tu PDF" />
        </div>
        <div>
          <label className={labelClass}>Fecha de nacimiento</label>
          <input required type="date" className={inputClass} value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Hora de nacimiento</label>
          <input required type="time" className={inputClass} value={birthTime} onChange={(e) => setBirthTime(e.target.value)} />
          <p className="mt-1 font-ui text-xs text-gold-dim">Si no la sabés con exactitud, usá 12:00 — el ascendente puede variar.</p>
        </div>
        <div>
          <label className={labelClass}>Lugar de nacimiento</label>
          <input
            required
            className={inputClass}
            value={birthPlace}
            onChange={(e) => setBirthPlace(e.target.value)}
            placeholder="Ciudad, país — ej. Rosario, Argentina"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="focus-ring w-full rounded-full bg-gold px-6 py-3.5 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright disabled:opacity-60"
        >
          {loading ? "Calculando…" : "Calcular mi carta"}
        </button>
      </form>
    );
  }

  if (step === "results" || step === "email-gate" || step === "downloaded") {
    if (!chart) return null;

    return (
      <div className="mx-auto max-w-2xl">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Sol", value: chart.sun.sign },
            { label: "Luna", value: chart.moon.sign },
            { label: "Ascendente", value: chart.ascendant.sign },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-gold/25 bg-noir-surface/50 p-5 text-center">
              <p className="font-ui text-xs uppercase tracking-wide text-gold-dim">{item.label}</p>
              <p className="mt-1 font-display text-2xl text-gold-pale">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border border-gold/15">
          {chart.planets.map((p, i) => (
            <div
              key={p.key}
              className={`flex items-center justify-between px-5 py-3 font-ui text-sm ${i % 2 === 0 ? "bg-noir-surface/30" : ""}`}
            >
              <span className="text-gold-pale">{p.name}</span>
              <span className="text-gold-dim">
                {p.degreeInSign}° {p.sign} · Casa {p.house}
                {p.retrograde ? " · R" : ""}
              </span>
            </div>
          ))}
        </div>

        {step === "results" && (
          <div className="mt-10 rounded-2xl border border-gold/25 bg-noir-surface/50 p-7 text-center">
            <p className="font-display text-xl text-gold-pale">Descargá gratis tu carta natal en PDF</p>
            <p className="mt-2 font-body text-base text-gold-pale/75">
              Dejanos tu email para enviarte el PDF completo con todas las posiciones y casas.
            </p>
            <form onSubmit={onDownload} className="mx-auto mt-5 flex max-w-sm flex-col gap-3">
              {error && <p className="font-ui text-sm text-wine-bright">{error}</p>}
              <input
                required
                type="email"
                className={inputClass}
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                type="submit"
                disabled={downloading}
                className="focus-ring rounded-full bg-gold px-6 py-3 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright disabled:opacity-60"
              >
                {downloading ? "Generando PDF…" : "Descarga gratis tu carta natal"}
              </button>
            </form>
          </div>
        )}

        {step === "downloaded" && (
          <div className="mt-10 rounded-2xl border border-gold/30 bg-noir-surface/60 p-8 text-center">
            <p className="font-display text-2xl text-gold-pale">¿Querés un informe personalizado de tu carta natal?</p>
            <p className="mx-auto mt-3 max-w-md font-body text-lg text-gold-pale/80">
              Un análisis completo, escrito por nuestro equipo, con la interpretación de cada
              posición. Completá el formulario y te contactamos.
            </p>
            <Link
              href={`/informe-personalizado?birthDate=${birthDate}&birthTime=${birthTime}&birthPlace=${encodeURIComponent(birthPlace)}`}
              className="focus-ring mt-6 inline-block rounded-full bg-gold px-7 py-3 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright"
            >
              Completar formulario
            </Link>
          </div>
        )}
      </div>
    );
  }

  return null;
}
