import Link from "next/link";
import { categoryHref, type CategoryNode } from "@/lib/store-categories";

/**
 * Tarjetas grandes para explorar la tienda por categoría. Toda la tarjeta es un enlace a la categoría;
 * las subcategorías son enlaces propios, encima de la tarjeta.
 */
export function CategoryCards({ categories }: { categories: CategoryNode[] }) {
  if (categories.length === 0) return null;

  const columns = categories.length === 1 ? "" : categories.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <ul role="list" className={`mt-6 grid gap-5 ${columns}`}>
      {categories.map((category) => (
        <li key={category.id}>
          <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gold/25 bg-noir-bg transition duration-300 focus-within:ring-2 focus-within:ring-gold/50 hover:-translate-y-1 hover:border-gold/60 hover:shadow-[0_18px_40px_-18px_rgba(38,24,63,0.35)]">
            <div className="flex aspect-[16/8] items-center justify-center overflow-hidden bg-gradient-to-br from-noir-surface to-noir-surface2">
              {category.image ? (
                <img
                  src={category.image}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              ) : (
                <span className="font-display text-6xl text-gold/50" aria-hidden="true">
                  ✦
                </span>
              )}
            </div>

            <div className="flex flex-1 flex-col border-t border-gold/20 p-5">
              <h3 className="font-display text-xl font-semibold leading-snug text-gold-pale">
                {/* El enlace se estira sobre toda la tarjeta: un clic en cualquier parte abre la categoría. */}
                <Link href={categoryHref(category.slug)} className="focus-ring after:absolute after:inset-0 after:rounded-2xl">
                  {category.name}
                </Link>
              </h3>
              {category.description && (
                <p className="mt-2 font-body text-base leading-snug text-gold-pale/80 [-webkit-box-orient:vertical] [-webkit-line-clamp:3] [display:-webkit-box] overflow-hidden">
                  {category.description}
                </p>
              )}

              {category.children.length > 0 && (
                <ul className="relative z-10 mt-3 flex flex-wrap gap-1.5">
                  {category.children.map((child) => (
                    <li key={child.id}>
                      <Link
                        href={categoryHref(child.slug)}
                        className="focus-ring inline-block rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 font-ui text-[11px] uppercase tracking-wide text-gold-pale transition hover:border-gold hover:bg-gold/20"
                      >
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-auto flex items-center justify-between gap-3 border-t border-gold/15 pt-3 mt-4">
                <span className="font-ui text-sm text-gold-dim">
                  {category.productCount} {category.productCount === 1 ? "producto" : "productos"}
                </span>
                <span className="font-ui text-xs uppercase tracking-wide text-gold-pale transition group-hover:text-gold">
                  Ver todo →
                </span>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
