import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DeleteArticleButton } from "@/components/admin/DeleteArticleButton";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const articles = await prisma.article.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
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

      <div className="space-y-3">
        {articles.map((a) => (
          <div
            key={a.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gold/15 bg-noir-surface/40 p-5"
          >
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 font-ui text-xs uppercase tracking-wide ${
                    a.published ? "bg-green-800/40 text-green-300" : "bg-gold/15 text-gold-dim"
                  }`}
                >
                  {a.published ? "Publicado" : "Borrador"}
                </span>
                <span className="font-ui text-xs uppercase tracking-wide text-gold-dim">{a.category}</span>
              </div>
              <h3 className="font-display text-lg text-gold-pale">{a.title}</h3>
              <p className="font-ui text-xs text-gold-dim">/articulos/{a.slug}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/admin/articulos/${a.id}`}
                className="focus-ring rounded-full border border-gold/40 px-4 py-2 font-ui text-xs uppercase tracking-wide text-gold transition hover:border-gold hover:bg-gold/10"
              >
                Editar
              </Link>
              <DeleteArticleButton id={a.id} title={a.title} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
