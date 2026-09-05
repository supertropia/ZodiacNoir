"use client";

import type { Article } from "@prisma/client";
import { Carousel } from "./Carousel";
import { ArticleCard } from "./ArticleCard";

export function RelatedArticlesCarousel({ articles }: { articles: Article[] }) {
  return (
    <Carousel
      items={articles}
      getKey={(a) => a.slug}
      autoplayMs={2000}
      renderItem={(article) => <ArticleCard article={article} />}
    />
  );
}
