"use client";

import { useState } from "react";

export function UnsubscribeForm({ token }: { token: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  const onConfirm = async () => {
    setState("loading");
    try {
      const res = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) throw new Error("No se pudo procesar la baja");
      setState("done");
    } catch {
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <div role="status">
        <p className="font-display text-2xl">Listo, te diste de baja.</p>
        <p className="mt-3 font-body text-lg opacity-80">
          No recibirás más correos del boletín. Si fue un error, puedes volver a suscribirte cuando quieras desde la página
          de inicio.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="font-body text-lg opacity-80">
        Si confirmas, dejarás de recibir el boletín de Zodiac Noir. Tus compras y tu membresía no se modifican.
      </p>
      <button
        onClick={onConfirm}
        disabled={state === "loading"}
        className="focus-ring mt-6 rounded-full bg-gold px-6 py-3 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright disabled:opacity-60"
      >
        {state === "loading" ? "Procesando…" : "Confirmar baja"}
      </button>
      {state === "error" && (
        <p role="alert" className="mt-4 font-ui text-sm text-wine-bright">
          No pudimos darte de baja. Inténtalo de nuevo o escríbenos a zodiacnoir@zodiacnoirweb.com.
        </p>
      )}
    </div>
  );
}
