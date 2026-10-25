import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getStoreViewStats, productTarget, STORE_PAGE_TARGET } from "@/lib/store-views";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";
import { CopyProductLinkButton } from "@/components/admin/CopyProductLinkButton";
import { TogglePublishProductButton } from "@/components/admin/TogglePublishProductButton";
import { ConvertPricesToUsdButton } from "@/components/admin/ConvertPricesToUsdButton";
import { formatUsdAmount } from "@/lib/pricing";

export const dynamic = "force-dynamic";

const NUMBER_FORMAT = new Intl.NumberFormat("es-AR");

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
  const viewStats = await getStoreViewStats();
  const storeStats = viewStats.get(STORE_PAGE_TARGET);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl text-gold-pale">Productos (PDFs)</h1>
        <Link href="/admin/productos/nuevo"
          className="focus-ring rounded-full bg-gold px-5 py-2.5 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright">
          + Nuevo producto
        </Link>
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
          Es la página /tienda. Más abajo ves cuántas veces se abrió la ficha de cada libro.
        </p>
      </section>

      {products.length === 0 && (
        <p className="font-body text-lg text-gold-dim">Todavía no cargaste ningún producto.</p>
      )}

      <div className="space-y-3">
        {products.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gold/15 bg-noir-surface/40 p-5">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 font-ui text-xs uppercase tracking-wide ${p.published ? "bg-green-800/40 text-green-300" : "bg-gold/15 text-gold-dim"}`}>
                  {p.published ? "Publicado" : "Borrador"}
                </span>
              </div>
              <h3 className="font-display text-lg text-gold-pale">{p.title} · {p.priceUsd ? formatUsdAmount(p.priceUsd) : p.priceLabel}</h3>
              <p className="font-ui text-xs text-gold-dim">variant: {p.lemonVariantId} {p.fileUrl ? "· PDF cargado" : "· falta PDF"}</p>
              {p.published && (
                <p className="mt-1 font-ui text-xs text-gold-pale/80">
                  <span className="text-gold">{NUMBER_FORMAT.format(viewStats.get(productTarget(p.id))?.total ?? 0)}</span>{" "}
                  {(viewStats.get(productTarget(p.id))?.total ?? 0) === 1 ? "visita" : "visitas"} en total ·{" "}
                  <span className="text-gold">{NUMBER_FORMAT.format(viewStats.get(productTarget(p.id))?.last7 ?? 0)}</span> en los últimos 7 días ·{" "}
                  <span className="text-gold">{NUMBER_FORMAT.format(viewStats.get(productTarget(p.id))?.last30 ?? 0)}</span> en los últimos 30
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <CopyProductLinkButton slug={p.slug} />
              <Link href={`/admin/productos/${p.id}`}
                className="focus-ring rounded-full border border-gold/40 px-4 py-2 font-ui text-xs uppercase tracking-wide text-gold transition hover:border-gold hover:bg-gold/10">
                Editar
              </Link>
              <TogglePublishProductButton id={p.id} title={p.title} published={p.published} />
              <DeleteProductButton id={p.id} title={p.title} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
