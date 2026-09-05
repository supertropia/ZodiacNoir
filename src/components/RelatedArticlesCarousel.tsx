"use client";

import type { Article } from "@prisma/client";
import { Carousel } from "./Carousel";
import { ArticleCard } from "./ArticleCard";

export function RelatedArticlesCarousel({ articles }: { articles: Article[] }) {
  return (
    <Carousel
      items={articles}
      getKey={(a) => a.slug}
      autoplay
      autoplayMs={3500}
      className="h-full"
      renderItem={(article) => <ArticleCard article={article} />}
    />
  );
}
