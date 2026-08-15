import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPurchased } from "@/lib/membership";
import { buildCheckoutUrl } from "@/lib/lemonsqueezy";

export const metadata = {
  title: "Tienda",
  description: "PDFs de astrología, tarot y efemérides para descargar: guías de tránsitos, cartas natales y más.",
};

export const dynamic = "force-dynamic";

export default async function TiendaPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;

  const products = await prisma.product.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <p className="font-ui text-xs uppercase tracking-widest2 text-gold-dim">Tienda</p>
      <h1 className="mt-2 font-display text-4xl text-gold-pale">PDFs y guías descargables</h1>
      <p className="mt-4 max-w-2xl font-body text-lg text-gold-pale/85">
        Pago único, entrega inmediata al confirmarse el pago.
      </p>

      {products.length === 0 && (
        <div className="mt-10 rounded-xl border border-gold/20 bg-noir-surface/50 p-6 font-ui text-sm text-gold-dim">
          Todavía no hay productos cargados. Subí tus PDFs a Vercel Blob, creá la variante
          correspondiente en Lemon Squeezy y agregá una fila en la tabla <code>Product</code> con
          su <code>lemonVariantId</code> y <code>fileUrl</code>.
        </div>
      )}

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} email={email} />
        ))}
      </div>
    </div>
  );
}

async function ProductCard({
  product,
  email,
}: {
  product: Awaited<ReturnType<typeof prisma.product.findMany>>[number];
  email: string | null;
}) {
  const owned = await hasPurchased(email, product.id);
  const checkoutUrl = buildCheckoutUrl(product.lemonVariantId, {
    email: email ?? undefined,
    redirectPath: "/tienda?compra=1",
  });

  return (
    <div className="rounded-2xl border border-gold/20 bg-noir-surface/50 p-6">
      <h2 className="font-display text-xl text-gold-pale">{product.title}</h2>
      <p className="mt-2 font-body text-sm text-gold-pale/80">{product.description}</p>
      <p className="mt-4 font-ui text-lg text-gold">{product.priceLabel}</p>

      {owned && product.fileUrl ? (
        <a
          href={product.fileUrl}
          className="focus-ring mt-4 inline-block w-full rounded-full border border-gold px-5 py-2.5 text-center font-ui text-sm uppercase tracking-wide text-gold hover:bg-gold/10"
        >
          Descargar PDF
        </a>
      ) : checkoutUrl ? (
        <a
          href={checkoutUrl}
          className="focus-ring mt-4 inline-block w-full rounded-full bg-gold px-5 py-2.5 text-center font-ui text-sm font-medium uppercase tracking-wide text-noir-bg hover:bg-gold-bright"
        >
          Comprar
        </a>
      ) : (
        <p className="mt-4 font-ui text-xs text-gold-dim">Falta configurar LEMONSQUEEZY_STORE.</p>
      )}
    </div>
  );
}
