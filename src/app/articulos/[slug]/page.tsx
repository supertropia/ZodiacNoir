import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, safeQuery } from "@/lib/prisma";
import { hasActiveMembership } from "@/lib/membership";
import { ShareButtons } from "@/components/ShareButtons";
import { ViewTracker } from "@/components/ViewTracker";
import { ListenButton } from "@/components/ListenButton";
import { RelatedArticlesCarousel } from "@/components/RelatedArticlesCarousel";
import { ProductsCarousel } from "@/components/store/ProductsCarousel";
import { ArticlePaywall } from "@/components/ArticlePaywall";
import { ArticleTableOfContents } from "@/components/ArticleTableOfContents";
import { sanitizeArticleHtml, htmlToPlainText } from "@/lib/sanitize-html";
import { ensureHtmlContent } from "@/lib/legacy-content";
import { buildTableOfContents } from "@/lib/toc";
import { getCategoryLabel } from "@/lib/categories";
import { isArticleLive, livePublicationFilter, PUBLICATION_TIME_ZONE } from "@/lib/publication";
import { buildArticleJsonLd, parseFaq, serializeJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = await safeQuery(() => prisma.article.findUnique({ where: { slug: params.slug } }));
  if (!article || !isArticleLive(article)) return {};

  // Si la editora completó los campos SEO se usan tal cual; si no, se usan el título y el copete.
  const title = article.metaTitle || article.title;
  const description = article.metaDescription || article.excerpt;
  const keywords = [article.focusKeyword, ...article.tags].filter((k): k is string => Boolean(k));
  const image = article.coverImage
    ? [{ url: article.coverImage, alt: article.coverImageAlt || article.title }]
    : undefined;

  return {
    // "absolute" evita que se le agregue «· Zodiac Noir» al título SEO escrito a mano.
    title: article.metaTitle ? { absolute: article.metaTitle } : article.title,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    authors: [{ name: "Zodiac Noir" }],
    alternates: { canonical: `/articulos/${article.slug}` },
    openGraph: {
      title,
      description,
      type: "article",
      url: `/articulos/${article.slug}`,
      siteName: "Zodiac Noir",
      locale: "es_LA",
      publishedTime: (article.publishedAt ?? article.createdAt).toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
      section: getCategoryLabel(article.category),
      tags: article.tags.length > 0 ? article.tags : undefined,
      images: image,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image,
    },
  };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = await safeQuery(() =>
    prisma.article.findUnique({ where: { slug: params.slug }, include: { featuredProduct: true } })
  );
  if (!article || !isArticleLive(article)) notFound();

  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  const isMember = await hasActiveMembership(email);
  const isLocked = article.isPremium && !isMember;

  const siteUrl = process.env.NEXTAUTH_URL || "https://zodiacnoirweb.com";
  const url = `${siteUrl}/articulos/${article.slug}`;
  const htmlContent = ensureHtmlContent(article.content);
  const sanitizedHtml = sanitizeArticleHtml(htmlContent);
  // Le agregamos un id a cada subtítulo (H2) para poder armar el índice y
  // saltar directo a cada sección. Se calcula acá, no se guarda en la base
  // de datos, así que siempre refleja el contenido actual del artículo.
  const { headings, html: renderHtml } = buildTableOfContents(sanitizedHtml);
  // Si el artículo está bloqueado, el texto para "Escuchar" tampoco puede filtrar el
  // contenido completo — usamos solo el copete, igual que la vista en pantalla.
  const bodyText = htmlToPlainText(sanitizedHtml);
  const plainText = isLocked
    ? `${article.title}. ${article.excerpt}`
    : `${article.title}. ${bodyText}`;

  // Las preguntas frecuentes solo se muestran (y se declaran a Google) si el lector puede ver el artículo.
  const faq = isLocked ? [] : parseFaq(article.faq);
  const jsonLd = buildArticleJsonLd({
    siteUrl,
    url,
    title: article.title,
    description: article.metaDescription || article.excerpt,
    image: article.coverImage,
    datePublished: article.publishedAt ?? article.createdAt,
    dateModified: article.updatedAt,
    categoryLabel: getCategoryLabel(article.category),
    keywords: [article.focusKeyword, ...article.tags].filter((k): k is string => Boolean(k)),
    wordCount: bodyText.split(/\s+/).filter(Boolean).length,
    isPremium: article.isPremium,
    faq,
  });

  const related = await safeQuery(() =>
    prisma.article.findMany({
      where: { ...livePublicationFilter(), category: article.category, NOT: { slug: article.slug } },
      orderBy: { publishedAt: "desc" },
      take: 8,
    })
  );

  const featuredProducts = article.featuredProduct && article.featuredProduct.published
    ? [article.featuredProduct]
    : await safeQuery(() =>
        prisma.product.findMany({
          where: { published: true },
          orderBy: { createdAt: "desc" },
          take: 8,
        })
      );

  const date = new Date(article.publishedAt ?? article.createdAt).toLocaleDateString("es-AR", {
    timeZone: PUBLICATION_TIME_ZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <article className="mx-auto max-w-3xl px-5 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <ViewTracker slug={article.slug} />
      <p className="font-ui text-xs uppercase tracking-widest2 text-gold-dim">
        {getCategoryLabel(article.category)}
        {article.sign ? ` · ${article.sign}` : ""}
      </p>
      <h1 className="mt-3 font-display text-3xl leading-tight text-gold-pale sm:text-4xl">{article.title}</h1>

      {article.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.coverImage}
          alt={article.coverImageAlt || article.title}
          className="mt-8 w-full rounded-2xl border border-gold/20 object-cover"
        />
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-gold/15 py-4">
        <div className="font-ui text-sm text-gold-pale/80">
          <p>
            Por <span className="text-gold">Zodiac Noir</span>
          </p>
          <p className="text-gold-dim">{date} · {article.readingTimeMin} min de lectura</p>
          <Link
            href="/membresia"
            className="focus-ring mt-2 inline-block rounded-full border border-gold/40 px-4 py-1.5 font-ui text-xs uppercase tracking-wide text-gold transition hover:bg-gold/10"
          >
            Membresía
          </Link>
        </div>
        <ListenButton text={plainText} />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-b border-gold/15 pb-6">
        <p className="font-ui text-sm text-gold-dim">Comparte este artículo</p>
        <ShareButtons url={url} title={article.title} image={article.coverImage} />
      </div>

      <ArticleTableOfContents headings={headings} locked={isLocked} />

      {isLocked ? (
        <>
          <p className="prose-zodiac mt-10 font-body text-xl leading-relaxed text-gold-pale/90">
            {article.excerpt}
          </p>
          <div id="paywall-cta">
            <ArticlePaywall isLoggedIn={Boolean(email)} />
          </div>
        </>
      ) : (
        <div
          className="prose-zodiac mt-10 font-body text-xl leading-relaxed text-gold-pale/90"
          dangerouslySetInnerHTML={{ __html: renderHtml }}
        />
      )}

      {faq.length > 0 && (
        <section aria-labelledby="faq-heading" className="mt-14 border-t border-gold/15 pt-10">
          <h2 id="faq-heading" className="font-display text-2xl text-gold-pale">
            Preguntas frecuentes
          </h2>
          <div className="mt-6 space-y-6">
            {faq.map((item) => (
              <div key={item.question}>
                <h3 className="font-display text-lg text-gold">{item.question}</h3>
                <p className="mt-2 font-body text-xl leading-relaxed text-gold-pale/90">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {(related.length > 0 || featuredProducts.length > 0) && (
        <div className="mt-16 grid items-stretch gap-x-14 gap-y-10 sm:grid-cols-2">
          {related.length > 0 && (
            <div className="flex flex-col">
              <h2 className="mb-6 min-h-[4rem] font-display text-2xl text-gold-pale">También te puede interesar</h2>
              <RelatedArticlesCarousel articles={related} />
            </div>
          )}
          {featuredProducts.length > 0 && (
            <div className="flex flex-col">
              <h2 className="mb-6 min-h-[4rem] font-display text-2xl text-gold-pale">Completá tu lectura</h2>
              <ProductsCarousel products={featuredProducts} />
            </div>
          )}
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
