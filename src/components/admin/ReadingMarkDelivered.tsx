"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Botón del panel: marca el pedido como entregado (o lo devuelve a «por entregar» si te equivocaste).
// No sube archivos ni manda correos: la lectura se envía desde tu propio correo.
export function ReadingMarkDelivered({ orderId, delivered }: { orderId: string; delivered: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onClick = async () => {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/lecturas/${orderId}/mark-delivered`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ undo: delivered }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo actualizar el pedido.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className={`focus-ring shrink-0 rounded-full px-6 py-2.5 font-ui text-xs font-medium uppercase tracking-wide transition disabled:opacity-50 ${
          delivered
            ? "border border-gold/50 text-gold hover:bg-gold/10"
            : "bg-gold text-noir-bg hover:bg-gold-bright"
        }`}
      >
        {loading ? "Guardando…" : delivered ? "Deshacer: volver a «por entregar»" : "Marcar como entregada"}
      </button>
      {error && (
        <p role="alert" className="font-ui text-xs text-wine-bright">
          {error}
        </p>
      )}
    </div>
  );
}
