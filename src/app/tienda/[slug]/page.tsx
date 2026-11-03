import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, safeQuery } from "@/lib/prisma";
import { ProductDetail } from "@/components/store/ProductDetail";
import { ProductMiniCard } from "@/components/store/ProductMiniCard";
import { toPlainText } from "@/components/store/FormattedText";
import { toProductViewModel } from "@/lib/store-products";
import { listPriceUsd } from "@/lib/store-designs";
import { categoryHref, getVisibleCategoryChain } from "@/lib/store-categories";
import { TRACKING_PARAMS } from "@/lib/traffic-sources";
import { buildProductJsonLd, summarize } from "@/lib/product-seo";
import { serializeJsonLd } from "@/lib/seo";
import { getUsdArsQuote } from "@/lib/exchange-rate";
import { getPaypalVisibility } from "@/lib/paypal-access";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXTAUTH_URL || "https://zodiacnoirweb.com";

async function findPublishedProduct(slug: string) {
  return safeQuery(() => prisma.product.findFirst({ where: { slug, published: true } }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await findPublishedProduct(params.slug);
  if (!product) return {};

  // Si quien carga el producto completó los campos SEO se usan tal cual; si no, se usan el título y la descripción.
  const title = product.metaTitle || product.title;
  const description = product.metaDescription || summarize(toPlainText(product.description));
  let imageUrl = product.coverImage || product.heroImage;
  if (!imageUrl && product.isCollection) {
    const firstDesign = await safeQuery(() =>
      prisma.product.findFirst({
        where: { parentId: product.id, published: true },
        orderBy: { createdAt: "asc" },
        select: { coverImage: true, heroImage: true },
      })
    );
    imageUrl = firstDesign?.coverImage || firstDesign?.heroImage || null;
  }
  const images = imageUrl
    ? [{ url: imageUrl, alt: product.coverImageAlt || `Portada de ${product.title}` }]
    : undefined;
  const keywords = [product.focusKeyword, ...product.tags].filter((k): k is string => Boolean(k));
  const path = `/tienda/${product.slug}`;

  return {
    // "absolute" evita que se le agregue «· Zodiac Noir» al título SEO escrito a mano.
    title: product.metaTitle ? { absolute: product.metaTitle } : product.title,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      type: "website",
      url: path,
      siteName: "Zodiac Noir",
      locale: "es_LA",
      images,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title,
      description,
      images: images?.map((i) => i.url),
    },
  };
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { diseno?: string; utm_source?: string; utm_medium?: string; utm_campaign?: string };
}) {
  const product = await findPublishedProduct(params.slug);
  if (!product) notFound();

  // Un diseño no tiene página propia: se muestra dentro de su colección, con ese diseño ya elegido.
  if (product.parentId) {
    const parent = await safeQuery(() =>
      prisma.product.findFirst({ where: { id: product.parentId!, published: true }, select: { slug: true } })
    );
    if (!parent) notFound();
    // Se conservan las marcas de seguimiento del link (utm_source…) para que la visita no pierda su fuente.
    const query = new URLSearchParams({ diseno: product.slug });
    for (const key of TRACKING_PARAMS) {
      const value = searchParams?.[key];
      if (typeof value === "string" && value) query.set(key, value.slice(0, 80));
    }
    permanentRedirect(`/tienda/${parent.slug}?${query.toString()}`);
  }

  const designs = product.isCollection
    ? await safeQuery(() =>
        prisma.product.findMany({ where: { parentId: product.id, published: true }, orderBy: { createdAt: "asc" } })
      )
    : [];
  // Una colección sin diseños publicados no tiene nada para comprar.
  if (product.isCollection && designs.length === 0) notFound();

  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  const quote = await getUsdArsQuote();
  const paypal = await getPaypalVisibility();
  const view = await toProductViewModel(product, email, "/tienda?compra=1", { fxRate: quote?.rate ?? null, paypal }, designs);

  const categoryChain = await getVisibleCategoryChain(product.categoryId);

  const others = await safeQuery(() =>
    prisma.product.findMany({
      // Sin diseños sueltos ni colecciones vacías: solo lo que se puede abrir y comprar.
      where: { published: true, parentId: null, NOT: { id: product.id }, OR: [{ isCollection: false }, { designs: { some: { published: true } } }] },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { designs: { where: { published: true }, orderBy: { createdAt: "asc" } } },
    })
  );
  const othersCards = others.map((other) => {
    const price = listPriceUsd({
      priceUsd: other.priceUsd,
      designs: other.designs.map((d) => ({ priceUsd: d.priceUsd })),
    });
    const firstDesign = other.designs[0];
    return {
      id: other.id,
      slug: other.slug,
      title: other.title,
      description: other.description,
      priceArs: other.priceArs,
      priceUsd: price?.amount ?? null,
      coverImage: other.coverImage ?? other.heroImage ?? firstDesign?.coverImage ?? firstDesign?.heroImage ?? null,
      coverImagePosition: other.coverImagePosition,
    };
  });

  const designPrices = designs.map((d) => d.priceUsd).filter((p): p is number => typeof p === "number" && p > 0);
  const lowPrice = product.isCollection ? (designPrices.length > 0 ? Math.min(...designPrices) : null) : product.priceUsd;
  const firstDesign = designs[0];

  const url = `${SITE_URL}/tienda/${product.slug}`;
  const jsonLd = buildProductJsonLd({
    siteUrl: SITE_URL,
    url,
    title: product.title,
    description: product.metaDescription || summarize(toPlainText(product.description), 300),
    image: product.coverImage || product.heroImage || firstDesign?.coverImage || firstDesign?.heroImage || null,
    slug: product.slug,
    priceArs: product.isCollection ? null : product.priceArs,
    priceUsd: lowPrice,
    highPriceUsd: designPrices.length > 0 ? Math.max(...designPrices) : null,
    designCount: designPrices.length,
    categoryChain,
    keywords: [product.focusKeyword, ...product.tags].filter((k): k is string => Boolean(k)),
    faq: view.faq,
  });

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />

      <nav aria-label="Ruta de navegación" className="font-ui text-xs uppercase tracking-wide text-gold-dim">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="hover:text-gold">Inicio</Link>
          </li>
          <li aria-hidden="true">›</li>
          <li>
            <Link href="/tienda" className="hover:text-gold">Tienda</Link>
          </li>
          {categoryChain.map((category) => (
            <li key={category.slug} className="flex items-center gap-2">
              <span aria-hidden="true">›</span>
              <Link href={categoryHref(category.slug)} className="hover:text-gold">{category.name}</Link>
            </li>
          ))}
          <li aria-hidden="true">›</li>
          <li aria-current="page" className="text-gold-pale">{product.title}</li>
        </ol>
      </nav>

      <article className="mt-6 rounded-2xl border border-gold/25 bg-noir-surface p-6 sm:p-10">
        <ProductDetail product={view} titleAs="h1" shareUrl={url} initialDesignSlug={searchParams?.diseno ?? null} />
      </article>

      {othersCards.length > 0 && (
        <section aria-labelledby="otros-productos" className="mt-14">
          <h2 id="otros-productos" className="font-display text-2xl text-gold-pale">
            Más de la tienda de Zodiac Noir
          </h2>
          <ul role="list" className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {othersCards.map((other) => (
              <li key={other.id}>
                <ProductMiniCard product={other} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-12">
        <Link
          href={categoryChain.length > 0 ? categoryHref(categoryChain[categoryChain.length - 1].slug) : "/tienda"}
          className="font-ui text-sm text-gold-pale underline decoration-gold underline-offset-4 hover:text-gold"
        >
          {categoryChain.length > 0 ? `← Volver a ${categoryChain[categoryChain.length - 1].name}` : "← Volver a la tienda"}
        </Link>
      </div>
    </div>
  );
}
