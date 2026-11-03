// Datos estructurados (schema.org) del listado de productos de la tienda: le explican a Google qué hay en cada página.

import type { ProductViewModel } from "@/lib/store-products";
import { listPriceUsd } from "@/lib/store-designs";
import { summarize } from "@/lib/product-seo";
import { toPlainText } from "@/components/store/FormattedText";

export function buildProductListItems(products: ProductViewModel[], siteUrl: string) {
  return products.map((product, index) => {
    const url = `${siteUrl}/tienda/${product.slug}`;
    const first = product.designs[0];
    const image = product.coverImage ?? product.heroImage ?? first?.coverImage ?? first?.heroImage ?? null;
    const price = listPriceUsd(product);
    const designPrices = product.designs.map((d) => d.priceUsd).filter((p): p is number => typeof p === "number" && p > 0);

    // Una colección con diseños de distinto precio se declara como rango (AggregateOffer); lo demás, como una oferta simple.
    const offers = price
      ? price.isFrom
        ? {
            "@type": "AggregateOffer",
            lowPrice: price.amount,
            highPrice: Math.max(...designPrices),
            priceCurrency: "USD",
            offerCount: designPrices.length,
            availability: "https://schema.org/InStock",
          }
        : {
            "@type": "Offer",
            price: price.amount,
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
            url,
          }
      : product.priceArs
        ? {
            "@type": "Offer",
            price: product.priceArs,
            priceCurrency: "ARS",
            availability: "https://schema.org/InStock",
            url,
          }
        : undefined;

    return {
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: product.title,
        description: summarize(toPlainText(product.description), 300),
        url,
        ...(image ? { image } : {}),
        brand: { "@type": "Brand", name: "Zodiac Noir" },
        ...(offers ? { offers } : {}),
      },
    };
  });
}
