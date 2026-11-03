import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, safeQuery } from "@/lib/prisma";
import { ProductGrid } from "@/components/store/ProductGrid";
import { StoreNav } from "@/components/store/StoreNav";
import { CategoryCards } from "@/components/store/CategoryCards";
import { StoreViewTracker } from "@/components/store/StoreViewTracker";
import { loadStoreCatalog } from "@/lib/store-catalog";
import {
  buildCategoryTree,
  categoryHref,
  categoryIdsOf,
  findCategoryBySlug,
  loadCategoryRows,
} from "@/lib/store-categories";
import { buildProductListItems } from "@/lib/store-jsonld";
import { serializeJsonLd } from "@/lib/seo";
import { getUsdArsQuote } from "@/lib/exchange-rate";
import { getPaypalVisibility } from "@/lib/paypal-access";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXTAUTH_URL || "https://zodiacnoirweb.com";

/** Busca la categoría entre las visibles. Una categoría oculta (o dentro de una oculta) no existe para el público. */
async function findVisibleCategory(slug: string) {
  const rows = await loadCategoryRows();
  const tree = buildCategoryTree(rows, { onlyVisible: true });
  return findCategoryBySlug(tree, slug);
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const found = await findVisibleCategory(params.slug);
  if (!found) return {};
  const { node, parent } = found;

  // Una categoría sin productos no se ofrece a Google (la página existe, pero sin contenido útil).
  const count = await safeQuery(() =>
    prisma.product.count({
      where: {
        published: true,
        parentId: null,
        categoryId: { in: categoryIdsOf(node) },
        OR: [{ isCollection: false }, { designs: { some: { published: true } } }],
      },
    })
  );

  const title = parent ? `${node.name} · ${parent.name}` : node.name;
  const description =
    node.description ||
    `${node.name} en la tienda de Zodiac Noir: productos de astrología humanista con descarga inmediata.`;
  const path = categoryHref(node.slug);

  return {
    title,
    description,
    alternates: { canonical: path },
    robots: count === 0 ? { index: false, follow: true } : undefined,
    openGraph: {
      title: `${title} · Zodiac Noir`,
      description,
      url: path,
      type: "website",
      locale: "es_LA",
      siteName: "Zodiac Noir",
      ...(node.image ? { images: [{ url: node.image, alt: node.name }] } : {}),
    },
    twitter: {
      card: node.image ? "summary_large_image" : "summary",
      title: `${title} · Zodiac Noir`,
      description,
      ...(node.image ? { images: [node.image] } : {}),
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { producto?: string };
}) {
  const found = await findVisibleCategory(params.slug);
  if (!found) notFound();
  const { node, parent } = found;

  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  const quote = await getUsdArsQuote();
  const paypal = await getPaypalVisibility();
  const { tree, products } = await loadStoreCatalog(email, { fxRate: quote?.rate ?? null, paypal });

  const ids = new Set(categoryIdsOf(node));
  const items = products.filter((p) => p.categoryId !== null && ids.has(p.categoryId));
  const requested = searchParams?.producto;

  // La categoría tal como se muestra (con la cantidad de productos y solo las subcategorías que tienen algo).
  const live = findCategoryBySlug(tree, node.slug)?.node ?? null;
  const subcategories = live ? live.children : [];

  // Si es una categoría principal con subcategorías, los productos se agrupan por subcategoría.
  const groups = subcategories
    .map((child) => ({ child, items: items.filter((p) => p.categoryId === child.id) }))
    .filter((group) => group.items.length > 0);
  const direct = items.filter((p) => p.categoryId === node.id);

  const pageUrl = `${SITE_URL}${categoryHref(node.slug)}`;
  const trail = [
    { name: "Inicio", item: `${SITE_URL}/` },
    { name: "Tienda", item: `${SITE_URL}/tienda` },
    ...(parent ? [{ name: parent.name, item: `${SITE_URL}${categoryHref(parent.slug)}` }] : []),
    { name: node.name, item: pageUrl },
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${pageUrl}#pagina`,
        url: pageUrl,
        name: `${node.name} · Zodiac Noir`,
        ...(node.description ? { description: node.description } : {}),
        inLanguage: "es",
        isPartOf: { "@type": "WebSite", name: "Zodiac Noir", url: SITE_URL },
      },
      {
        "@type": "ItemList",
        "@id": `${pageUrl}#catalogo`,
        name: node.name,
        numberOfItems: items.length,
        itemListElement: buildProductListItems(items, SITE_URL),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: trail.map((step, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: step.name,
          item: step.item,
        })),
      },
    ],
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <StoreViewTracker kind="page" />

      <nav aria-label="Ruta de navegación" className="font-ui text-xs uppercase tracking-wide text-gold-dim">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="hover:text-gold">Inicio</Link>
          </li>
          <li aria-hidden="true">›</li>
          <li>
            <Link href="/tienda" className="hover:text-gold">Tienda</Link>
          </li>
          {parent && (
            <>
              <li aria-hidden="true">›</li>
              <li>
                <Link href={categoryHref(parent.slug)} className="hover:text-gold">{parent.name}</Link>
              </li>
            </>
          )}
          <li aria-hidden="true">›</li>
          <li aria-current="page" className="text-gold-pale">{node.name}</li>
        </ol>
      </nav>

      <header className="mt-6 max-w-3xl">
        <p className="font-ui text-xs uppercase tracking-widest2 text-gold-dim">{parent ? parent.name : "Categoría"}</p>
        <h1 className="mt-2 font-display text-3xl leading-tight text-gold-pale sm:text-4xl">{node.name}</h1>
        {node.description && (
          <p className="mt-4 font-body text-xl leading-relaxed text-gold-pale/90">{node.description}</p>
        )}
        <p className="mt-3 font-ui text-sm text-gold-dim">
          {items.length} {items.length === 1 ? "producto" : "productos"} · Precios en dólares (USD)
        </p>
      </header>

      {tree.length > 0 && (
        <div className="mt-8">
          <StoreNav tree={tree} totalCount={products.length} activeSlug={node.slug} />
        </div>
      )}

      {items.length === 0 ? (
        <div className="mt-10 rounded-xl border border-gold/20 bg-noir-surface/50 p-6 font-body text-lg text-gold-pale/80">
          <p>Todavía no hay productos en esta categoría. Estamos preparando material nuevo.</p>
          <Link
            href="/tienda"
            className="focus-ring mt-4 inline-block rounded-full border border-gold/50 px-5 py-2.5 font-ui text-sm uppercase tracking-wide text-gold-pale transition hover:bg-gold/10"
          >
            Ver toda la tienda
          </Link>
        </div>
      ) : groups.length > 0 ? (
        <>
          {groups.length > 1 && (
            <section aria-labelledby="subcategorias-titulo" className="mt-10">
              <h2 id="subcategorias-titulo" className="font-display text-2xl text-gold-pale">
                Elige una sección
              </h2>
              <CategoryCards categories={subcategories} />
            </section>
          )}

          {groups.map(({ child, items: groupItems }) => (
            <section key={child.id} aria-labelledby={`seccion-${child.slug}`} className="mt-14">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <h2 id={`seccion-${child.slug}`} className="font-display text-2xl text-gold-pale">
                  {child.name}
                </h2>
                <Link
                  href={categoryHref(child.slug)}
                  className="focus-ring font-ui text-sm text-gold-pale underline decoration-gold decoration-2 underline-offset-4 hover:text-gold"
                >
                  Ver solo {child.name} →
                </Link>
              </div>
              {child.description && (
                <p className="mt-3 max-w-3xl font-body text-lg leading-relaxed text-gold-pale/80">{child.description}</p>
              )}
              <ProductGrid products={groupItems} initialProductSlug={requested} sectionId={`sub-${child.slug}`} />
            </section>
          ))}

          {direct.length > 0 && (
            <section aria-labelledby="mas-titulo" className="mt-14">
              <h2 id="mas-titulo" className="font-display text-2xl text-gold-pale">
                Más en {node.name}
              </h2>
              <ProductGrid products={direct} initialProductSlug={requested} sectionId="directos" />
            </section>
          )}
        </>
      ) : (
        <section aria-label={`Productos de ${node.name}`} className="mt-10">
          <p className="font-body text-base italic text-gold-dim">Toca un producto para ver su descripción ↓</p>
          <ProductGrid products={items} initialProductSlug={requested} sectionId={`cat-${node.slug}`} />
        </section>
      )}

      <div className="mt-14">
        <Link
          href={parent ? categoryHref(parent.slug) : "/tienda"}
          className="font-ui text-sm text-gold-pale underline decoration-gold underline-offset-4 hover:text-gold"
        >
          {parent ? `← Volver a ${parent.name}` : "← Volver a la tienda"}
        </Link>
      </div>
    </div>
  );
}
