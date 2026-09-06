import Link from "next/link";

export type ProductCardData = {
  id: string;
  slug: string;
  title: string;
  description: string;
  priceArs: number | null;
  coverImage: string | null;
  coverImagePosition: number;
};

export function ProductMiniCard({ product }: { product: ProductCardData }) {
  return (
    <Link
      href={`/tienda?producto=${product.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gold/15 bg-noir-surface/40 transition duration-300 hover:-translate-y-1 hover:border-gold/50 hover:bg-noir-surface hover:shadow-xl hover:shadow-black/30"
    >
      {product.coverImage && (
        <div className="flex h-44 w-full shrink-0 items-center justify-center bg-noir-bg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.coverImage}
            alt=""
            className="h-full w-full object-contain"
            style={{ objectPosition: `center ${product.coverImagePosition}%` }}
          />
        </div>
      )}
      <div className="flex flex-1 flex-col p-6">
        <p className="font-ui text-xs uppercase tracking-wide text-gold-dim">Material relacionado</p>
        <h3 className="mt-2 font-display text-xl leading-snug text-gold-pale group-hover:text-gold [-webkit-box-orient:vertical] [-webkit-line-clamp:2] [display:-webkit-box] overflow-hidden">
          {product.title}
        </h3>
        <p className="mt-2 font-body text-sm text-gold-pale/75 [-webkit-box-orient:vertical] [-webkit-line-clamp:3] [display:-webkit-box] overflow-hidden">
          {product.description}
        </p>
        <div className="mt-auto flex items-center justify-between pt-4">
          <span className="font-ui text-sm text-gold">
            {product.priceArs ? `ARS ${product.priceArs.toLocaleString("es-AR")}` : ""}
          </span>
          <span className="font-body text-sm italic text-gold-dim">Ver en la tienda ↗</span>
        </div>
      </div>
    </Link>
  );
}
