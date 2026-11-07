// Productos relacionados: otros productos de la misma categoría, sin diseños sueltos y sin el producto que se está mirando.

import type { ProductViewModel } from "@/lib/store-products";
import { listPriceUsd } from "@/lib/store-designs";
import { formatUsdAmount } from "@/lib/pricing";

export type RelatedItem = {
  id: string;
  slug: string;
  title: string;
  image: string | null;
  /** Texto de precio ya armado, por ejemplo "Desde US$ 5". */
  priceText: string;
};

export const MAX_RELATED = 8;

export function priceTextFor(input: { priceUsd: number | null; designs: { priceUsd: number | null }[] }): string {
  const price = listPriceUsd(input);
  if (!price) return "";
  return `${price.isFrom ? "Desde " : ""}${formatUsdAmount(price.amount)}`;
}

/** Para la tienda (/tienda): se arma con los productos que ya están en pantalla. */
export function relatedFromViewModels(products: ProductViewModel[], current: ProductViewModel): RelatedItem[] {
  return products
    .filter((p) => p.id !== current.id && Boolean(current.categoryId) && p.categoryId === current.categoryId)
    .slice(0, MAX_RELATED)
    .map((p) => {
      const firstDesign = p.designs[0];
      return {
        id: p.id,
        slug: p.slug,
        title: p.title,
        image: p.coverImage ?? p.heroImage ?? firstDesign?.coverImage ?? firstDesign?.heroImage ?? null,
        priceText: priceTextFor(p),
      };
    });
}
