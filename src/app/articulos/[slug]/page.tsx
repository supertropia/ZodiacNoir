import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma, safeQuery } from "@/lib/prisma";
import { ShareButtons } from "@/components/ShareButtons";
import { ListenButton } from "@/components/ListenButton";
import { ArticleCard } from "@/components/ArticleCard";
import { renderArticleContent, stripToPlainText } from "@/lib/content";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = await safeQuery(() => prisma.article.findUnique({ where: { slug: params.slug } }));
  if (!article || !article.published) return {};
  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: `/articulos/${article.slug}` },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: "article",
      images: article.coverImage ? [article.coverImage] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = await safeQuery(() => prisma.article.findUnique({ where: { slug: params.slug } }));
  if (!article || !article.published) notFound();

  const siteUrl = process.env.NEXTAUTH_URL || "https://zodiacnoirweb.com";
  const url = `${siteUrl}/articulos/${article.slug}`;
  const plainText = `${article.title}. ${stripToPlainText(article.content)}`;

  const related = await safeQuery(() =>
    prisma.article.findMany({
      where: { published: true, category: article.category, NOT: { slug: article.slug } },
      orderBy: { publishedAt: "desc" },
      take: 2,
    })
  );

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
            Por <span className="text-gold">Zodiac Noir</span>
          </p>
          <p className="text-gold-dim">{date} · {article.readingTimeMin} min de lectura</p>
        </div>
        <ListenButton text={plainText} />
      </div>

      <div className="prose-zodiac mt-10 font-body text-xl leading-relaxed text-gold-pale/90">
        {renderArticleContent(article.content)}
      </div>

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
