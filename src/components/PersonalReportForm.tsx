"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";

export function PersonalReportForm() {
  const params = useSearchParams();
  const [values, setValues] = useState({
    name: "",
    email: "",
    whatsapp: "",
    birthDate: params.get("birthDate") || "",
    birthTime: params.get("birthTime") || "",
    birthPlace: params.get("birthPlace") || "",
    message: "",
  });
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  const set = (key: keyof typeof values, value: string) => setValues((v) => ({ ...v, [key]: value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setState("loading");
    try {
      const res = await fetch("/api/informe-personalizado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar");
      setState("success");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Ocurrió un error.");
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gold/25 bg-transparent px-4 py-2.5 font-ui text-sm text-current placeholder:text-gold-dim/60 focus:border-gold focus:outline-none";
  const labelClass = "mb-1.5 block font-ui text-xs uppercase tracking-wide text-gold-dim";

  if (state === "success") {
    return (
      <div className="rounded-2xl border border-green-700/50 bg-green-900/10 p-8 text-center">
        <p className="font-display text-xl text-gold-pale">¡Listo! Recibimos tu pedido.</p>
        <p className="mt-2 font-body text-base text-gold-pale/75">
          Te vamos a contactar por email para coordinar tu informe personalizado.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-wine/50 bg-wine/10 px-4 py-3 font-ui text-sm text-wine-bright">
          {error}
        </div>
      )}
      <div>
        <label className={labelClass}>Nombre</label>
        <input required className={inputClass} value={values.name} onChange={(e) => set("name", e.target.value)} />
      </div>
      <div>
        <label className={labelClass}>Email</label>
        <input required type="email" className={inputClass} value={values.email} onChange={(e) => set("email", e.target.value)} />
      </div>
      <div>
        <label className={labelClass}>WhatsApp (opcional)</label>
        <input className={inputClass} value={values.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Fecha de nacimiento</label>
          <input type="date" className={inputClass} value={values.birthDate} onChange={(e) => set("birthDate", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Hora</label>
          <input type="time" className={inputClass} value={values.birthTime} onChange={(e) => set("birthTime", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Lugar</label>
          <input className={inputClass} value={values.birthPlace} onChange={(e) => set("birthPlace", e.target.value)} />
        </div>
      </div>
      <div>
        <label className={labelClass}>¿Qué te gustaría que incluya el informe? (opcional)</label>
        <textarea rows={3} className={inputClass} value={values.message} onChange={(e) => set("message", e.target.value)} />
      </div>
      <button
        type="submit"
        disabled={state === "loading"}
        className="focus-ring w-full rounded-full bg-gold px-6 py-3 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright disabled:opacity-60 sm:w-auto"
      >
        {state === "loading" ? "Enviando…" : "Enviar pedido"}
      </button>
    </form>
  );
}
