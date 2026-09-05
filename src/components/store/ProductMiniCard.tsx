import Link from "next/link";

export type ProductCardData = {
  id: string;
  slug: string;
  title: string;
  priceLabel: string;
  coverImage: string | null;
  coverImagePosition: number;
};

export function ProductMiniCard({ product }: { product: ProductCardData }) {
  return (
    <Link
      href={`/tienda?producto=${product.slug}`}
      className="group block overflow-hidden rounded-2xl border border-gold/15 bg-noir-surface/40 transition hover:border-gold/50 hover:bg-noir-surface"
    >
      {product.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.coverImage}
          alt=""
          className="h-36 w-full object-cover"
          style={{ objectPosition: `center ${product.coverImagePosition}%` }}
        />
      )}
      <div className="p-6">
        <p className="font-ui text-xs uppercase tracking-wide text-gold-dim">Material relacionado</p>
        <h3 className="mt-2 font-display text-xl leading-snug text-gold-pale group-hover:text-gold">
          {product.title}
        </h3>
        <div className="mt-4 flex items-center justify-between">
          <span className="font-ui text-sm text-gold">{product.priceLabel}</span>
          <span className="font-body text-sm italic text-gold-dim">Ver en la tienda ↗</span>
        </div>
      </div>
    </Link>
  );
}
