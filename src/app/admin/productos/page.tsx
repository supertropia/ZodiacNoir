import Link from "next/link";
import type { Product } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getStoreViewStats, productTarget, STORE_PAGE_TARGET } from "@/lib/store-views";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";
import { CopyProductLinkButton } from "@/components/admin/CopyProductLinkButton";
import { TogglePublishProductButton } from "@/components/admin/TogglePublishProductButton";
import { ConvertPricesToUsdButton } from "@/components/admin/ConvertPricesToUsdButton";
import { formatUsdAmount } from "@/lib/pricing";
import { buildCategoryTree, ensureDefaultCategories, loadCategoryRows } from "@/lib/store-categories";

export const dynamic = "force-dynamic";

const NUMBER_FORMAT = new Intl.NumberFormat("es-AR");

export default async function AdminProductsPage() {
  await ensureDefaultCategories();

  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
  const viewStats = await getStoreViewStats();
  const storeStats = viewStats.get(STORE_PAGE_TARGET);

  // Nombre completo de cada categoría («Imprimibles › Calendarios») para mostrarlo en cada producto.
  const categoryLabels = new Map<string, string>();
  for (const top of buildCategoryTree(await loadCategoryRows())) {
    categoryLabels.set(top.id, top.name);
    for (const child of top.children) categoryLabels.set(child.id, `${top.name} › ${child.name}`);
  }

  // Los diseños se muestran debajo de su colección, en el orden en que se cargaron.
  const designsByParent = new Map<string, Product[]>();
  for (const product of products) {
    if (!product.parentId) continue;
    const list = designsByParent.get(product.parentId) ?? [];
    list.push(product);
    designsByParent.set(product.parentId, list);
  }
  Array.from(designsByParent.values()).forEach((list) =>
    list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  );
  const topLevel = products.filter((product) => !product.parentId);

  const renderProduct = (p: Product, isDesign: boolean) => {
    const stats = viewStats.get(productTarget(p.id));
    const designs = designsByParent.get(p.id) ?? [];
    return (
      <div
        key={p.id}
        className={`flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gold/15 bg-noir-surface/40 p-5 ${isDesign ? "ml-4 sm:ml-10" : ""}`}
      >
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 font-ui text-xs uppercase tracking-wide ${p.published ? "bg-green-800/40 text-green-300" : "bg-gold/15 text-gold-dim"}`}>
              {p.published ? "Publicado" : "Borrador"}
            </span>
            {p.isCollection && (
              <span className="rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 font-ui text-xs uppercase tracking-wide text-gold-pale">
                Colección · {designs.length} {designs.length === 1 ? "diseño" : "diseños"}
              </span>
            )}
            {isDesign && (
              <span className="rounded-full border border-gold/40 px-2.5 py-0.5 font-ui text-xs uppercase tracking-wide text-gold-pale">
                Diseño
              </span>
            )}
            {!isDesign && (
              <span className="font-ui text-xs text-gold-dim">
                {(p.categoryId && categoryLabels.get(p.categoryId)) || "Sin categoría (elígela al editar)"}
              </span>
            )}
          </div>
          <h3 className="font-display text-lg text-gold-pale">
            {isDesign ? p.variantLabel || p.title : p.title}
            {!p.isCollection && <> · {p.priceUsd ? formatUsdAmount(p.priceUsd) : p.priceLabel}</>}
          </h3>
          {!p.isCollection && (
            <p className="font-ui text-xs text-gold-dim">
              {p.lemonVariantId ? `variant: ${p.lemonVariantId} ` : ""}{p.fileUrl ? "· PDF cargado" : "· falta PDF"}
            </p>
          )}
          {p.published && (
            <p className="mt-1 font-ui text-xs text-gold-pale/80">
              <span className="text-gold">{NUMBER_FORMAT.format(stats?.total ?? 0)}</span>{" "}
              {(stats?.total ?? 0) === 1 ? "visita" : "visitas"} en total ·{" "}
              <span className="text-gold">{NUMBER_FORMAT.format(stats?.last7 ?? 0)}</span> en los últimos 7 días ·{" "}
              <span className="text-gold">{NUMBER_FORMAT.format(stats?.last30 ?? 0)}</span> en los últimos 30
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {p.isCollection && (
            <Link href={`/admin/productos/nuevo?coleccion=${p.id}`}
              className="focus-ring rounded-full bg-gold px-4 py-2 font-ui text-xs font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright">
              + Agregar diseño
            </Link>
          )}
          <CopyProductLinkButton slug={p.slug} />
          <Link href={`/admin/productos/${p.id}`}
            className="focus-ring rounded-full border border-gold/40 px-4 py-2 font-ui text-xs uppercase tracking-wide text-gold transition hover:border-gold hover:bg-gold/10">
            Editar
          </Link>
          <TogglePublishProductButton id={p.id} title={p.title} published={p.published} />
          <DeleteProductButton id={p.id} title={p.title} />
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl text-gold-pale">Productos de la tienda</h1>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin/categorias"
            className="focus-ring rounded-full border border-gold/40 px-5 py-2.5 font-ui text-sm uppercase tracking-wide text-gold transition hover:border-gold hover:bg-gold/10">
            Categorías
          </Link>
          <Link href="/admin/productos/nuevo"
            className="focus-ring rounded-full bg-gold px-5 py-2.5 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright">
            + Nuevo producto
          </Link>
        </div>
      </div>

      <ConvertPricesToUsdButton />

      {/* Visitas: la página /tienda y cada libro (se cuenta una vez por visitante y pestaña; tus visitas no suman) */}
      <section className="mb-8 rounded-xl border border-gold/15 bg-noir-surface/40 p-5">
        <h2 className="font-display text-lg text-gold-pale">Visitas a la tienda</h2>
        <div className="mt-3 grid grid-cols-3 gap-3 text-center">
          {[
            { label: "En total", value: storeStats?.total ?? 0 },
            { label: "Últimos 7 días", value: storeStats?.last7 ?? 0 },
            { label: "Últimos 30 días", value: storeStats?.last30 ?? 0 },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-gold/15 px-2 py-3">
              <p className="font-display text-2xl text-gold">{NUMBER_FORMAT.format(item.value)}</p>
              <p className="mt-1 font-ui text-[11px] uppercase tracking-wide text-gold-dim">{item.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 font-ui text-xs text-gold-dim">
          Es la página /tienda. Más abajo ves cuántas veces se abrió la ficha de cada producto.
        </p>
      </section>

      {products.length === 0 && (
        <p className="font-body text-lg text-gold-dim">Todavía no cargaste ningún producto.</p>
      )}

      <div className="space-y-3">
        {topLevel.map((p) => (
          <div key={p.id} className="space-y-3">
            {renderProduct(p, false)}
            {(designsByParent.get(p.id) ?? []).map((design) => renderProduct(design, true))}
          </div>
        ))}
      </div>
    </div>
  );
}
