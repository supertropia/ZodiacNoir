import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ReadingMarkDelivered } from "@/components/admin/ReadingMarkDelivered";
import { ReadingsVisibilityToggle } from "@/components/admin/ReadingsVisibilityToggle";
import { getReadingsEnabled } from "@/lib/site-settings";
import {
  READING_DELIVERY_HOURS,
  READING_DELIVERY_WINDOW,
  READING_STATUS_LABELS,
  formatArgentinaDateTime,
  formatArs,
  formatBirthDate,
  formatUsd,
  getBirthTimeLabel,
  getFocusLabel,
  getReadingService,
} from "@/lib/lecturas";

export const metadata = { title: "Lecturas · Panel" };
export const dynamic = "force-dynamic";

type Order = Awaited<ReturnType<typeof prisma.readingOrder.findMany>>[number];

function timeLeft(deliverBy: Date | null, now: Date): { text: string; tone: "late" | "soon" | "ok" } {
  if (!deliverBy) return { text: "", tone: "ok" };
  const ms = deliverBy.getTime() - now.getTime();
  const hours = Math.abs(ms) / 3600000;
  const label = hours >= 1 ? `${Math.floor(hours)} h ${Math.round((hours % 1) * 60)} min` : `${Math.round(hours * 60)} min`;
  if (ms < 0) return { text: `Atrasada ${label}`, tone: "late" };
  return { text: `Faltan ${label}`, tone: ms < 6 * 3600000 ? "soon" : "ok" };
}

const toneClass = {
  late: "border-wine-bright/60 bg-wine/15 text-wine-bright",
  soon: "border-gold bg-gold/15 text-gold-bright",
  ok: "border-gold/30 bg-gold/5 text-gold-pale",
} as const;

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[9rem_1fr] sm:gap-3">
      <dt className="font-ui text-xs uppercase tracking-wide text-gold-dim">{label}</dt>
      <dd className="font-ui text-sm text-gold-pale/90">{value}</dd>
    </div>
  );
}

function OrderCard({ order, now }: { order: Order; now: Date }) {
  const service = getReadingService(order.service);
  const left = order.status === "paid" ? timeLeft(order.deliverBy, now) : null;

  return (
    <article className="rounded-2xl border border-gold/25 bg-noir-surface/50 p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg text-gold-pale">{service?.name ?? order.service}</h3>
          <p className="mt-0.5 font-ui text-sm text-gold-pale/85">
            {order.name} · <a href={`mailto:${order.email}`} className="text-gold underline">{order.email}</a>
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="rounded-full border border-gold/40 px-3 py-1 font-ui text-xs uppercase tracking-wide text-gold">
            {READING_STATUS_LABELS[order.status] ?? order.status}
          </span>
          {left && (
            <span className={`rounded-full border px-3 py-1 font-ui text-xs ${toneClass[left.tone]}`}>{left.text}</span>
          )}
        </div>
      </header>

      <dl className="mt-5 space-y-2.5">
        <Row label="Nació" value={`${formatBirthDate(order.birthDate)} · ${getBirthTimeLabel(order.birthTimeMode, order.birthTime)}`} />
        <Row label="Lugar" value={order.birthPlace} />
        {order.service === "revolucion-solar" && (
          <Row label="Revolución" value={`Año ${order.solarYear ?? "—"} · en ${order.solarPlace ?? "—"}`} />
        )}
        <Row label="Profundizar" value={getFocusLabel(order.focus)} />
        <Row
          label="Pago"
          value={`${formatUsd(order.priceUsd)} = ${formatArs(order.priceArs)} (cotización ${order.exchangeRate.toLocaleString("es-AR", { maximumFractionDigits: 2 })})`}
        />
        {order.paidAt && <Row label="Pagado" value={formatArgentinaDateTime(order.paidAt)} />}
        {order.deliverBy && order.status === "paid" && <Row label="Entregar antes de" value={formatArgentinaDateTime(order.deliverBy)} />}
        {order.deliveredAt && <Row label="Entregado" value={formatArgentinaDateTime(order.deliveredAt)} />}
        {order.mercadoPagoPaymentId && <Row label="Pago en MP" value={order.mercadoPagoPaymentId} />}
      </dl>

      {order.about && (
        <div className="mt-5 rounded-xl border border-gold/15 bg-noir-bg/40 p-4">
          <p className="font-ui text-xs uppercase tracking-wide text-gold-dim">Sobre la persona</p>
          <p className="mt-2 whitespace-pre-line font-body text-base leading-relaxed text-gold-pale/90">{order.about}</p>
        </div>
      )}

      {(order.status === "paid" || order.status === "delivered") && (
        <div className="mt-5 border-t border-gold/15 pt-4">
          <p className="font-ui text-xs text-gold-dim">
            {order.status === "delivered"
              ? "La lectura figura como entregada."
              : "Envía la lectura desde tu correo y, después, márcala como entregada."}
          </p>
          <ReadingMarkDelivered orderId={order.id} delivered={order.status === "delivered"} />
        </div>
      )}
    </article>
  );
}

export default async function AdminLecturasPage() {
  const now = new Date();
  const orders = await prisma.readingOrder.findMany({ orderBy: { createdAt: "desc" }, take: 300 });
  const readingsEnabled = await getReadingsEnabled();

  const toDeliver = orders
    .filter((o) => o.status === "paid")
    .sort((a, b) => (a.deliverBy?.getTime() ?? 0) - (b.deliverBy?.getTime() ?? 0));
  const delivered = orders.filter((o) => o.status === "delivered");
  const unpaid = orders.filter((o) => o.status === "pending" || o.status === "cancelled");
  const refunded = orders.filter((o) => o.status === "refunded");

  return (
    <div className="space-y-12">
      <header>
        <h1 className="font-display text-3xl text-gold-pale">Lecturas</h1>
        <p className="mt-2 max-w-2xl font-body text-lg text-gold-pale/80">
          Pedidos de carta natal y revolución solar. El plazo prometido a la clienta es de {READING_DELIVERY_WINDOW} desde la
          confirmación del pago; la fecha límite de cada pedido es a las {READING_DELIVERY_HOURS} horas. Los pedidos aparecen
          ordenados por el que vence primero. La lectura la envías tú desde tu correo; después, marca el pedido como entregado
          para que salga de la lista.
        </p>
      </header>

      <section
        className={`rounded-2xl border p-6 ${readingsEnabled ? "border-gold/40 bg-gold/5" : "border-gold/25 bg-noir-surface/50"}`}
      >
        <p className="font-ui text-xs uppercase tracking-widest2 text-gold-dim">Visibilidad en el sitio</p>
        <h2 className="mt-1 font-display text-xl text-gold-pale">
          {readingsEnabled ? "Las lecturas están publicadas" : "Las lecturas están ocultas"}
        </h2>
        <p className="mt-2 max-w-2xl font-ui text-sm leading-relaxed text-gold-pale/80">
          {readingsEnabled
            ? "Cualquier persona puede ver la página de lecturas y pedirlas. Aparecen en el menú, el pie de página, la portada y el mapa del sitio."
            : "El público no ve las lecturas en ningún lado (menú, pie de página, portada ni mapa del sitio) y la página /lecturas muestra «Próximamente». Nadie puede pedirlas ni pagarlas. Tú sí puedes ver la página completa para probarla."}
        </p>
        <ReadingsVisibilityToggle enabled={readingsEnabled} />
        <p className="mt-4 font-ui text-xs text-gold-dim">
          Los pedidos que ya estén pagados siguen apareciendo aquí aunque ocultes las lecturas.{" "}
          <Link href="/lecturas" className="text-gold underline">
            Ver la página de lecturas
          </Link>
        </p>
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl text-gold-pale">Por entregar ({toDeliver.length})</h2>
        {toDeliver.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gold/25 px-5 py-6 font-ui text-sm text-gold-dim">
            No hay lecturas pendientes.
          </p>
        ) : (
          <div className="space-y-5">
            {toDeliver.map((o) => (
              <OrderCard key={o.id} order={o} now={now} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl text-gold-pale">Entregadas ({delivered.length})</h2>
        {delivered.length === 0 ? (
          <p className="font-ui text-sm text-gold-dim">Todavía no entregaste ninguna.</p>
        ) : (
          <div className="space-y-5">
            {delivered.map((o) => (
              <OrderCard key={o.id} order={o} now={now} />
            ))}
          </div>
        )}
      </section>

      {refunded.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-xl text-gold-pale">Devueltas ({refunded.length})</h2>
          <div className="space-y-5">
            {refunded.map((o) => (
              <OrderCard key={o.id} order={o} now={now} />
            ))}
          </div>
        </section>
      )}

      <details className="group rounded-2xl border border-gold/20">
        <summary className="focus-ring flex cursor-pointer list-none items-center justify-between rounded-2xl px-5 py-4 font-ui text-sm text-gold-pale/85 [&::-webkit-details-marker]:hidden">
          <span>Sin pagar ({unpaid.length}) · personas que no terminaron el pago</span>
          <span aria-hidden="true" className="text-xl text-gold transition group-open:rotate-45">+</span>
        </summary>
        <div className="space-y-5 px-5 pb-5">
          {unpaid.length === 0 ? (
            <p className="font-ui text-sm text-gold-dim">Nada por acá.</p>
          ) : (
            unpaid.map((o) => <OrderCard key={o.id} order={o} now={now} />)
          )}
        </div>
      </details>
    </div>
  );
}
