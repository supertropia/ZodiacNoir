import Link from "next/link";
import { ConstellationEye } from "@/components/ConstellationEye";
import { ArticleCard } from "@/components/ArticleCard";
import { NextEventWidget } from "@/components/NextEventWidget";
import { NewsletterForm } from "@/components/NewsletterForm";
import { CosmicCountdown } from "@/components/CosmicCountdown";
import { prisma } from "@/lib/prisma";
import { getNextActiveEvent } from "@/lib/events-db";
import { signs } from "@/data/signs";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [articles, nextEvent] = await Promise.all([
    prisma.article.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      take: 7,
    }),
    getNextActiveEvent(),
  ]);
  const [featured, ...rest] = articles;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden px-5 pb-20 pt-16 sm:pt-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="font-ui text-xs uppercase tracking-widest2 text-gold-dim">
              Astrología · Tarot · Psicología astrológica
            </p>
            <h1 className="mt-5 font-display text-4xl leading-tight text-gold-pale sm:text-5xl lg:text-6xl">
              Revelando lo <span className="italic text-gold">invisible</span>
            </h1>
            <p className="mt-6 max-w-xl font-body text-xl leading-relaxed text-gold-pale/85">
              Lunaciones, eclipses y aspectos planetarios explicados por astrólogos y tarotistas
              en ejercicio — sin fórmulas genéricas ni horóscopos de relleno.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href="/articulos"
                className="focus-ring rounded-full bg-gold px-7 py-3 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright"
              >
                Explorar artículos
              </Link>
              <Link
                href="/efemerides"
                className="focus-ring rounded-full border border-gold/40 px-7 py-3 font-ui text-sm font-medium uppercase tracking-wide text-gold transition hover:border-gold hover:bg-gold/10"
              >
                Ver efemérides
              </Link>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <ConstellationEye size={280} className="drop-shadow-[0_0_45px_rgba(201,162,75,0.25)]" />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5">
        <div className="gold-line" />
      </div>

      {/* Destacado + próximo evento */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          {featured && <ArticleCard article={featured} size="lg" />}
          <NextEventWidget />
        </div>
      </section>

      {/* Grid de artículos recientes */}
      <section className="mx-auto max-w-6xl px-5 py-6">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-display text-2xl text-gold-pale">Últimos artículos</h2>
          <Link href="/articulos" className="font-ui text-sm text-gold hover:text-gold-bright">
            Ver todos →
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((a) => (
            <ArticleCard key={a.slug} article={a} />
          ))}
        </div>
      </section>

      {/* Cuenta regresiva al próximo evento cósmico configurado */}
      {nextEvent && (
        <section className="mx-auto max-w-4xl px-5 py-6">
          <CosmicCountdown
            title={nextEvent.title}
            subtitle={nextEvent.subtitle}
            description={nextEvent.description}
            eventDate={nextEvent.eventDate.toISOString()}
            articleSlug={nextEvent.articleSlug}
            guideUrl={nextEvent.guideUrl}
          />
        </section>
      )}

      {/* Signos */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="mb-8 font-display text-2xl text-gold-pale">Los doce signos</h2>
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {signs.map((s) => (
            <Link
              key={s.slug}
              href={`/signos/${s.slug}`}
              className="group flex flex-col items-center gap-2 rounded-xl border border-gold/15 bg-noir-surface/30 p-5 text-center transition hover:border-gold/50 hover:bg-noir-surface"
            >
              <span className="font-display text-3xl text-gold group-hover:text-gold-bright">{s.glyph}</span>
              <span className="font-ui text-xs uppercase tracking-wide text-gold-pale/85">{s.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="rounded-3xl border border-gold/25 bg-noir-surface/50 p-10 text-center sm:p-16">
          <p className="font-ui text-xs uppercase tracking-widest2 text-gold-dim">El boletín</p>
          <h2 className="mx-auto mt-3 max-w-xl font-display text-3xl text-gold-pale sm:text-4xl">
            Las lunaciones y retrogradaciones, antes de que sucedan
          </h2>
          <p className="mx-auto mt-4 max-w-md font-body text-lg text-gold-pale/80">
            Un correo quincenal, sin spam, con las efemérides que importan y una lectura de fondo.
          </p>
          <div className="mt-8 flex justify-center">
            <NewsletterForm />
          </div>
        </div>
      </section>
    </>
  );
}
