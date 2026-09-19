import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CancelMembershipButton } from "@/components/membership/CancelMembershipButton";

export const metadata = { title: "Mi cuenta" };
export const dynamic = "force-dynamic";

const ACTIVE_STATUSES = ["active", "on_trial"];

export default async function MiCuentaPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;

  if (!email) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16 text-center">
        <h1 className="font-display text-3xl text-gold-pale">Mi cuenta</h1>
        <p className="mt-4 font-body text-gold-pale/80">
          Iniciá sesión para ver el estado de tu membresía y tus compras.
        </p>
        <Link
          href="/ingresar"
          className="focus-ring mt-6 inline-block rounded-full bg-gold px-6 py-3 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  const [subscription, purchases] = await Promise.all([
    prisma.subscription.findUnique({ where: { email }, include: { plan: true } }),
    prisma.purchase.findMany({
      where: { email, status: "paid" },
      include: { product: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const isActive = !!subscription && ACTIVE_STATUSES.includes(subscription.status);

  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <h1 className="font-display text-3xl text-gold-pale">Mi cuenta</h1>
      <p className="mt-2 font-ui text-sm text-gold-dim">{email}</p>

      <section className="mt-10 rounded-2xl border border-gold/20 bg-noir-surface/50 p-7">
        <h2 className="font-display text-xl text-gold-pale">Membresía</h2>

        {isActive && subscription ? (
          <div className="mt-4">
            <p className="font-ui text-sm text-gold-pale/85">
              Sos miembro
              {subscription.plan ? (
                <>
                  {" "}
                  de <span className="text-gold">{subscription.plan.name}</span>
                </>
              ) : null}
              .
            </p>
            {subscription.renewsAt && (
              <p className="mt-1 font-ui text-xs text-gold-dim">
                Próxima renovación:{" "}
                {new Date(subscription.renewsAt).toLocaleDateString("es-AR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
            {subscription.provider === "mercadopago" ? (
              <CancelMembershipButton />
            ) : (
              <p className="mt-4 font-ui text-xs text-gold-dim">
                Tu membresía está gestionada por Lemon Squeezy. Para cancelarla, usá el link del mail de
                confirmación de tu suscripción, o escribinos desde{" "}
                <Link href="/contacto" className="text-gold underline">
                  contacto
                </Link>
                .
              </p>
            )}
          </div>
        ) : (
          <div className="mt-4">
            <p className="font-ui text-sm text-gold-pale/85">Todavía no sos miembro de Zodiac Noir Plus.</p>
            <Link
              href="/membresia"
              className="focus-ring mt-4 inline-block rounded-full bg-gold px-6 py-2.5 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright"
            >
              Sumarme
            </Link>
          </div>
        )}
      </section>

      <section className="mt-8 rounded-2xl border border-gold/20 bg-noir-surface/50 p-7">
        <h2 className="font-display text-xl text-gold-pale">Tus PDFs comprados</h2>
        {purchases.length === 0 ? (
          <p className="mt-4 font-ui text-sm text-gold-dim">Todavía no compraste ningún PDF.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {purchases.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 font-ui text-sm text-gold-pale/85">
                <span>{p.product.title}</span>
                {p.product.fileUrl ? (
                  <a href={p.product.fileUrl} className="shrink-0 text-gold underline hover:text-gold-bright">
                    Descargar
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
