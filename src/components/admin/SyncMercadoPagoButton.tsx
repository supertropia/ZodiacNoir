"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Ajusta el cobro mensual en pesos de las suscripciones activas de Mercado Pago de un plan
// al dólar blue de hoy. Se usa cuando el dólar se movió y quieres actualizar los cobros.
export function SyncMercadoPagoButton({
  planId,
  activeCount,
  amountArs,
}: {
  planId: string;
  activeCount: number;
  amountArs: number | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const onClick = async () => {
    if (loading) return;
    const amountText = amountArs ? `ARS ${amountArs.toLocaleString("es-AR")}` : "el monto de hoy";
    if (
      !window.confirm(
        `¿Actualizar a ${amountText} por mes el cobro de las ${activeCount} suscripciones activas de Mercado Pago? Se aplica desde el próximo cobro de cada persona.`
      )
    ) {
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/plans/${planId}/sync-mp`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo actualizar.");
      setIsError(data.failed > 0);
      setMessage(
        data.failed > 0
          ? `Se actualizaron ${data.updated} de ${data.total}. ${data.failed} no se pudieron cambiar (puede ser un límite de Mercado Pago): inténtalo más tarde.`
          : `Listo: ${data.updated} suscripciones ahora cobran ARS ${Number(data.amountArs).toLocaleString("es-AR")} por mes.`
      );
      router.refresh();
    } catch (err) {
      setIsError(true);
      setMessage(err instanceof Error ? err.message : "Algo salió mal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={loading || activeCount === 0}
        className="focus-ring rounded-full border border-gold/40 px-4 py-2 font-ui text-xs uppercase tracking-wide text-gold transition hover:border-gold hover:bg-gold/10 disabled:opacity-40"
      >
        {loading ? "Actualizando…" : "Actualizar cobros en Mercado Pago"}
      </button>
      {message && (
        <p role="status" className={`mt-2 max-w-xs font-ui text-xs ${isError ? "text-wine-bright" : "text-gold"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
