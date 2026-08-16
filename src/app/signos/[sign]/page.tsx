import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { signs, getSign } from "@/data/signs";
import { prisma, safeQuery } from "@/lib/prisma";
import { ArticleCard } from "@/components/ArticleCard";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { sign: string } }): Metadata {
  const sign = getSign(params.sign);
  if (!sign) return {};
  return { title: sign.name, description: sign.summary };
}

export default async function SignPage({ params }: { params: { sign: string } }) {
  const sign = getSign(params.sign);
  if (!sign) notFound();

  const related = await safeQuery(() =>
    prisma.article.findMany({
      where: { published: true, sign: sign.name },
      orderBy: { publishedAt: "desc" },
    })
  );

  return (
    <section className="mx-auto max-w-4xl px-5 py-16">
      <Link href="/signos" className="font-ui text-sm text-gold hover:text-gold-bright">
        ← Todos los signos
      </Link>

      <div className="mt-6 flex items-center gap-4">
        <span className="font-display text-6xl text-gold">{sign.glyph}</span>
        <div>
          <h1 className="font-display text-4xl text-gold-pale">{sign.name}</h1>
          <p className="font-ui text-sm text-gold-dim">{sign.dates}</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Elemento", value: sign.element },
          { label: "Modalidad", value: sign.modality },
          { label: "Regente", value: sign.ruler },
          { label: "Palabra clave", value: sign.keyword },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-gold/15 bg-noir-surface/40 p-4 text-center">
            <p className="font-ui text-xs uppercase tracking-wide text-gold-dim">{item.label}</p>
            <p className="mt-1 font-display text-lg text-gold-pale">{item.value}</p>
          </div>
        ))}
      </div>

      <p className="mt-8 font-body text-xl leading-relaxed text-gold-pale/85">{sign.summary}</p>

      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="mb-6 font-display text-2xl text-gold-pale">Artículos sobre {sign.name}</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {related.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
