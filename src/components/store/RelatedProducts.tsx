import Link from "next/link";
import { Slider } from "@/components/store/Slider";
import type { RelatedItem } from "@/lib/related-products";

/** «Productos relacionados»: otros productos de la misma categoría, en una tira deslizable. Sin trabajo manual. */
export function RelatedProducts({ items }: { items: RelatedItem[] }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="productos-relacionados" className="mt-12 border-t border-gold/20 pt-8">
      <h3 id="productos-relacionados" className="mb-5 font-display text-xl text-gold-pale">
        Productos relacionados
      </h3>
      <Slider label="Productos relacionados">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/tienda/${item.slug}`}
            className="focus-ring group flex h-full flex-col overflow-hidden rounded-2xl border border-gold/25 bg-noir-surface/40 transition hover:-translate-y-0.5 hover:border-gold/60"
          >
            <span className="flex aspect-[4/5] items-center justify-center bg-noir-surface2 p-2">
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image} alt="" loading="lazy" decoding="async" className="max-h-full max-w-full rounded object-contain" />
              ) : (
                <span className="font-display text-4xl text-gold/50" aria-hidden="true">
                  ✦
                </span>
              )}
            </span>
            <span className="flex flex-1 flex-col p-3.5">
              <span className="font-ui text-[11px] uppercase tracking-wide text-gold-dim">Producto digital</span>
              <span className="mt-1 font-display text-base leading-snug text-gold-pale">{item.title}</span>
              {item.priceText && <span className="mt-auto pt-2 font-ui text-sm text-gold">{item.priceText}</span>}
            </span>
          </Link>
        ))}
      </Slider>
    </section>
  );
}
