"use client";

import { useState, type FormEvent } from "react";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setState("loading");
    try {
      const res = await fetch("/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No pudimos enviar tu mensaje.");
      setState("success");
      setFeedback("Gracias, recibimos tu mensaje. Te respondemos a la brevedad.");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setState("error");
      setFeedback(err instanceof Error ? err.message : "Algo salió mal.");
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="contact-name" className="mb-1 block font-ui text-xs uppercase tracking-wide text-gold-dim">
          Nombre
        </label>
        <input
          id="contact-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="focus-ring w-full rounded-xl border border-gold/40 bg-transparent px-4 py-3 font-ui text-sm text-current placeholder:text-gold-dim focus:border-gold"
          placeholder="Tu nombre"
        />
      </div>
      <div>
        <label htmlFor="contact-email" className="mb-1 block font-ui text-xs uppercase tracking-wide text-gold-dim">
          Email
        </label>
        <input
          id="contact-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="focus-ring w-full rounded-xl border border-gold/40 bg-transparent px-4 py-3 font-ui text-sm text-current placeholder:text-gold-dim focus:border-gold"
          placeholder="tu@email.com"
        />
      </div>
      <div>
        <label htmlFor="contact-message" className="mb-1 block font-ui text-xs uppercase tracking-wide text-gold-dim">
          Mensaje
        </label>
        <textarea
          id="contact-message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="focus-ring w-full rounded-xl border border-gold/40 bg-transparent px-4 py-3 font-ui text-sm text-current placeholder:text-gold-dim focus:border-gold"
          placeholder="Contanos en qué podemos ayudarte"
        />
      </div>
      <button
        type="submit"
        disabled={state === "loading"}
        className="focus-ring rounded-full bg-gold px-7 py-3 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright disabled:opacity-60"
      >
        {state === "loading" ? "Enviando…" : "Enviar mensaje"}
      </button>
      {feedback && (
        <p className={`font-ui text-sm ${state === "error" ? "text-wine-bright" : "text-gold"}`}>{feedback}</p>
      )}
    </form>
  );
}
