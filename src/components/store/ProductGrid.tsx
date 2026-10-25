"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AmazonPrice, ProductDetail } from "@/components/store/ProductDetail";
import { toPlainText } from "@/components/store/FormattedText";
import type { ProductViewModel } from "@/lib/store-products";
import { formatUsdAmount } from "@/lib/pricing";

export type { ProductViewModel } from "@/lib/store-products";

export function ProductGrid({
  products,
  initialProductSlug,
  sectionId = "libros",
}: {
  products: ProductViewModel[];
  initialProductSlug?: string;
  // Identifica la cuadrícula cuando hay más de una en la misma página (libros y material PDF).
  sectionId?: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const detalleRef = useRef<HTMLDivElement>(null);

  const scrollToDetail = (delay: number) => {
    // Esperamos un instante a que la ficha se monte/expanda antes de scrollear,
    // así el usuario ve la descripción del producto de inmediato al tocar la tarjeta.
    setTimeout(() => {
      detalleRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, delay);
  };

  useEffect(() => {
    if (!initialProductSlug) return;
    const match = products.find((p) => p.slug === initialProductSlug);
    if (match) {
      setOpenId(match.id);
      scrollToDetail(100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProductSlug]);

  const openProduct = useMemo(
    () => products.find((p) => p.id === openId) ?? null,
    [products, openId]
  );

  const openLanding = (id: string) => {
    const willOpen = openId !== id;
    setOpenId((current) => (current === id ? null : id));
    if (willOpen) scrollToDetail(120);
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "https://zodiacnoirweb.com";

  return (
    <div>
      <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => {
          const isOpen = openId === product.id;
          // Portada completa del libro: se prefiere la imagen alta (hero) y, si no existe, la de la tarjeta.
          const stageImage = product.heroImage ?? product.coverImage;
          const hasPdf = Boolean(product.priceUsd) || Boolean(product.priceArs) || product.owned;
          return (
            <li key={product.id} className="flex">
              <div
                className={`group relative flex w-full flex-col overflow-hidden rounded-2xl border bg-noir-bg transition duration-300 focus-within:ring-2 focus-within:ring-gold/50 hover:-translate-y-1 hover:border-gold/60 hover:shadow-[0_18px_40px_-18px_rgba(38,24,63,0.35)] ${
                  isOpen ? "border-gold ring-2 ring-gold/40" : "border-gold/25"
                }`}
              >
                {/* Escenario de la portada: fondo lila suave y la imagen completa, sin recortes ni degradados encima */}
                <div className="flex aspect-[4/5] items-center justify-center bg-gradient-to-b from-noir-surface to-noir-surface2 p-5">
                  {stageImage ? (
                    <img
                      src={stageImage}
                      alt={product.coverImageAlt || `Portada del libro ${product.title}`}
                      loading="lazy"
                      decoding="async"
                      className="max-h-full max-w-full rounded-lg object-contain shadow-[0_14px_30px_-10px_rgba(18,13,28,0.55)] ring-1 ring-gold/30 transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <span className="font-display text-5xl text-gold/50" aria-hidden="true">
                      ✦
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col border-t border-gold/20 p-5">
                  <ul className="mb-3 flex flex-wrap gap-1.5 font-ui text-[11px] uppercase tracking-wide">
                    {product.owned && (
                      <li className="rounded-full bg-gold px-2.5 py-1 font-medium text-noir-bg">Ya lo tienes</li>
                    )}
                    {hasPdf && (
                      <li className="rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-gold-pale">PDF</li>
                    )}
                    {product.amazonKindleUrl && (
                      <li className="rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-gold-pale">Kindle</li>
                    )}
                    {product.amazonPaperbackUrl && (
                      <li className="rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-gold-pale">
                        Libro físico
                      </li>
                    )}
                  </ul>

                  <h3 className="font-display text-lg font-semibold leading-snug text-gold-pale">
                    {/* El botón se estira sobre toda la tarjeta: un clic en cualquier parte abre la ficha,
                        y el título sigue siendo un encabezado real para buscadores y lectores de pantalla. */}
                    <button
                      type="button"
                      onClick={() => openLanding(product.id)}
                      aria-expanded={isOpen}
                      aria-controls={`ficha-${sectionId}`}
                      className="focus-ring text-left after:absolute after:inset-0 after:rounded-2xl"
                    >
                      {product.title}
                    </button>
                  </h3>

                  <p className="mt-2 flex-1 font-body text-base leading-snug text-gold-pale/80 [-webkit-box-orient:vertical] [-webkit-line-clamp:3] [display:-webkit-box] overflow-hidden">
                    {toPlainText(product.description)}
                  </p>

                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-gold/15 pt-3">
                    <span className="font-ui text-sm font-medium text-gold-pale">
                      {product.priceUsd ? (
                        formatUsdAmount(product.priceUsd)
                      ) : product.priceArs ? (
                        `ARS ${product.priceArs.toLocaleString("es-AR")}`
                      ) : product.amazonKindlePrice ? (
                        <AmazonPrice value={product.amazonKindlePrice} />
                      ) : (
                        ""
                      )}
                    </span>
                    <span className="font-ui text-xs uppercase tracking-wide text-gold-pale transition group-hover:text-gold">
                      {isOpen ? "Ver ficha ↓" : "Ver descripción →"}
                    </span>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Ficha completa compartida */}
      <div
        id={`ficha-${sectionId}`}
        role="region"
        aria-label={openProduct ? `Ficha de ${openProduct.title}` : "Ficha del libro"}
        className={`grid scroll-mt-36 overflow-hidden rounded-2xl border border-gold/25 bg-noir-surface transition-[grid-template-rows,margin-top] duration-500 sm:scroll-mt-24 ${
          openProduct ? "mt-9 grid-rows-[1fr]" : "mt-0 grid-rows-[0fr] border-transparent"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          {openProduct && (
            <div className="p-6 sm:p-10">
              <ProductDetail
                key={openProduct.id}
                product={openProduct}
                titleAs="h2"
                shareUrl={`${origin}/tienda/${openProduct.slug}`}
                pageHref={`/tienda/${openProduct.slug}`}
                onClose={() => setOpenId(null)}
                // La portada es alta y tarda en cargar; una vez que carga, la ficha crece y el título
                // se corre hacia abajo. Recalculamos el scroll para que el título y los botones queden visibles.
                onHeroLoad={() => scrollToDetail(0)}
                detailRef={detalleRef}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
