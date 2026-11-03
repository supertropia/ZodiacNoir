import Link from "next/link";
import { categoryHref, type CategoryNode } from "@/lib/store-categories";

const chipBase =
  "focus-ring inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 font-ui text-sm transition";
const chipOn = "border-gold bg-gold text-noir-bg";
const chipOff = "border-gold/30 text-gold-pale hover:border-gold hover:bg-gold/10";

/**
 * Barra de navegación de la tienda: «Todo» y una pestaña por categoría, con la cantidad de productos.
 * Cuando se está dentro de una categoría que tiene subcategorías, debajo aparece una segunda fila con ellas.
 * Son enlaces comunes (no filtros en pantalla), así cada categoría tiene su propia dirección y la encuentra Google.
 */
export function StoreNav({
  tree,
  totalCount,
  activeSlug,
}: {
  tree: CategoryNode[];
  totalCount: number;
  /** La categoría o subcategoría que se está viendo. Sin valor = «Todo». */
  activeSlug?: string | null;
}) {
  const activeTop = activeSlug ? tree.find((c) => c.slug === activeSlug || c.children.some((s) => s.slug === activeSlug)) : null;
  const activeChild = activeTop && activeSlug ? activeTop.children.find((s) => s.slug === activeSlug) ?? null : null;

  return (
    <nav aria-label="Categorías de la tienda" className="space-y-3">
      <ul className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
        <li>
          <Link href="/tienda" aria-current={!activeSlug ? "page" : undefined} className={`${chipBase} ${!activeSlug ? chipOn : chipOff}`}>
            Todo <span className="text-xs opacity-70">{totalCount}</span>
          </Link>
        </li>
        {tree.map((category) => {
          const isActive = activeTop?.id === category.id;
          return (
            <li key={category.id}>
              <Link
                href={categoryHref(category.slug)}
                aria-current={isActive && !activeChild ? "page" : undefined}
                className={`${chipBase} ${isActive ? chipOn : chipOff}`}
              >
                {category.name} <span className="text-xs opacity-70">{category.productCount}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {activeTop && activeTop.children.length > 0 && (
        <ul
          aria-label={`Subcategorías de ${activeTop.name}`}
          className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
        >
          <li>
            <Link
              href={categoryHref(activeTop.slug)}
              aria-current={!activeChild ? "page" : undefined}
              className={`${chipBase} py-1.5 text-xs ${!activeChild ? "border-gold/60 bg-gold/15 text-gold-pale" : chipOff}`}
            >
              Todo en {activeTop.name}
            </Link>
          </li>
          {activeTop.children.map((child) => {
            const isActive = activeChild?.id === child.id;
            return (
              <li key={child.id}>
                <Link
                  href={categoryHref(child.slug)}
                  aria-current={isActive ? "page" : undefined}
                  className={`${chipBase} py-1.5 text-xs ${isActive ? "border-gold/60 bg-gold/15 text-gold-pale" : chipOff}`}
                >
                  {child.name} <span className="opacity-70">{child.productCount}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </nav>
  );
}
