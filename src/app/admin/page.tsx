import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DeleteArticleButton } from "@/components/admin/DeleteArticleButton";
import { formatPublicationDateTime, getPublicationStatus } from "@/lib/publication";
import { getViewStats, type ArticleViewStats } from "@/lib/views";

export const dynamic = "force-dynamic";

type ArticleRowData = {
  id: string;
  title: string;
  slug: string;
  category: string;
  published: boolean;
  publishedAt: Date | null;
};

const STATUS_STYLES = {
  draft: { label: "Borrador", className: "bg-gold/15 text-gold-dim" },
  scheduled: { label: "Programado", className: "bg-gold/25 text-gold-bright" },
  published: { label: "Publicado", className: "bg-green-800/40 text-green-300" },
} as const;

const NUMBER_FORMAT = new Intl.NumberFormat("es-AR");

function ArticleRow({
  article,
  now,
  stats,
}: {
  article: ArticleRowData;
  now: Date;
  stats?: ArticleViewStats;
}) {
  const status = getPublicationStatus(article, now);
  const style = STATUS_STYLES[status];

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gold/15 bg-noir-surface/40 p-5">
      <div>
        <div className="mb-1 flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 font-ui text-xs uppercase tracking-wide ${style.className}`}>
            {style.label}
          </span>
          <span className="font-ui text-xs uppercase tracking-wide text-gold-dim">{article.category}</span>
        </div>
        <h3 className="font-display text-lg text-gold-pale">{article.title}</h3>
        <p className="font-ui text-xs text-gold-dim">/blog/{article.slug}</p>
        {status !== "draft" && article.publishedAt && (
          <p className="mt-1 font-ui text-xs text-gold-dim">
            {status === "scheduled" ? "Se publica: " : "Publicado: "}
            {formatPublicationDateTime(article.publishedAt)}
          </p>
        )}
        {status === "published" && (
          <p className="mt-1 font-ui text-xs text-gold-pale/80">
            <span className="text-gold">{NUMBER_FORMAT.format(stats?.total ?? 0)}</span>{" "}
            {(stats?.total ?? 0) === 1 ? "vista" : "vistas"} en total ·{" "}
            <span className="text-gold">{NUMBER_FORMAT.format(stats?.last7 ?? 0)}</span> en los últimos 7 días ·{" "}
            <span className="text-gold">{NUMBER_FORMAT.format(stats?.last30 ?? 0)}</span> en los últimos 30
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Link
          href={`/admin/articulos/${article.id}`}
          className="focus-ring rounded-full border border-gold/40 px-4 py-2 font-ui text-xs uppercase tracking-wide text-gold transition hover:border-gold hover:bg-gold/10"
        >
          Editar
        </Link>
        <DeleteArticleButton id={article.id} title={article.title} />
      </div>
    </div>
  );
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams?: { guardado?: string };
}) {
  const now = new Date();
  const articles = await prisma.article.findMany({
    orderBy: { updatedAt: "desc" },
  });
  const viewStats = await getViewStats(now);

  // Los 5 artículos más leídos de los últimos 30 días (solo los que ya tuvieron vistas).
  const topArticles = articles
    .filter((a) => (viewStats.get(a.id)?.last30 ?? 0) > 0)
    .sort((a, b) => (viewStats.get(b.id)?.last30 ?? 0) - (viewStats.get(a.id)?.last30 ?? 0))
    .slice(0, 5);

  // Programados: los que todavía no llegaron a su fecha, del más próximo al más lejano.
  const scheduled = articles
    .filter((a) => getPublicationStatus(a, now) === "scheduled")
    .sort((a, b) => (a.publishedAt?.getTime() ?? 0) - (b.publishedAt?.getTime() ?? 0));
  const rest = articles.filter((a) => getPublicationStatus(a, now) !== "scheduled");

  // Confirmación del último guardado: se arma con lo que realmente hay en la base de datos.
  const savedId = typeof searchParams?.guardado === "string" ? searchParams.guardado : "";
  const savedArticle = savedId ? articles.find((a) => a.id === savedId) : undefined;
  const savedStatus = savedArticle ? getPublicationStatus(savedArticle, now) : null;

  return (
    <div>
      {savedId && savedArticle && savedStatus && (
        <div
          role="status"
          className="mb-8 rounded-xl border border-green-800/50 bg-green-900/20 px-5 py-4 font-ui text-sm text-green-300"
        >
          <strong className="font-medium">Guardado. </strong>
          {savedStatus === "draft" && <>«{savedArticle.title}» quedó como borrador.</>}
          {savedStatus === "scheduled" && savedArticle.publishedAt && (
            <>
              «{savedArticle.title}» quedó programado para el {formatPublicationDateTime(savedArticle.publishedAt)} (hora de
              Argentina). Lo encuentras en el desplegable «Próximas publicaciones».
            </>
          )}
          {savedStatus === "published" && <>«{savedArticle.title}» está publicado.</>}
        </div>
      )}
      {savedId && !savedArticle && (
        <div
          role="alert"
          className="mb-8 rounded-xl border border-wine/50 bg-wine/10 px-5 py-4 font-ui text-sm text-wine-bright"
        >
          <strong className="font-medium">Atención: </strong>
          el servidor confirmó el guardado, pero ese artículo no aparece en la base de datos. Anota la hora exacta y revisa
          los registros (logs) de Vercel antes de seguir.
        </div>
      )}
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <Link href="/admin/planes" className="rounded-xl border border-gold/15 bg-noir-surface/40 p-5 transition hover:border-gold/40">
          <p className="font-ui text-xs uppercase tracking-wide text-gold-dim">Monetización</p>
          <h2 className="mt-1 font-display text-xl text-gold-pale">Planes de membresía →</h2>
        </Link>
        <Link href="/admin/productos" className="rounded-xl border border-gold/15 bg-noir-surface/40 p-5 transition hover:border-gold/40">
          <p className="font-ui text-xs uppercase tracking-wide text-gold-dim">Monetización</p>
          <h2 className="mt-1 font-display text-xl text-gold-pale">Productos (PDFs) →</h2>
        </Link>
      </div>

      {topArticles.length > 0 && (
        <section className="mb-8 rounded-xl border border-gold/15 bg-noir-surface/40 p-5">
          <h2 className="font-display text-lg text-gold-pale">Más leídos · últimos 30 días</h2>
          <ol className="mt-3 space-y-1.5">
            {topArticles.map((a, i) => (
              <li key={a.id} className="flex items-baseline justify-between gap-4 font-ui text-sm">
                <span className="truncate text-gold-pale/90">
                  <span className="mr-2 text-gold-dim">{i + 1}.</span>
                  {a.title}
                </span>
                <span className="shrink-0 text-gold">
                  {NUMBER_FORMAT.format(viewStats.get(a.id)?.last30 ?? 0)}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl text-gold-pale">Artículos</h1>
        <Link
          href="/admin/articulos/nuevo"
          className="focus-ring rounded-full bg-gold px-5 py-2.5 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright"
        >
          + Nuevo artículo
        </Link>
      </div>

      {articles.length === 0 && (
        <p className="font-body text-lg text-gold-dim">Todavía no creaste ningún artículo.</p>
      )}

      {/* Desplegable con todo lo programado. Siempre se muestra (aunque esté vacío) para que se sepa dónde mirar. */}
      <details open className="group mb-10 rounded-xl border border-gold/20 bg-noir-surface/30">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
          <span className="flex flex-wrap items-center gap-3">
            <span aria-hidden="true" className="text-gold transition-transform group-open:rotate-90">
              ▸
            </span>
            <span className="font-display text-xl text-gold-pale">Próximas publicaciones</span>
            <span className="rounded-full bg-gold/25 px-2.5 py-0.5 font-ui text-xs uppercase tracking-wide text-gold-bright">
              {scheduled.length} {scheduled.length === 1 ? "programado" : "programados"}
            </span>
          </span>
          {scheduled[0]?.publishedAt && (
            <span className="hidden font-ui text-xs text-gold-dim sm:block">
              Próximo: {formatPublicationDateTime(scheduled[0].publishedAt)}
            </span>
          )}
        </summary>
        <div className="space-y-3 border-t border-gold/15 p-5">
          {scheduled.length === 0 ? (
            <p className="font-ui text-sm text-gold-dim">
              No hay artículos programados. Al elegir una fecha futura y pulsar «Programar publicación», aparecerán acá.
            </p>
          ) : (
            <>
              <p className="font-ui text-xs text-gold-dim">
                Ordenados por fecha. Se publican solos a la hora indicada (hora de Argentina).
              </p>
              {scheduled.map((a) => (
                <ArticleRow key={a.id} article={a} now={now} stats={viewStats.get(a.id)} />
              ))}
            </>
          )}
        </div>
      </details>

      {scheduled.length > 0 && rest.length > 0 && (
        <h2 className="mb-4 font-display text-xl text-gold-pale">Resto de los artículos</h2>
      )}

      <div className="space-y-3">
        {rest.map((a) => (
          <ArticleRow key={a.id} article={a} now={now} stats={viewStats.get(a.id)} />
        ))}
      </div>
    </div>
  );
}
