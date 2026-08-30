import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";
import { CopyProductLinkButton } from "@/components/admin/CopyProductLinkButton";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl text-gold-pale">Productos (PDFs)</h1>
        <Link href="/admin/productos/nuevo"
          className="focus-ring rounded-full bg-gold px-5 py-2.5 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright">
          + Nuevo producto
        </Link>
      </div>

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
              <h3 className="font-display text-lg text-gold-pale">{p.title} · {p.priceLabel}</h3>
              <p className="font-ui text-xs text-gold-dim">variant: {p.lemonVariantId} {p.fileUrl ? "· PDF cargado" : "· falta PDF"}</p>
            </div>
            <div className="flex items-center gap-3">
              <CopyProductLinkButton slug={p.slug} />
              <Link href={`/admin/productos/${p.id}`}
                className="focus-ring rounded-full border border-gold/40 px-4 py-2 font-ui text-xs uppercase tracking-wide text-gold transition hover:border-gold hover:bg-gold/10">
                Editar
              </Link>
              <DeleteProductButton id={p.id} title={p.title} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
