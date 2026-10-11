import type { Metadata } from "next";
import Link from "next/link";
import { ArticleCard } from "@/components/ArticleCard";
import { prisma, safeQuery } from "@/lib/prisma";
import { livePublicationFilter } from "@/lib/publication";
import { CATEGORIES } from "@/lib/categories";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Artículos",
  description: "Todos los artículos de Zodiac Noir sobre astrología, tarot y psicología astrológica.",
  alternates: { canonical: "/articulos" },
};

function FilterChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`focus-ring rounded-full border px-4 py-1.5 font-ui text-xs uppercase tracking-wide transition ${
        active
          ? "border-gold bg-gold text-noir-bg"
          : "border-gold/30 text-gold hover:border-gold hover:bg-gold/10"
      }`}
    >
      {children}
    </Link>
  );
}

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: { categoria?: string | string[] };
}) {
  const requested = Array.isArray(searchParams.categoria) ? searchParams.categoria[0] : searchParams.categoria;
  // Solo se aceptan categorías que existen; cualquier otro valor equivale a "Todos".
  const selected = CATEGORIES.find((c) => c.value === requested);

  const articles = await safeQuery(() =>
    prisma.article.findMany({
      where: selected
        ? { ...livePublicationFilter(), category: selected.value }
        : livePublicationFilter(),
      orderBy: { publishedAt: "desc" },
    })
  );

  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <p className="font-ui text-xs uppercase tracking-widest2 text-gold-dim">Archivo</p>
      <h1 className="mt-3 font-display text-4xl text-gold-pale">Artículos</h1>
      <p className="mt-4 max-w-2xl font-body text-lg text-gold-pale/80">
        Cada texto está firmado y revisado por un especialista en ejercicio. Usá el buscador del
        encabezado para encontrar un tema puntual.
      </p>

      <nav aria-label="Filtrar por categoría" className="mt-8 flex flex-wrap gap-2">
        <FilterChip href="/articulos" active={!selected}>
          Todos
        </FilterChip>
        {CATEGORIES.map((c) => (
          <FilterChip key={c.value} href={`/articulos?categoria=${c.value}`} active={selected?.value === c.value}>
            {c.label}
          </FilterChip>
        ))}
      </nav>

      {articles.length === 0 ? (
        <p className="mt-12 font-body text-lg text-gold-dim">
          {selected
            ? `Todavía no hay artículos en «${selected.label}».`
            : "Todavía no hay artículos publicados."}
        </p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <ArticleCard key={a.slug} article={a} />
          ))}
        </div>
      )}
    </section>
  );
}
