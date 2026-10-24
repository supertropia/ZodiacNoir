"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Interruptor del panel: muestra u oculta las lecturas personalizadas en todo el sitio público.
export function ReadingsVisibilityToggle({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onClick = async () => {
    if (loading) return;
    // Al publicar, pide confirmación: desde ese momento las personas pueden pedir y pagar.
    if (!enabled && !window.confirm("¿Publicar las lecturas? Desde este momento cualquier persona podrá pedirlas y pagarlas.")) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/lecturas/visibilidad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !enabled }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo guardar el cambio.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className={`focus-ring shrink-0 rounded-full px-6 py-2.5 font-ui text-xs font-medium uppercase tracking-wide transition disabled:opacity-50 ${
          enabled ? "border border-gold/50 text-gold hover:bg-gold/10" : "bg-gold text-noir-bg hover:bg-gold-bright"
        }`}
      >
        {loading ? "Guardando…" : enabled ? "Ocultar las lecturas" : "Publicar las lecturas"}
      </button>
      {error && (
        <p role="alert" className="font-ui text-xs text-wine-bright">
          {error}
        </p>
      )}
    </div>
  );
}
