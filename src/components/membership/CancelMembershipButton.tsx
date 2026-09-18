"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CancelMembershipButton() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCancel = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/membership/cancel", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo cancelar la membresía.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cancelar la membresía.");
      setLoading(false);
    }
  };

  if (!confirming) {
    return (
      <div className="mt-4">
        {error && <p className="mb-2 font-ui text-xs text-wine-bright">{error}</p>}
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="focus-ring rounded-full border border-wine/50 px-5 py-2 font-ui text-xs uppercase tracking-wide text-wine-bright transition hover:bg-wine/10"
        >
          Cancelar membresía
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-wine/40 bg-wine/10 p-4">
      <p className="font-ui text-sm text-gold-pale/85">
        ¿Seguro que querés cancelar? Vas a perder el acceso a los artículos exclusivos.
      </p>
      {error && <p className="mt-2 font-ui text-xs text-wine-bright">{error}</p>}
      <div className="mt-3 flex gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={handleCancel}
          className="focus-ring rounded-full bg-wine px-5 py-2 font-ui text-xs font-medium uppercase tracking-wide text-noir-bg transition hover:bg-wine-bright disabled:opacity-60"
        >
          {loading ? "Cancelando…" : "Sí, cancelar"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="focus-ring rounded-full border border-gold/40 px-5 py-2 font-ui text-xs uppercase tracking-wide text-gold transition hover:bg-gold/10"
        >
          Volver
        </button>
      </div>
    </div>
  );
}
