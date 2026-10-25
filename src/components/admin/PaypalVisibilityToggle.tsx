"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Interruptor del panel: muestra u oculta los botones de PayPal para el público.
// Mientras está apagado, solo la administración los ve (para probar el flujo completo).
export function PaypalVisibilityToggle({ enabled, configured }: { enabled: boolean; configured: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onClick = async () => {
    if (loading) return;
    // Al publicar, pide confirmación: desde ese momento cualquier persona puede pagar con PayPal.
    if (!enabled && !window.confirm("¿Mostrar PayPal al público? Desde este momento cualquier persona podrá pagar con PayPal en la tienda, la membresía y las lecturas.")) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/pagos/paypal", {
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
        {loading ? "Guardando…" : enabled ? "Ocultar PayPal al público" : "Mostrar PayPal al público"}
      </button>
      {enabled && !configured && (
        <p className="font-ui text-xs text-wine-bright">
          Está activado, pero faltan las credenciales en Vercel: el público todavía no lo ve.
        </p>
      )}
      {error && (
        <p role="alert" className="font-ui text-xs text-wine-bright">
          {error}
        </p>
      )}
    </div>
  );
}
