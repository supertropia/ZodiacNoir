"use client";

import { Carousel } from "@/components/Carousel";
import { ProductMiniCard, type ProductCardData } from "./ProductMiniCard";

export function ProductsCarousel({ products }: { products: ProductCardData[] }) {
  return (
    <Carousel
      items={products}
      getKey={(p) => p.id}
      autoplayMs={3500}
      renderItem={(product) => <ProductMiniCard product={product} />}
    />
  );
}
