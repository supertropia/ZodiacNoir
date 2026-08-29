import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasActiveMembership } from "@/lib/membership";
import { buildCheckoutUrl } from "@/lib/lemonsqueezy";

export const metadata = {
  title: "Membresía",
  description: "Sumate a Zodiac Noir Plus: artículos exclusivos, efemérides ampliadas y PDFs incluidos.",
  alternates: { canonical: "/membresia" },
};

export const dynamic = "force-dynamic";

export default async function MembresiaPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  const isMember = await hasActiveMembership(email);
  const plans = await prisma.membershipPlan.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="mx-auto max-w-5xl px-5 py-16">
      <p className="font-ui text-xs uppercase tracking-widest2 text-gold-dim">Membresía</p>
      <h1 className="mt-2 font-display text-4xl text-gold-pale">Zodiac Noir Plus</h1>
      <p className="mt-4 max-w-2xl font-body text-lg text-gold-pale/85">
        Contenido exclusivo, efemérides ampliadas con tránsitos personalizados y descuentos en
        todos los PDFs de la tienda. Cancelás cuando quieras.
      </p>

      {isMember && (
        <div className="mt-6 rounded-xl border border-gold/30 bg-gold/10 px-5 py-4 font-ui text-sm text-gold">
          Ya sos miembro de Zodiac Noir Plus. Gracias por tu apoyo ✦
        </div>
      )}

      {plans.length === 0 && (
        <div className="mt-10 rounded-xl border border-gold/20 bg-noir-surface/50 p-6 font-ui text-sm text-gold-dim">
          Todavía no cargaste ningún plan. Creá tus productos de membresía en Lemon Squeezy y
          agregalos a la tabla <code>MembershipPlan</code> (vía Prisma Studio, por ejemplo) con
          el <code>lemonVariantId</code> de cada variante.
        </div>
      )}

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {plans.map((plan) => {
          const checkoutUrl = buildCheckoutUrl(plan.lemonVariantId, {
            email: email ?? undefined,
            redirectPath: "/membresia?bienvenido=1",
          });
          const benefits = plan.benefits.split("|").filter(Boolean);

          return (
            <div
              key={plan.id}
              className={`rounded-2xl border p-7 ${
                plan.featured ? "border-gold bg-gold/5" : "border-gold/20 bg-noir-surface/50"
              }`}
            >
              {plan.featured && (
                <p className="mb-2 font-ui text-xs uppercase tracking-wide text-gold">Recomendado</p>
              )}
              <h2 className="font-display text-2xl text-gold-pale">{plan.name}</h2>
              <p className="mt-1 font-ui text-2xl text-gold">{plan.priceLabel}</p>
              <p className="mt-3 font-body text-base text-gold-pale/80">{plan.description}</p>
              <ul className="mt-5 space-y-2 font-ui text-sm text-gold-pale/85">
                {benefits.map((b) => (
                  <li key={b} className="flex gap-2">
                    <span className="text-gold">✦</span> {b}
                  </li>
                ))}
              </ul>
              {checkoutUrl ? (
                
                 <a href={checkoutUrl}
                  className="focus-ring mt-6 inline-block w-full rounded-full bg-gold px-6 py-3 text-center font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright"
                >
                  Sumarme
                </a>
              ) : (
                <p className="mt-6 font-ui text-xs text-gold-dim">
                  Falta configurar la variable de entorno LEMONSQUEEZY_STORE.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
