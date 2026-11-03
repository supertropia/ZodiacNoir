// Productos con varios diseños: una sola descripción y varios diseños para elegir.
// Son funciones simples, sin acceso a la base, para poder usarlas tanto en el servidor como en el navegador.

import type { ProductViewModel } from "@/lib/store-products";

/**
 * Une la colección (descripción, textos, preguntas, video) con el diseño elegido (portada, imágenes,
 * precio, PDF y enlaces de compra). El resultado se ve como un producto común, pero la compra se hace
 * sobre el diseño: por eso el id es el del diseño.
 */
export function mergeDesign(base: ProductViewModel, design: ProductViewModel | null): ProductViewModel {
  if (!design) return base;
  const gallery = design.galleryImages.length > 0 ? design.galleryImages : base.galleryImages;
  const hasOwnHero = Boolean(design.heroImage ?? design.coverImage);
  return {
    ...base,
    id: design.id,
    variantLabel: design.variantLabel,
    priceLabel: design.priceLabel,
    priceArs: design.priceArs,
    priceUsd: design.priceUsd,
    priceArsEstimate: design.priceArsEstimate,
    amazonKindleUrl: design.amazonKindleUrl,
    amazonKindlePrice: design.amazonKindlePrice,
    amazonPaperbackUrl: design.amazonPaperbackUrl,
    amazonPaperbackPrice: design.amazonPaperbackPrice,
    coverImage: design.coverImage ?? base.coverImage,
    coverImagePosition: design.coverImage ? design.coverImagePosition : base.coverImagePosition,
    coverImageAlt: design.coverImageAlt ?? base.coverImageAlt,
    heroImage: hasOwnHero ? (design.heroImage ?? design.coverImage) : base.heroImage,
    heroImagePosition: design.heroImage ? design.heroImagePosition : base.heroImagePosition,
    galleryImages: gallery,
    salesCount: design.salesCount ?? base.salesCount,
    videoUrl: design.videoUrl ?? base.videoUrl,
    owned: design.owned,
    fileUrl: design.fileUrl,
    checkoutUrl: design.checkoutUrl,
  };
}

/**
 * El diseño que se muestra al abrir la ficha: el que pide el enlace (?diseno=...), si no el primero que
 * la persona ya compró, y si no el primero de la lista.
 */
export function pickInitialDesign(designs: ProductViewModel[], slug?: string | null): ProductViewModel | null {
  if (designs.length === 0) return null;
  if (slug) {
    const match = designs.find((d) => d.slug === slug);
    if (match) return match;
  }
  return designs.find((d) => d.owned) ?? designs[0];
}

/** Precio en USD a mostrar en una tarjeta: el del producto, o el más bajo de sus diseños. */
export function listPriceUsd(product: {
  priceUsd: number | null;
  designs: { priceUsd: number | null }[];
}): { amount: number; isFrom: boolean } | null {
  if (product.designs.length === 0) {
    return product.priceUsd && product.priceUsd > 0 ? { amount: product.priceUsd, isFrom: false } : null;
  }
  const prices = product.designs.map((d) => d.priceUsd).filter((p): p is number => typeof p === "number" && p > 0);
  if (prices.length === 0) return null;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return { amount: min, isFrom: max - min > 0.001 };
}

/** ¿Se puede comprar el PDF en la tienda (algún precio cargado)? Sirve para la etiqueta «PDF» de la tarjeta. */
export function hasPdfOffer(product: ProductViewModel): boolean {
  if (product.designs.length > 0) {
    return product.designs.some((d) => Boolean(d.priceUsd) || Boolean(d.priceArs) || d.owned);
  }
  return Boolean(product.priceUsd) || Boolean(product.priceArs) || product.owned;
}
