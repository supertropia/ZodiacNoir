// Datos de un producto de la tienda tal como los necesita la pantalla pública.
// Lo usan /tienda (listado), /tienda/categoria/[slug] y /tienda/[slug] (página propia de cada producto).

import type { Product } from "@prisma/client";
import { hasPurchased } from "@/lib/membership";
import { buildCheckoutUrl } from "@/lib/lemonsqueezy";
import { parseFaq, type FaqItem } from "@/lib/seo";
import { estimateArs } from "@/lib/pricing";
import type { PaypalVisibility } from "@/lib/paypal-access";
import { looksLikeHtml } from "@/lib/html-text";
import { sanitizeArticleHtml } from "@/lib/sanitize-html";

export type ContentHighlight = { title: string; description: string };
export type Testimonial = { name: string; stars: number; text: string; shared: number };

export type ProductViewModel = {
  id: string;
  slug: string;
  title: string;
  description: string;
  priceLabel: string;
  priceArs: number | null;
  /** Precio en dólares: es el que se publica. Si está vacío (productos viejos) se usa priceArs. */
  priceUsd: number | null;
  /** "book" (libro / e-book) o "pdf" (material PDF descargable). Dato antiguo: hoy manda la categoría. */
  kind: string;
  /** Precio en pesos al dólar blue de hoy (más el margen); null si no hay cotización. */
  priceArsEstimate: number | null;
  /** Quién ve el botón de PayPal: nadie ("hidden"), solo la administración ("preview") o todos ("public"). */
  paypal: PaypalVisibility;
  amazonKindleUrl: string | null;
  amazonKindlePrice: string | null;
  amazonPaperbackUrl: string | null;
  amazonPaperbackPrice: string | null;
  coverImage: string | null;
  coverImagePosition: number;
  coverImageAlt: string | null;
  heroImage: string | null;
  heroImagePosition: number;
  galleryImages: string[];
  contentHighlights: ContentHighlight[];
  testimonials: Testimonial[];
  faq: FaqItem[];
  audienceText: string | null;
  salesCount: number | null;
  owned: boolean;
  fileUrl: string | null;
  /** Video de presentación (público, lo ve cualquier visitante). */
  videoUrl: string | null;
  checkoutUrl: string | null;
  /** Categoría (o subcategoría) en la que se muestra. */
  categoryId: string | null;
  /** true = producto principal con varios diseños: lo que se compra son sus diseños. */
  isCollection: boolean;
  /** Nombre corto del diseño (solo en los diseños de una colección). */
  variantLabel: string | null;
  /** Se cargó hace menos de 30 días. */
  isNew: boolean;
  /** Diseños publicados de la colección (vacío en un producto común). */
  designs: ProductViewModel[];
};

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

const NEW_PRODUCT_DAYS = 30;

export async function toProductViewModel(
  product: Product,
  email: string | null,
  redirectPath = "/tienda?compra=1",
  extras: { fxRate?: number | null; paypal?: PaypalVisibility } = {},
  designs: Product[] = []
): Promise<ProductViewModel> {
  const designModels = await Promise.all(
    designs.map((design) => toProductViewModel(design, email, redirectPath, extras))
  );
  // En una colección, "ya lo tienes" significa que ya compraste alguno de sus diseños.
  const owned = designModels.length > 0 ? designModels.some((d) => d.owned) : await hasPurchased(email, product.id);
  const checkoutUrl = buildCheckoutUrl(product.lemonVariantId, {
    email: email ?? undefined,
    redirectPath,
  });
  const ageMs = Date.now() - new Date(product.createdAt).getTime();

  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    // Si la descripción viene del editor visual (HTML), se limpia otra vez acá antes de mostrarla.
    description: looksLikeHtml(product.description) ? sanitizeArticleHtml(product.description) : product.description,
    priceLabel: product.priceLabel,
    priceArs: product.priceArs,
    priceUsd: product.priceUsd,
    kind: product.kind,
    priceArsEstimate: estimateArs(product.priceUsd, extras.fxRate),
    paypal: extras.paypal ?? "hidden",
    amazonKindleUrl: product.amazonKindleUrl,
    amazonKindlePrice: product.amazonKindlePrice,
    amazonPaperbackUrl: product.amazonPaperbackUrl,
    amazonPaperbackPrice: product.amazonPaperbackPrice,
    coverImage: product.coverImage,
    coverImagePosition: product.coverImagePosition ?? 50,
    coverImageAlt: product.coverImageAlt,
    heroImage: product.heroImage,
    heroImagePosition: product.heroImagePosition ?? 50,
    galleryImages: asArray<string>(product.galleryImages),
    contentHighlights: asArray<ContentHighlight>(product.contentHighlights),
    testimonials: asArray<Testimonial>(product.testimonials),
    faq: parseFaq(product.faq),
    audienceText: product.audienceText,
    salesCount: product.salesCount,
    owned,
    // El PDF solo se entrega a quien ya lo compró.
    fileUrl: designModels.length > 0 ? null : owned ? product.fileUrl : null,
    videoUrl: product.videoUrl,
    checkoutUrl,
    categoryId: product.categoryId,
    isCollection: product.isCollection,
    variantLabel: product.variantLabel,
    isNew: ageMs >= 0 && ageMs < NEW_PRODUCT_DAYS * 24 * 60 * 60 * 1000,
    designs: designModels,
  };
}
