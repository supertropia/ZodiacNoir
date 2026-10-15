import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, safeQuery } from "@/lib/prisma";
import { ProductDetail } from "@/components/store/ProductDetail";
import { ProductMiniCard } from "@/components/store/ProductMiniCard";
import { toPlainText } from "@/components/store/FormattedText";
import { toProductViewModel } from "@/lib/store-products";
import { buildProductJsonLd, summarize } from "@/lib/product-seo";
import { serializeJsonLd } from "@/lib/seo";

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
  const imageUrl = product.coverImage || product.heroImage;
  const images = imageUrl
    ? [{ url: imageUrl, alt: product.coverImageAlt || `Portada del libro ${product.title}` }]
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

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await findPublishedProduct(params.slug);
  if (!product) notFound();

  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  const view = await toProductViewModel(product, email);

  const others = await safeQuery(() =>
    prisma.product.findMany({
      where: { published: true, NOT: { id: product.id } },
      orderBy: { createdAt: "desc" },
      take: 6,
    })
  );

  const url = `${SITE_URL}/tienda/${product.slug}`;
  const jsonLd = buildProductJsonLd({
    siteUrl: SITE_URL,
    url,
    title: product.title,
    description: product.metaDescription || summarize(toPlainText(product.description), 300),
    image: product.coverImage || product.heroImage,
    slug: product.slug,
    priceArs: product.priceArs,
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
          <li aria-hidden="true">›</li>
          <li aria-current="page" className="text-gold-pale">{product.title}</li>
        </ol>
      </nav>

      <article className="mt-6 rounded-2xl border border-gold/25 bg-noir-surface p-6 sm:p-10">
        <ProductDetail product={view} titleAs="h1" shareUrl={url} />
      </article>

      {others.length > 0 && (
        <section aria-labelledby="otros-libros" className="mt-14">
          <h2 id="otros-libros" className="font-display text-2xl text-gold-pale">
            Otros libros de Zodiac Noir
          </h2>
          <ul role="list" className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((other) => (
              <li key={other.id}>
                <ProductMiniCard product={other} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-12">
        <Link href="/tienda" className="font-ui text-sm text-gold-pale underline decoration-gold underline-offset-4 hover:text-gold">
          ← Volver a la tienda
        </Link>
      </div>
    </div>
  );
}
