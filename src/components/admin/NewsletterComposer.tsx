"use client";

import { useState } from "react";

type Result = { kind: "ok" | "error"; text: string } | null;

const inputClass =
  "focus-ring w-full rounded-lg border border-gold/30 bg-transparent px-4 py-3 font-ui text-sm text-current placeholder:text-gold-dim focus:border-gold";

export function NewsletterComposer({ active }: { active: number }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState<"test" | "all" | null>(null);
  const [result, setResult] = useState<Result>(null);

  const send = async (mode: "test" | "all") => {
    setResult(null);
    if (!subject.trim() || body.trim().length < 20) {
      setResult({ kind: "error", text: "Completa el asunto y el mensaje antes de enviar." });
      return;
    }
    if (mode === "all") {
      const ok = confirm(
        `Vas a enviar «${subject.trim()}» a ${active} ${active === 1 ? "persona" : "personas"}.\n\n` +
          "Un envío no se puede deshacer. ¿Ya enviaste una prueba y la revisaste?"
      );
      if (!ok) return;
    }
    setLoading(mode);
    try {
      const res = await fetch("/api/admin/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo enviar.");
      if (mode === "test") {
        setResult({ kind: "ok", text: `Prueba enviada a ${data.to}. Revisa tu bandeja de entrada y también Spam.` });
      } else if (data.failed > 0) {
        setResult({
          kind: "error",
          text: `Se enviaron ${data.sent} de ${data.total}. Fallaron ${data.failed}. Motivo: ${data.firstError || "desconocido"}. Revisa el límite de tu plan de Resend.`,
        });
      } else {
        setResult({ kind: "ok", text: `Listo: el boletín se envió a ${data.sent} ${data.sent === 1 ? "persona" : "personas"}.` });
      }
    } catch (err) {
      setResult({ kind: "error", text: err instanceof Error ? err.message : "Algo salió mal." });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="nl-subject" className="mb-2 block font-ui text-xs uppercase tracking-wide text-gold-dim">
          Asunto
        </label>
        <input
          id="nl-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={150}
          placeholder="Ej.: Luna llena en Tauro: lo que se activa esta semana"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="nl-body" className="mb-2 block font-ui text-xs uppercase tracking-wide text-gold-dim">
          Mensaje
        </label>
        <textarea
          id="nl-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={16}
          placeholder={"Escribe aquí tu mensaje.\n\nDeja una línea en blanco entre párrafos.\n\n## Así se hace un subtítulo\n\nPega enlaces completos (https://zodiacnoirweb.com/blog/...) y se vuelven clicables."}
          className={`${inputClass} font-body leading-relaxed`}
        />
        <p className="mt-2 font-ui text-xs text-gold-dim">
          El enlace para darse de baja se agrega solo al final de cada correo.
        </p>
      </div>

      {result && (
        <p
          role={result.kind === "error" ? "alert" : "status"}
          className={`rounded-xl border px-5 py-4 font-ui text-sm ${
            result.kind === "error"
              ? "border-wine/50 bg-wine/10 text-wine-bright"
              : "border-green-800/50 bg-green-900/20 text-green-300"
          }`}
        >
          {result.text}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => send("test")}
          disabled={loading !== null}
          className="focus-ring rounded-full border border-gold/40 px-6 py-3 font-ui text-sm uppercase tracking-wide text-gold transition hover:border-gold hover:bg-gold/10 disabled:opacity-50"
        >
          {loading === "test" ? "Enviando prueba…" : "1. Enviarme una prueba"}
        </button>
        <button
          onClick={() => send("all")}
          disabled={loading !== null || active === 0}
          className="focus-ring rounded-full bg-gold px-6 py-3 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright disabled:opacity-50"
        >
          {loading === "all" ? "Enviando…" : `2. Enviar a ${active} ${active === 1 ? "suscriptor" : "suscriptores"}`}
        </button>
      </div>
    </div>
  );
}
