import { prisma } from "@/lib/prisma";
import { NewsletterComposer } from "@/components/admin/NewsletterComposer";
import { SubscribersTable, type SubscriberRow } from "@/components/admin/SubscribersTable";

export const dynamic = "force-dynamic";

// Cómo se muestra cada origen de suscripción en el panel.
const SOURCE_LABELS: Record<string, string> = {
  youtube: "YouTube",
  instagram: "Instagram",
  "web-portada": "Portada del sitio",
  "web-articulo": "Artículos del blog",
  "web-newsletter": "Página /newsletter (sin etiqueta)",
  "web-otra": "Otras páginas del sitio",
  "": "Anteriores a este registro",
};

function sourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? `Etiqueta: ${source}`;
}

// Plan gratuito de Resend: 100 correos por día. Con más suscriptores hay que pasar al plan Pro.
const FREE_DAILY_LIMIT = 100;

// Cuántos suscriptores se cargan en la lista (los más recientes primero).
const LIST_LIMIT = 5000;

export default async function AdminNewsletterPage() {
  let active = 0;
  let unsubscribed = 0;
  let sources: { source: string; total: number; recent: number }[] = [];
  let rows: SubscriberRow[] = [];
  try {
    [active, unsubscribed] = await Promise.all([
      prisma.subscriber.count({ where: { unsubscribedAt: null } }),
      prisma.subscriber.count({ where: { unsubscribedAt: { not: null } } }),
    ]);

    // Origen de los suscriptores activos: total y últimos 30 días.
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [byTotal, byRecent] = await Promise.all([
      prisma.subscriber.groupBy({ by: ["source"], where: { unsubscribedAt: null }, _count: { _all: true } }),
      prisma.subscriber.groupBy({
        by: ["source"],
        where: { unsubscribedAt: null, createdAt: { gte: since } },
        _count: { _all: true },
      }),
    ]);
    const recentBySource = new Map(byRecent.map((r) => [r.source ?? "", r._count._all]));
    sources = byTotal
      .map((r) => ({ source: r.source ?? "", total: r._count._all, recent: recentBySource.get(r.source ?? "") ?? 0 }))
      .sort((a, b) => b.total - a.total);

    const list = await prisma.subscriber.findMany({
      orderBy: { createdAt: "desc" },
      take: LIST_LIMIT,
      select: { email: true, createdAt: true, unsubscribedAt: true, source: true },
    });
    rows = list.map((s) => ({
      email: s.email,
      createdAt: s.createdAt.toISOString(),
      unsubscribedAt: s.unsubscribedAt ? s.unsubscribedAt.toISOString() : null,
      sourceLabel: sourceLabel(s.source ?? ""),
    }));
  } catch {
    // si falla la base de datos, se muestra en cero
  }

  return (
    <div>
      <h1 className="mb-2 font-display text-3xl text-gold-pale">Newsletter</h1>
      <p className="mb-8 font-ui text-sm text-gold-dim">
        Suscriptores activos: <span className="text-gold">{active}</span> · Bajas: {unsubscribed}
      </p>

      {active > FREE_DAILY_LIMIT - 10 && (
        <div role="note" className="mb-8 rounded-xl border border-gold/30 bg-gold/10 px-5 py-4 font-ui text-sm text-gold-pale">
          Ojo con el límite: el plan gratuito de Resend permite {FREE_DAILY_LIMIT} correos por día, y los correos de compras y
          contacto cuentan en el mismo límite. Con tantos suscriptores conviene pasar al plan Pro de Resend antes de enviar.
        </div>
      )}

      <section aria-labelledby="origen-subs" className="mb-10 rounded-xl border border-gold/25 bg-noir-surface/40 p-5">
        <h2 id="origen-subs" className="font-display text-xl text-gold-pale">¿De dónde vienen tus suscriptores?</h2>
        <p className="mt-1 font-ui text-xs text-gold-dim">
          Solo cuentan los activos. Para medir YouTube e Instagram usa los enlaces con etiqueta:
          zodiacnoirweb.com/newsletter?utm_source=youtube y zodiacnoirweb.com/newsletter?utm_source=instagram
        </p>
        {sources.length === 0 ? (
          <p className="mt-4 font-ui text-sm text-gold-pale">Todavía no hay suscriptores para mostrar.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[20rem] text-left font-ui text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-gold-dim">
                  <th className="py-2 pr-4 font-medium">Origen</th>
                  <th className="py-2 pr-4 text-right font-medium">Activos</th>
                  <th className="py-2 text-right font-medium">Últimos 30 días</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => (
                  <tr key={s.source || "sin-dato"} className="border-t border-gold/15 text-gold-pale">
                    <td className="py-2 pr-4">{sourceLabel(s.source)}</td>
                    <td className="py-2 pr-4 text-right">{s.total}</td>
                    <td className="py-2 text-right">{s.recent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <SubscribersTable rows={rows} truncated={active + unsubscribed > rows.length} />

      <NewsletterComposer active={active} />
    </div>
  );
}
