import Link from "next/link";
import type { Article } from "@prisma/client";

const CATEGORY_LABEL: Record<string, string> = {
  efemerides: "Efemérides",
  signos: "Signos",
  tarot: "Tarot",
  "psicologia-astrologica": "Psicología astrológica",
};

export function ArticleCard({ article, size = "md" }: { article: Article; size?: "lg" | "md" | "sm" }) {
  const isLg = size === "lg";

  return (
    <Link
      href={`/articulos/${article.slug}`}
      className="group block overflow-hidden rounded-2xl border border-gold/15 bg-noir-surface/40 transition hover:border-gold/50 hover:bg-noir-surface"
    >
      {article.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.coverImage}
          alt=""
          className={`w-full object-cover ${isLg ? "h-56" : "h-36"}`}
        />
      )}
      <div className="p-6">
        <div className="mb-3 flex items-center gap-3 font-ui text-xs uppercase tracking-wide text-gold-dim">
          <span className="rounded-full border border-gold/30 px-2.5 py-1 text-gold">
            {CATEGORY_LABEL[article.category] ?? article.category}
          </span>
          {article.sign && <span>{article.sign}</span>}
          <span>· {article.readingTimeMin} min</span>
        </div>
        <h3 className={`font-display leading-snug text-gold-pale group-hover:text-gold ${isLg ? "text-2xl sm:text-3xl" : "text-xl"}`}>
          {article.title}
        </h3>
        <p className={`mt-3 font-body text-gold-pale/80 ${isLg ? "text-lg" : "text-base"}`}>{article.excerpt}</p>
        <p className="mt-4 font-ui text-xs text-gold-dim">Por {article.authorName}</p>
      </div>
    </Link>
  );
}
