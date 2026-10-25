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

/** Primer párrafo de la descripción, cortado en una palabra entera y cerrado con puntos suspensivos. */
function shortDescription(text: string, max = 140): string {
  const firstParagraph =
    text
      .split(/\n+/)
      .map((p) => p.trim())
      .find(Boolean) ?? "";
  if (firstParagraph.length <= max) return firstParagraph;
  const cut = firstParagraph.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  const clean = (lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trimEnd().replace(/[.,;:—-]+$/, "");
  return `${clean}…`;
}

export function ProductMiniCard({ product }: { product: ProductCardData }) {
  return (
    <Link
      href={`/tienda/${product.slug}`}
      className="group flex h-full flex-row overflow-hidden rounded-2xl border border-gold/15 bg-noir-surface/40 transition duration-300 hover:-translate-y-1 hover:border-gold/50 hover:bg-noir-surface hover:shadow-xl hover:shadow-black/30 sm:flex-col"
    >
      {product.coverImage && (
        <div className="flex h-full w-24 shrink-0 items-center justify-center bg-noir-bg sm:h-44 sm:w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.coverImage}
            alt=""
            className="h-full w-full object-contain"
            style={{ objectPosition: `center ${product.coverImagePosition}%` }}
          />
        </div>
      )}
      <div className="flex flex-1 flex-col p-4 sm:p-6">
        <p className="hidden font-ui text-xs uppercase tracking-wide text-gold-dim sm:block">Material relacionado</p>
        <h3 className="font-display text-base leading-snug text-gold-pale group-hover:text-gold sm:mt-2 sm:text-xl [-webkit-box-orient:vertical] [-webkit-line-clamp:2] [display:-webkit-box] overflow-hidden">
          {product.title}
        </h3>
        <p className="mt-2 hidden font-body text-sm text-gold-pale/75 sm:block">
          {shortDescription(product.description)}
        </p>
        <div className="mt-auto flex items-center justify-between pt-3 sm:pt-4">
          <span className="font-ui text-sm text-gold">
            {product.priceArs ? `ARS ${product.priceArs.toLocaleString("es-AR")}` : ""}
          </span>
          <span className="hidden font-body text-sm italic text-gold-dim sm:block">Ver en la tienda ↗</span>
        </div>
      </div>
    </Link>
  );
}
