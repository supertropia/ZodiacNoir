import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DeletePlanButton } from "@/components/admin/DeletePlanButton";
import { SyncMercadoPagoButton } from "@/components/admin/SyncMercadoPagoButton";
import { getUsdArsQuote } from "@/lib/exchange-rate";
import { estimateArs, formatArsAmount, formatUsdAmount } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function AdminPlansPage() {
  const plans = await prisma.membershipPlan.findMany({ orderBy: { createdAt: "desc" } });
  const quote = await getUsdArsQuote();

  // Cuántas suscripciones activas de Mercado Pago tiene cada plan (su cobro en pesos queda fijo hasta actualizarlo).
  const activeMp = await prisma.subscription.groupBy({
    by: ["planId"],
    where: { provider: "mercadopago", status: { in: ["active", "on_trial"] } },
    _count: { _all: true },
  });
  const activeByPlan = new Map(activeMp.map((row) => [row.planId, row._count._all]));

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl text-gold-pale">Planes de membresía</h1>
        <Link href="/admin/planes/nuevo"
          className="focus-ring rounded-full bg-gold px-5 py-2.5 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright">
          + Nuevo plan
        </Link>
      </div>

      {quote && (
        <p className="mb-6 rounded-xl border border-gold/15 bg-noir-surface/40 px-5 py-3 font-ui text-xs text-gold-dim">
          Dólar blue de hoy para los cobros en pesos: <span className="text-gold-pale">ARS {Math.round(quote.rate).toLocaleString("es-AR")}</span>{" "}
          (incluye el margen). Mercado Pago cobra una cantidad fija en pesos por suscripción: si el dólar se mueve mucho,
          usa «Actualizar cobros en Mercado Pago» en cada plan.
        </p>
      )}

      {plans.length === 0 && (
        <p className="font-body text-lg text-gold-dim">Todavía no creaste ningún plan.</p>
      )}

      <div className="space-y-3">
        {plans.map((p) => {
          const todayArs = estimateArs(p.priceUsd, quote?.rate);
          const activeCount = activeByPlan.get(p.id) ?? 0;
          return (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gold/15 bg-noir-surface/40 p-5">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  {p.featured && (
                    <span className="rounded-full bg-gold/20 px-2.5 py-0.5 font-ui text-xs uppercase tracking-wide text-gold">
                      Destacado
                    </span>
                  )}
                  <span className="font-ui text-xs uppercase tracking-wide text-gold-dim">{p.interval === "mes" ? "Mensual" : "Anual"}</span>
                </div>
                <h3 className="font-display text-lg text-gold-pale">
                  {p.name} · {p.priceUsd ? formatUsdAmount(p.priceUsd) : p.priceLabel}
                </h3>
                {p.priceUsd ? (
                  <p className="font-ui text-xs text-gold-dim">
                    Hoy en pesos: {todayArs ? formatArsAmount(todayArs) : "sin cotización"} · {activeCount}{" "}
                    {activeCount === 1 ? "suscripción activa" : "suscripciones activas"} en Mercado Pago
                  </p>
                ) : (
                  <p className="font-ui text-xs text-gold-dim">Sin precio en USD: edita el plan para cargarlo.</p>
                )}
                {p.lemonVariantId && <p className="font-ui text-xs text-gold-dim">variant: {p.lemonVariantId}</p>}
              </div>
              <div className="flex flex-wrap items-start gap-3">
                {p.priceUsd ? (
                  <SyncMercadoPagoButton planId={p.id} activeCount={activeCount} amountArs={todayArs} />
                ) : null}
                <Link href={`/admin/planes/${p.id}`}
                  className="focus-ring rounded-full border border-gold/40 px-4 py-2 font-ui text-xs uppercase tracking-wide text-gold transition hover:border-gold hover:bg-gold/10">
                  Editar
                </Link>
                <DeletePlanButton id={p.id} name={p.name} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
