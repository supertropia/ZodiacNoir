"use client";

import { useState, type FormEvent } from "react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setState("loading");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al suscribirte");
      setState("success");
      setMessage("Listo. Revisá tu correo para confirmar la suscripción.");
      setEmail("");
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "Algo salió mal.");
    }
  };

  return (
    <form onSubmit={onSubmit} className="w-full max-w-md">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="newsletter-email" className="sr-only">
          Correo electrónico
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          className="focus-ring flex-1 rounded-full border border-gold/40 bg-transparent px-5 py-3 font-ui text-sm text-current placeholder:text-gold-dim focus:border-gold"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="focus-ring shrink-0 rounded-full bg-gold px-6 py-3 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright disabled:opacity-60"
        >
          {state === "loading" ? "Enviando…" : "Suscribirme"}
        </button>
      </div>
      {message && (
        <p className={`mt-3 font-ui text-sm ${state === "error" ? "text-wine-bright" : "text-gold"}`}>{message}</p>
      )}
    </form>
  );
}
