import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DeletePlanButton } from "@/components/admin/DeletePlanButton";

export const dynamic = "force-dynamic";

export default async function AdminPlansPage() {
  const plans = await prisma.membershipPlan.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl text-gold-pale">Planes de membresía</h1>
        <Link href="/admin/planes/nuevo"
          className="focus-ring rounded-full bg-gold px-5 py-2.5 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright">
          + Nuevo plan
        </Link>
      </div>

      {plans.length === 0 && (
        <p className="font-body text-lg text-gold-dim">Todavía no creaste ningún plan.</p>
      )}

      <div className="space-y-3">
        {plans.map((p) => (
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
              <h3 className="font-display text-lg text-gold-pale">{p.name} · {p.priceLabel}</h3>
              <p className="font-ui text-xs text-gold-dim">variant: {p.lemonVariantId}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href={`/admin/planes/${p.id}`}
                className="focus-ring rounded-full border border-gold/40 px-4 py-2 font-ui text-xs uppercase tracking-wide text-gold transition hover:border-gold hover:bg-gold/10">
                Editar
              </Link>
              <DeletePlanButton id={p.id} name={p.name} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
