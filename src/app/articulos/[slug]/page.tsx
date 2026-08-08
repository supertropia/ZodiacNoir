import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { ShareButtons } from "@/components/ShareButtons";
import { ListenButton } from "@/components/ListenButton";
import { ArticleCard } from "@/components/ArticleCard";
import { renderArticleContent, stripToPlainText } from "@/lib/content";
import { CosmicCountdown } from "@/components/CosmicCountdown";
import { getNextActiveEvent } from "@/lib/events-db";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = await prisma.article.findUnique({ where: { slug: params.slug } });
  if (!article || !article.published) return {};
  return {
    title: article.title,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: "article",
      images: article.coverImage ? [article.coverImage] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = await prisma.article.findUnique({ where: { slug: params.slug } });
  if (!article || !article.published) notFound();

  const session = await getServerSession(authOptions);
  const isMember = Boolean((session?.user as { isMember?: boolean } | undefined)?.isMember);
  const hasAccess = !article.premium || isMember || isAdminEmail(session?.user?.email);

  const url = `https://zodiacnoir.com/articulos/${article.slug}`;
  const plainText = `${article.title}. ${stripToPlainText(article.content)}`;

  const related = await prisma.article.findMany({
    where: { published: true, category: article.category, NOT: { slug: article.slug } },
    orderBy: { publishedAt: "desc" },
    take: 2,
  });

  const nextEvent = article.category === "efemerides" ? await getNextActiveEvent() : null;

  // Si es contenido premium y la persona no tiene acceso, mostramos solo el primer párrafo.
  const visibleContent = hasAccess
    ? article.content
    : article.content.split(/\n\s*\n/)[0] ?? article.content;

  const date = new Date(article.publishedAt ?? article.createdAt).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <article className="mx-auto max-w-3xl px-5 py-16">
      <p className="font-ui text-xs uppercase tracking-widest2 text-gold-dim">
        {article.category.replace("-", " ")}
        {article.sign ? ` · ${article.sign}` : ""}
        {article.premium && <span className="ml-2 rounded-full border border-gold/40 px-2 py-0.5 text-gold">Premium</span>}
      </p>
      <h1 className="mt-3 font-display text-3xl leading-tight text-gold-pale sm:text-4xl">{article.title}</h1>

      {article.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.coverImage}
          alt=""
          className="mt-8 w-full rounded-2xl border border-gold/20 object-cover"
        />
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-gold/15 py-4">
        <div className="font-ui text-sm text-gold-pale/80">
          <p>
            Por <span className="text-gold">{article.authorName}</span> — {article.authorRole}
          </p>
          <p className="text-gold-dim">{date} · {article.readingTimeMin} min de lectura</p>
        </div>
        {hasAccess && <ListenButton text={plainText} />}
      </div>

      <div className="prose-zodiac mt-10 font-body text-xl leading-relaxed text-gold-pale/90">
        {renderArticleContent(visibleContent)}
      </div>

      {!hasAccess && (
        <div className="my-10 rounded-2xl border border-gold/30 bg-noir-surface/60 p-8 text-center">
          <p className="font-display text-2xl text-gold-pale">Este artículo es para miembros</p>
          <p className="mx-auto mt-3 max-w-md font-body text-lg text-gold-pale/75">
            Sumate a Zodiac Noir para leer el artículo completo y acceder a todo el contenido premium.
          </p>
          <Link
            href="/membresia"
            className="focus-ring mt-6 inline-block rounded-full bg-gold px-7 py-3 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright"
          >
            Hazte miembro
          </Link>
        </div>
      )}

      {nextEvent && (
        <div className="mt-10">
          <CosmicCountdown
            title={nextEvent.title}
            subtitle={nextEvent.subtitle}
            description={nextEvent.description}
            eventDate={nextEvent.eventDate.toISOString()}
            articleSlug={nextEvent.articleSlug}
            guideUrl={nextEvent.guideUrl}
          />
        </div>
      )}

      <div className="mt-8 flex items-center justify-between border-t border-gold/15 pt-8">
        <p className="font-ui text-sm text-gold-dim">Compartir</p>
        <ShareButtons url={url} title={article.title} />
      </div>

      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="mb-6 font-display text-2xl text-gold-pale">También te puede interesar</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {related.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-12">
        <Link href="/articulos" className="font-ui text-sm text-gold hover:text-gold-bright">
          ← Volver al archivo
        </Link>
      </div>
    </article>
  );
}
