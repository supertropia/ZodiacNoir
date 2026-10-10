import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DeleteArticleButton } from "@/components/admin/DeleteArticleButton";
import { formatPublicationDateTime, getPublicationStatus } from "@/lib/publication";

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

function ArticleRow({ article, now }: { article: ArticleRowData; now: Date }) {
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
        <p className="font-ui text-xs text-gold-dim">/articulos/{article.slug}</p>
        {status !== "draft" && article.publishedAt && (
          <p className="mt-1 font-ui text-xs text-gold-dim">
            {status === "scheduled" ? "Se publica: " : "Publicado: "}
            {formatPublicationDateTime(article.publishedAt)}
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

export default async function AdminDashboard() {
  const now = new Date();
  const articles = await prisma.article.findMany({
    orderBy: { updatedAt: "desc" },
  });

  // Programados: los que todavía no llegaron a su fecha, del más próximo al más lejano.
  const scheduled = articles
    .filter((a) => getPublicationStatus(a, now) === "scheduled")
    .sort((a, b) => (a.publishedAt?.getTime() ?? 0) - (b.publishedAt?.getTime() ?? 0));
  const rest = articles.filter((a) => getPublicationStatus(a, now) !== "scheduled");

  return (
    <div>
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

      {scheduled.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-1 font-display text-xl text-gold-pale">Próximas publicaciones</h2>
          <p className="mb-4 font-ui text-xs text-gold-dim">
            {scheduled.length} {scheduled.length === 1 ? "artículo programado" : "artículos programados"}, ordenados
            por fecha. Se publican solos a la hora indicada (hora de Argentina).
          </p>
          <div className="space-y-3">
            {scheduled.map((a) => (
              <ArticleRow key={a.id} article={a} now={now} />
            ))}
          </div>
        </section>
      )}

      {scheduled.length > 0 && rest.length > 0 && (
        <h2 className="mb-4 font-display text-xl text-gold-pale">Resto de los artículos</h2>
      )}

      <div className="space-y-3">
        {rest.map((a) => (
          <ArticleRow key={a.id} article={a} now={now} />
        ))}
      </div>
    </div>
  );
}
