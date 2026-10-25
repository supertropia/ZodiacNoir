"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Item = { id: string; title: string; priceArs: number | null; priceUsd: number | null };
type Result = { applied: boolean; updated: number; rate: number; items: Item[] };

// Pasa a dólares, de una sola vez, los productos que todavía tienen solo precio en pesos.
// Primero muestra la conversión propuesta; recién al confirmar se guardan los precios.
export function ConvertPricesToUsdButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const run = async (apply: boolean) => {
    if (loading) return;
    setLoading(true);
    setMessage("");
    setIsError(false);
    try {
      const res = await fetch("/api/admin/products/convert-usd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apply }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo convertir.");
      setResult(data);
      if (apply) {
        setMessage(`Listo: se guardó el precio en dólares de ${data.updated} productos.`);
        router.refresh();
      }
    } catch (err) {
      setIsError(true);
      setMessage(err instanceof Error ? err.message : "Algo salió mal.");
    } finally {
      setLoading(false);
    }
  };

  const convertible = result?.items.filter((i) => i.priceUsd).length ?? 0;
  const pending = result && !result.applied;

  return (
    <section className="mb-8 rounded-xl border border-gold/15 bg-noir-surface/40 p-5">
      <h2 className="font-display text-lg text-gold-pale">Pasar precios a dólares</h2>
      <p className="mt-1 font-ui text-xs leading-relaxed text-gold-dim">
        Convierte los productos que todavía tienen solo precio en pesos, usando el dólar blue de hoy y redondeando al dólar
        entero. Primero ves la propuesta y recién después se guarda. Los productos que ya tienen precio en dólares no se
        tocan, y puedes ajustar cualquier precio después desde Editar.
      </p>

      {(!result || result.applied) && (
        <button
          type="button"
          onClick={() => run(false)}
          disabled={loading}
          className="focus-ring mt-3 rounded-full border border-gold/40 px-4 py-2 font-ui text-xs uppercase tracking-wide text-gold transition hover:border-gold hover:bg-gold/10 disabled:opacity-40"
        >
          {loading ? "Calculando…" : "Ver conversión propuesta"}
        </button>
      )}

      {pending && (
        <div className="mt-4">
          {result.items.length === 0 ? (
            <p className="font-ui text-sm text-gold-pale">Todos los productos ya tienen precio en dólares.</p>
          ) : (
            <>
              <p className="font-ui text-xs text-gold-dim">
                Dólar blue de hoy: ARS {result.rate.toLocaleString("es-AR")} (sin el margen).
              </p>
              <ul className="mt-2 divide-y divide-gold/10 rounded-lg border border-gold/15">
                {result.items.map((i) => (
                  <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 font-ui text-sm">
                    <span className="text-gold-pale">{i.title}</span>
                    <span className="text-gold-dim">
                      {i.priceUsd ? (
                        <>
                          ARS {i.priceArs?.toLocaleString("es-AR")} → <strong className="text-gold">USD {i.priceUsd}</strong>
                        </>
                      ) : (
                        "Sin precio en pesos: cárgalo a mano"
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-3">
                {convertible > 0 && (
                  <button
                    type="button"
                    onClick={() => run(true)}
                    disabled={loading}
                    className="focus-ring rounded-full bg-gold px-5 py-2 font-ui text-xs font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright disabled:opacity-60"
                  >
                    {loading ? "Guardando…" : `Guardar ${convertible} precios en dólares`}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setMessage("");
                  }}
                  disabled={loading}
                  className="focus-ring rounded-full border border-gold/40 px-4 py-2 font-ui text-xs uppercase tracking-wide text-gold transition hover:bg-gold/10"
                >
                  Cancelar
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {message && (
        <p role="status" className={`mt-3 font-ui text-sm ${isError ? "text-wine-bright" : "text-gold"}`}>
          {message}
        </p>
      )}
    </section>
  );
}
