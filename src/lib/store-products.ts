// Datos de un producto de la tienda tal como los necesita la pantalla pública.
// Lo usan /tienda (listado) y /tienda/[slug] (página propia de cada libro).

import type { Product } from "@prisma/client";
import { hasPurchased } from "@/lib/membership";
import { buildCheckoutUrl } from "@/lib/lemonsqueezy";
import { parseFaq, type FaqItem } from "@/lib/seo";
import { estimateArs } from "@/lib/pricing";
import type { PaypalVisibility } from "@/lib/paypal-access";

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
  /** "book" (libro / e-book) o "pdf" (material PDF descargable). */
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
};

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export async function toProductViewModel(
  product: Product,
  email: string | null,
  redirectPath = "/tienda?compra=1",
  extras: { fxRate?: number | null; paypal?: PaypalVisibility } = {}
): Promise<ProductViewModel> {
  const owned = await hasPurchased(email, product.id);
  const checkoutUrl = buildCheckoutUrl(product.lemonVariantId, {
    email: email ?? undefined,
    redirectPath,
  });

  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    description: product.description,
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
    fileUrl: owned ? product.fileUrl : null,
    videoUrl: product.videoUrl,
    checkoutUrl,
  };
}
