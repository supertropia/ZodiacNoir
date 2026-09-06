import Link from "next/link";
import type { Article } from "@prisma/client";
import { getCategoryLabel } from "@/lib/categories";

export function ArticleCard({
  article,
  size = "md",
  compact = false,
}: {
  article: Article;
  size?: "lg" | "md" | "sm";
  compact?: boolean;
}) {
  const isLg = size === "lg";

  return (
    <Link
      href={`/articulos/${article.slug}`}
      className={`group flex h-full overflow-hidden rounded-2xl border border-gold/15 bg-noir-surface/40 transition duration-300 hover:-translate-y-1 hover:border-gold/50 hover:bg-noir-surface hover:shadow-xl hover:shadow-black/30 ${
        compact ? "flex-row sm:flex-col" : "flex-col"
      }`}
    >
      {article.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.coverImage}
          alt=""
          className={`shrink-0 object-cover ${
            compact
              ? `h-full w-24 sm:h-36 sm:w-full ${isLg ? "sm:h-56" : ""}`
              : `w-full ${isLg ? "h-56" : "h-36"}`
          }`}
        />
      )}
      <div className={`flex flex-1 flex-col ${compact ? "p-4 sm:p-6" : "p-6"}`}>
        <div className="mb-2 flex flex-wrap items-center gap-2 font-ui text-xs uppercase tracking-wide text-gold-dim sm:mb-3 sm:gap-3">
          <span className="rounded-full border border-gold/30 px-2.5 py-1 text-gold">
            {getCategoryLabel(article.category)}
          </span>
          {article.sign && <span>{article.sign}</span>}
          <span>· {article.readingTimeMin} min</span>
        </div>
        <h3
          className={`font-display leading-snug text-gold-pale group-hover:text-gold ${
            compact ? "text-base sm:text-xl" : "text-xl"
          } ${isLg ? "sm:text-2xl lg:text-3xl" : ""} [-webkit-box-orient:vertical] [-webkit-line-clamp:2] [display:-webkit-box] overflow-hidden`}
        >
          {article.title}
        </h3>
        <p
          className={`mt-3 font-body text-gold-pale/80 [-webkit-box-orient:vertical] [display:-webkit-box] overflow-hidden ${
            isLg ? "text-lg" : "text-base"
          } ${compact ? "hidden [-webkit-line-clamp:3] sm:block" : "[-webkit-line-clamp:3]"}`}
        >
          {article.excerpt}
        </p>
        <p className="mt-auto hidden pt-4 font-ui text-xs text-gold-dim sm:block">Por Zodiac Noir</p>
      </div>
    </Link>
  );
}
