import type { Metadata } from "next";
import { ArticleCard } from "@/components/ArticleCard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Artículos",
  description: "Todos los artículos de Zodiac Noir sobre astrología, tarot y psicología astrológica.",
};

export default async function ArticlesPage() {
  const articles = await prisma.article.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <p className="font-ui text-xs uppercase tracking-widest2 text-gold-dim">Archivo</p>
      <h1 className="mt-3 font-display text-4xl text-gold-pale">Artículos</h1>
      <p className="mt-4 max-w-2xl font-body text-lg text-gold-pale/80">
        Cada texto está firmado y revisado por un especialista en ejercicio. Usá el buscador del
        encabezado para encontrar un tema puntual.
      </p>

      {articles.length === 0 ? (
        <p className="mt-12 font-body text-lg text-gold-dim">Todavía no hay artículos publicados.</p>
      ) : (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <ArticleCard key={a.slug} article={a} />
          ))}
        </div>
      )}
    </section>
  );
}
