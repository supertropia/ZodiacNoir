import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPurchased } from "@/lib/membership";
import { buildCheckoutUrl } from "@/lib/lemonsqueezy";
import { ProductGrid, type ProductViewModel } from "@/components/store/ProductGrid";

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

  const viewModels: ProductViewModel[] = await Promise.all(
    products.map(async (product) => {
      const owned = await hasPurchased(email, product.id);
      const checkoutUrl = buildCheckoutUrl(product.lemonVariantId, {
        email: email ?? undefined,
        redirectPath: "/tienda?compra=1",
      });

      return {
        id: product.id,
        title: product.title,
        description: product.description,
        priceLabel: product.priceLabel,
        coverImage: product.coverImage,
        coverImagePosition: product.coverImagePosition ?? 50,
        heroImage: product.heroImage,
        heroImagePosition: product.heroImagePosition ?? 50,
        galleryImages: (product.galleryImages ?? []) as string[],
        contentHighlights: (product.contentHighlights ?? []) as { title: string; description: string }[],
        testimonials: (product.testimonials ?? []) as { name: string; stars: number; text: string; shared: number }[],
        audienceText: product.audienceText,
        owned,
        fileUrl: owned ? product.fileUrl : null,
        checkoutUrl,
      };
    })
  );

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <p className="font-ui text-xs uppercase tracking-widest2 text-gold-dim">Tienda</p>
      <h1 className="mt-2 font-display text-4xl text-gold-pale">PDFs y guías descargables</h1>
      <p className="mt-4 max-w-2xl font-body text-lg text-gold-pale/85">
        Pago único, entrega inmediata al confirmarse el pago.
      </p>

      {viewModels.length === 0 ? (
        <div className="mt-10 rounded-xl border border-gold/20 bg-noir-surface/50 p-6 font-ui text-sm text-gold-dim">
          Todavía no hay productos cargados. Creá uno nuevo desde <code>/admin/productos/nuevo</code>.
        </div>
      ) : (
        <ProductGrid products={viewModels} />
      )}
    </div>
  );
}
