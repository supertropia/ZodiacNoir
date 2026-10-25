import Link from "next/link";
import type { Metadata } from "next";
import { prisma, safeQuery } from "@/lib/prisma";
import { AutoRefresh } from "@/components/lecturas/AutoRefresh";
import {
  READING_DELIVERY_WINDOW,
  formatArgentinaDateTime,
  getReadingService,
} from "@/lib/lecturas";

export const metadata: Metadata = {
  title: "Tu pedido de lectura",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// Oculta parte del correo: la página se abre con el número de pedido y no debe revelar datos de más.
function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return "tu correo";
  const visible = user.slice(0, 2);
  return `${visible}${"•".repeat(Math.max(user.length - 2, 2))}@${domain}`;
}

export default async function LecturaGraciasPage({
  searchParams,
}: {
  searchParams: { pedido?: string; estado?: string };
}) {
  const orderId = typeof searchParams?.pedido === "string" ? searchParams.pedido : "";
  const order = orderId
    ? await safeQuery(() => prisma.readingOrder.findUnique({ where: { id: orderId } }))
    : null;

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="font-display text-3xl text-gold-pale">No encontramos tu pedido</h1>
        <p className="mt-4 font-body text-lg text-gold-pale/85">
          Si acabas de pagar, escríbenos desde contacto con el correo que usaste y lo revisamos enseguida.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/contacto"
            className="focus-ring rounded-full bg-gold px-6 py-3 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright"
          >
            Ir a contacto
          </Link>
          <Link
            href="/lecturas"
            className="focus-ring rounded-full border border-gold/50 px-6 py-3 font-ui text-sm font-medium uppercase tracking-wide text-gold transition hover:border-gold hover:bg-gold/10"
          >
            Volver a Lecturas
          </Link>
        </div>
      </div>
    );
  }

  const service = getReadingService(order.service);
  const serviceName = service?.name ?? "Lectura";
  const paid = order.status === "paid" || order.status === "delivered";
  const waiting = order.status === "pending" || order.status === "cancelled";

  return (
    <div className="mx-auto max-w-2xl px-5 py-16 sm:py-20">
      {waiting && <AutoRefresh />}

      <p className="text-center font-ui text-xs uppercase tracking-widest2 text-gold-dim">{serviceName}</p>

      {paid ? (
        <>
          <h1 className="mt-3 text-center font-display text-3xl leading-tight text-gold-pale sm:text-4xl">
            {order.status === "delivered" ? "Tu lectura ya fue enviada" : "¡Gracias! Recibimos tu pago"}
          </h1>

          <div className="mt-8 rounded-2xl border border-gold/30 bg-noir-surface/50 p-7 text-center">
            {order.status === "delivered" ? (
              <>
                <p className="font-body text-lg leading-relaxed text-gold-pale/90">
                  Te la enviamos a <strong className="text-gold-pale">{maskEmail(order.email)}</strong>. Si no la ves,
                  revisa la carpeta de spam o correo no deseado.
                </p>
                <Link
                  href="/mi-cuenta"
                  className="focus-ring mt-5 inline-block rounded-full bg-gold px-6 py-3 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright"
                >
                  Ver en Mi cuenta
                </Link>
              </>
            ) : (
              <>
                <p className="font-body text-lg leading-relaxed text-gold-pale/90">
                  Tu lectura está en preparación. La recibirás en PDF en{" "}
                  <strong className="text-gold-pale">{maskEmail(order.email)}</strong> en un plazo de {READING_DELIVERY_WINDOW}{" "}
                  desde la confirmación del pago.
                </p>
                {order.deliverBy && (
                  <p className="mt-4 font-ui text-sm text-gold">
                    A más tardar: {formatArgentinaDateTime(order.deliverBy)} (hora de Argentina)
                  </p>
                )}
              </>
            )}
          </div>

          <p className="mt-6 text-center font-ui text-xs leading-relaxed text-gold-dim">
            También te enviamos un correo de confirmación con el resumen de tus datos. Si algo no está bien, responde ese
            correo o escríbenos desde{" "}
            <Link href="/contacto" className="text-gold underline">
              contacto
            </Link>
            .
          </p>
        </>
      ) : waiting ? (
        <>
          <h1 className="mt-3 text-center font-display text-3xl leading-tight text-gold-pale sm:text-4xl">
            Estamos confirmando tu pago
          </h1>
          <div className="mt-8 rounded-2xl border border-gold/30 bg-noir-surface/50 p-7 text-center" role="status">
            <p className="font-body text-lg leading-relaxed text-gold-pale/90">
              {searchParams?.estado === "pendiente"
                ? "Tu pago está pendiente de acreditación. Puede tardar un poco según el medio de pago que usaste."
                : "Tu medio de pago nos avisa apenas el pago se acredita; suele tardar unos segundos."}{" "}
              Esta página se actualiza sola. No hace falta que hagas nada más.
            </p>
            <p className="mt-4 font-ui text-xs text-gold-dim">
              Cuando se confirme, te enviamos un correo a {maskEmail(order.email)}.
            </p>
          </div>
        </>
      ) : (
        <>
          <h1 className="mt-3 text-center font-display text-3xl leading-tight text-gold-pale sm:text-4xl">
            Este pedido fue devuelto
          </h1>
          <p className="mt-6 text-center font-body text-lg text-gold-pale/85">
            Si tienes dudas, escríbenos desde{" "}
            <Link href="/contacto" className="text-gold underline">
              contacto
            </Link>
            .
          </p>
        </>
      )}

      <div className="mt-10 text-center">
        <Link href="/" className="font-ui text-sm text-gold hover:text-gold-bright">
          ← Volver al inicio
        </Link>
      </div>
    </div>
  );
}
