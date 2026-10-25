import Link from "next/link";
import { ConstellationEye } from "@/components/ConstellationEye";
import { ArticleCard } from "@/components/ArticleCard";
import { NextEventWidget } from "@/components/NextEventWidget";
import { NewsletterForm } from "@/components/NewsletterForm";
import { SocialLinks } from "@/components/SocialLinks";
import { prisma, safeQuery } from "@/lib/prisma";
import { livePublicationFilter } from "@/lib/publication";
import { signs } from "@/data/signs";
import { READING_DELIVERY_WINDOW, READING_SERVICES, formatUsd } from "@/lib/lecturas";
import { getReadingsEnabled } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const articles = await safeQuery(() =>
    prisma.article.findMany({
      where: livePublicationFilter(),
      orderBy: { publishedAt: "desc" },
      take: 7,
    })
  );
  const [featured, ...rest] = articles;
  // Último tránsito semanal publicado: si no hay ninguno, la sección no se muestra.
  const transit = await safeQuery(() =>
    prisma.article.findFirst({
      where: { ...livePublicationFilter(), category: "transitos-semanales" },
      orderBy: { publishedAt: "desc" },
    })
  );
  // Las lecturas solo se muestran en la portada cuando se publican desde el panel.
  const readingsEnabled = await getReadingsEnabled();

  return (
    <>
      {/* Próximo evento cósmico — visible arriba de todo solo en mobile */}
      <div className="mx-auto max-w-6xl px-5 pt-6 lg:hidden">
        <NextEventWidget />
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden px-5 pb-20 pt-10 sm:pt-24">
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
            {/* Orden por importancia: tienda, blog, membresía y, al final, efemérides.
                En celular los botones ocupan todo el ancho (mismo tamaño, fáciles de tocar);
                en pantallas más grandes forman una grilla de 2 x 2 prolija. */}
            <div className="mt-9 grid gap-3 sm:max-w-xl sm:grid-cols-2">
              {readingsEnabled && (
                <Link
                  href="/lecturas"
                  className="focus-ring rounded-full bg-gold px-6 py-3.5 text-center font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright sm:col-span-2"
                >
                  Pide tu lectura personalizada
                </Link>
              )}
              <Link
                href="/tienda"
                className="focus-ring rounded-full border border-gold/50 px-6 py-3 text-center font-ui text-sm font-medium uppercase tracking-wide text-gold transition hover:border-gold hover:bg-gold/10"
              >
                Tienda
              </Link>
              <Link
                href="/blog"
                className="focus-ring rounded-full border border-gold/50 px-6 py-3 text-center font-ui text-sm font-medium uppercase tracking-wide text-gold transition hover:border-gold hover:bg-gold/10"
              >
                Explorar el blog
              </Link>
              <Link
                href="/membresia"
                className="focus-ring rounded-full border border-gold/50 px-6 py-3 text-center font-ui text-sm font-medium uppercase tracking-wide text-gold transition hover:border-gold hover:bg-gold/10"
              >
                Sumate a la membresía
              </Link>
              <Link
                href="/efemerides"
                className="focus-ring rounded-full border border-gold/50 px-6 py-3 text-center font-ui text-sm font-medium uppercase tracking-wide text-gold transition hover:border-gold hover:bg-gold/10"
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

      {/* Lecturas personalizadas: solo visibles cuando se publican desde el panel */}
      {readingsEnabled && (
      <>
      <section className="mx-auto max-w-6xl px-5 py-16" aria-labelledby="home-lecturas">
        <div className="max-w-2xl">
          <p className="font-ui text-xs uppercase tracking-widest2 text-gold-dim">Lecturas personalizadas</p>
          <h2 id="home-lecturas" className="mt-2 font-display text-3xl text-gold-pale sm:text-4xl">
            Tu carta, leída como un mapa de tu psique
          </h2>
          <p className="mt-4 font-body text-xl leading-relaxed text-gold-pale/85">
            Astrología humanista y mirada arquetípica, escrita para ti. La recibes en PDF por correo en un plazo de{" "}
            {READING_DELIVERY_WINDOW} desde la confirmación del pago.
          </p>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {READING_SERVICES.map((s) => (
            <Link
              key={s.key}
              href={`/lecturas?servicio=${s.key}#pedido`}
              className="focus-ring group flex flex-col rounded-3xl border border-gold/25 bg-noir-surface/50 p-7 transition hover:border-gold hover:bg-noir-surface"
            >
              <p className="font-ui text-xs uppercase tracking-widest2 text-gold-dim">{s.eyebrow}</p>
              <h3 className="mt-2 font-display text-2xl text-gold-pale">{s.name}</h3>
              <p className="mt-3 font-body text-lg leading-relaxed text-gold-pale/85">{s.summary}</p>
              <p className="mt-5 flex items-center justify-between font-ui text-sm">
                <span className="font-display text-2xl text-gold">{formatUsd(s.priceUsd)}</span>
                <span className="uppercase tracking-wide text-gold group-hover:text-gold-bright">{s.cta} →</span>
              </p>
            </Link>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5">
        <div className="gold-line" />
      </div>
      </>
      )}

      {/* Tránsitos de la semana: solo si hay uno publicado */}
      {transit && (
        <>
          <section className="mx-auto max-w-6xl px-5 py-14" aria-labelledby="home-transitos">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="font-ui text-xs uppercase tracking-widest2 text-gold-dim">Cada semana</p>
                <h2 id="home-transitos" className="mt-1 font-display text-2xl text-gold-pale">
                  Tránsitos de la semana
                </h2>
              </div>
              <Link
                href="/blog?categoria=transitos-semanales"
                className="font-ui text-sm text-gold hover:text-gold-bright"
              >
                Ver todos →
              </Link>
            </div>
            <div className="grid items-center gap-8 md:grid-cols-2">
              <ArticleCard article={transit} />
              <p className="font-body text-xl leading-relaxed text-gold-pale/85">
                Qué se mueve en el cielo esta semana y cómo se vive: lunaciones, aspectos y estaciones
                planetarias, explicados día por día.
              </p>
            </div>
          </section>

          <div className="mx-auto max-w-6xl px-5">
            <div className="gold-line" />
          </div>
        </>
      )}

      {/* Destacado + próximo evento */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          {featured && <ArticleCard article={featured} size="lg" />}
          <div className="hidden lg:block">
            <NextEventWidget />
          </div>
        </div>
      </section>

      {/* Grid de artículos recientes */}
      <section className="mx-auto max-w-6xl px-5 py-6">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-display text-2xl text-gold-pale">Lo último del blog</h2>
          <Link href="/blog" className="font-ui text-sm text-gold hover:text-gold-bright">
            Ver todo el blog →
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((a) => (
            <ArticleCard key={a.slug} article={a} />
          ))}
        </div>
      </section>

      {/* Membresía: invitación destacada */}
      <section className="mx-auto max-w-6xl px-5 py-14" aria-labelledby="home-membresia">
        <div className="rounded-3xl border-2 border-gold bg-gold/10 px-8 py-12 text-center sm:px-16">
          <p className="font-ui text-xs uppercase tracking-widest2 text-gold-dim">Membresía</p>
          <h2 id="home-membresia" className="mx-auto mt-3 max-w-xl font-display text-3xl text-gold-pale sm:text-4xl">
            Leé el cielo completo
          </h2>
          <p className="mx-auto mt-4 max-w-lg font-body text-xl leading-relaxed text-gold-pale/85">
            Artículos premium, efemérides completas y el boletín quincenal incluido, todo en un mismo lugar.
          </p>
          <Link
            href="/membresia"
            className="focus-ring mt-8 inline-block rounded-full bg-gold px-9 py-3.5 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright"
          >
            Conocer la membresía
          </Link>
        </div>
      </section>

      {/* Redes y canales: franja discreta, pensada para no competir con el contenido */}
      <section className="mx-auto max-w-6xl px-5 pb-6 pt-14" aria-labelledby="home-redes">
        <div className="flex flex-col items-center gap-4 border-y border-gold/15 py-8 text-center">
          <div>
            <p className="font-ui text-xs uppercase tracking-widest2 text-gold-dim">Más Zodiac Noir</p>
            <h2 id="home-redes" className="mt-1.5 font-body text-lg text-gold-pale/85">
              Seguí la conversación en video, audio y redes.
            </h2>
          </div>
          <SocialLinks variant="strip" />
        </div>
      </section>

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
