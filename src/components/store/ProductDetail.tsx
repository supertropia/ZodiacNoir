"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { ShareButtons } from "@/components/ShareButtons";
import { FormattedText } from "@/components/store/FormattedText";
import { htmlToPlain, looksLikeHtml } from "@/lib/html-text";
import { StoreViewTracker } from "@/components/store/StoreViewTracker";
import { ProductVideo } from "@/components/store/ProductVideo";
import type { ProductViewModel } from "@/lib/store-products";
import { mergeDesign } from "@/lib/store-designs";
import { PaypalButton } from "@/components/PaypalButton";
import { BrandLabel, MERCADOPAGO_BUTTON_CLASS } from "@/components/PaymentBrand";
import { FX_NOTE, formatArsAmount, formatUsdAmount } from "@/lib/pricing";

function Carousel({
  itemCount,
  renderItem,
  itemClassName = "w-full sm:w-1/2 lg:w-1/3",
  autoPlayMs,
}: {
  itemCount: number;
  renderItem: (index: number) => ReactNode;
  itemClassName?: string;
  // Si se pasa, el carrusel avanza solo cada tantos milisegundos (se pausa al pasar el mouse por encima).
  autoPlayMs?: number;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const scrollToIndex = (i: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const child = el.children[i] as HTMLElement | undefined;
    if (child) el.scrollTo({ left: child.offsetLeft, behavior: "smooth" });
  };

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const children = Array.from(el.children) as HTMLElement[];
    let closest = 0;
    let minDist = Infinity;
    children.forEach((c, i) => {
      const dist = Math.abs(c.offsetLeft - el.scrollLeft);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    });
    setIndex(closest);
  };

  // Avance automático: sólo si se pidió autoPlayMs, hay más de un elemento,
  // y el usuario no tiene el mouse encima (así puede quedarse leyendo un comentario sin que se mueva).
  useEffect(() => {
    if (!autoPlayMs || itemCount < 2 || isHovered) return;
    const timer = setInterval(() => {
      setIndex((current) => {
        const next = (current + 1) % itemCount;
        scrollToIndex(next);
        return next;
      });
    }, autoPlayMs);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlayMs, itemCount, isHovered]);

  if (itemCount === 0) return null;

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {Array.from({ length: itemCount }).map((_, i) => (
          <div key={i} className={`shrink-0 snap-start ${itemClassName}`}>
            {renderItem(i)}
          </div>
        ))}
      </div>

      {itemCount > 1 && (
        <>
          <button
            type="button"
            onClick={() => scrollToIndex(Math.max(0, index - 1))}
            aria-label="Anterior"
            className="focus-ring absolute left-0 top-1/2 hidden h-9 w-9 -translate-x-3 -translate-y-1/2 items-center justify-center rounded-full border border-gold bg-noir-bg text-lg text-gold-pale shadow hover:bg-gold hover:text-noir-bg sm:flex"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => scrollToIndex(Math.min(itemCount - 1, index + 1))}
            aria-label="Siguiente"
            className="focus-ring absolute right-0 top-1/2 hidden h-9 w-9 -translate-y-1/2 translate-x-3 items-center justify-center rounded-full border border-gold bg-noir-bg text-lg text-gold-pale shadow hover:bg-gold hover:text-noir-bg sm:flex"
          >
            ›
          </button>
          <div className="mt-3 flex justify-center gap-1.5">
            {Array.from({ length: itemCount }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollToIndex(i)}
                aria-label={`Ir al elemento ${i + 1}`}
                className={`h-1.5 w-1.5 rounded-full transition ${
                  i === index ? "bg-gold" : "bg-gold/30"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Muestra el precio de Amazon con "USD" pequeño y tenue al lado del monto.
// Acepta cualquier formato guardado ("9,99", "$9.99", "USD 14,99") y lo normaliza.
// Si el texto tiene otra moneda (por ejemplo €), se muestra tal cual, sin agregar USD.
export function AmazonPrice({ value }: { value: string }) {
  const raw = value.trim();
  if (/€|eur/i.test(raw)) return <span>{raw}</span>;
  const amount = raw.replace(/us\$|usd/gi, "").replace(/\s+/g, "").trim();
  const withSymbol = amount.startsWith("$") ? amount : `$${amount}`;
  return (
    <span className="whitespace-nowrap">
      {withSymbol}
      <span className="ml-1 text-[10px] font-normal tracking-wider opacity-70">USD</span>
    </span>
  );
}

/** Texto de un producto: si viene del editor visual (HTML ya limpio desde el servidor) se muestra con su formato; si es texto simple, como siempre. */
function RichDescription({ text, className }: { text: string; className: string }) {
  if (looksLikeHtml(text)) {
    return (
      <div
        className={`prose-zodiac ${className}`}
        style={{ fontSize: "1.125rem" }}
        dangerouslySetInnerHTML={{ __html: text }}
      />
    );
  }
  return <FormattedText text={text} autoParagraphs className={className} />;
}

const SECTION_CLASS = "mt-10 border-t border-gold/20 pt-8";
const SECTION_TITLE_CLASS = "mb-5 font-display text-xl text-gold-pale";

// Precio corto de un diseño para su tarjeta de selección.
function designPriceText(design: ProductViewModel): string {
  if (design.priceUsd && design.priceUsd > 0) return formatUsdAmount(design.priceUsd);
  if (design.priceArs) return formatArsAmount(design.priceArs);
  return "";
}/**
 * Diseños de una colección, uno al lado del otro como tarjetas. Al tocar una se abre su ficha completa,
 * como si fuera un artículo aparte.
 */
function DesignGrid({
  designs,
  openSlug,
  onOpen,
}: {
  designs: ProductViewModel[];
  openSlug: string | null;
  onOpen: (slug: string) => void;
}) {
  return (
    <div role="group" aria-label="Diseños de esta colección" className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      {designs.map((design) => {
        const selected = design.slug === openSlug;
        const thumb = design.coverImage ?? design.heroImage;
        const price = designPriceText(design);
        const extra = htmlToPlain(design.description);
        return (
          <button
            key={design.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onOpen(design.slug)}
            className={`focus-ring flex flex-col overflow-hidden rounded-2xl border text-left transition hover:-translate-y-0.5 ${
              selected ? "border-gold bg-gold/10 ring-2 ring-gold/40" : "border-gold/25 bg-noir-surface/40 hover:border-gold/60"
            }`}
          >
            <span className="flex aspect-[4/5] items-center justify-center bg-noir-surface2 p-2">
              {thumb ? (
                <img src={thumb} alt="" loading="lazy" decoding="async" className="max-h-full max-w-full rounded object-contain" />
              ) : (
                <span className="font-display text-4xl text-gold/50" aria-hidden="true">
                  ✦
                </span>
              )}
            </span>
            <span className="flex flex-1 flex-col p-3.5">
              <span className="block font-display text-base leading-snug text-gold-pale">
                {design.variantLabel || design.title}
              </span>
              {extra && (
                <span className="mt-1.5 line-clamp-3 block font-body text-sm leading-snug text-gold-pale/75">{extra}</span>
              )}
              <span className="mt-auto block pt-2.5 font-ui text-xs text-gold-dim">
                {price}
                {design.owned ? `${price ? " · " : ""}Ya lo tienes` : ""}
              </span>
              <span className="mt-2 block font-ui text-[11px] uppercase tracking-wide text-gold">
                {selected ? "Viendo este diseño ↓" : "Ver este diseño"}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Formas de compra de un producto (o de un diseño): PDF con Mercado Pago / PayPal y Amazon.
 * Cada uso lleva su propio estado de «Redirigiendo…» y de error.
 */
function BuyPanel({ product, showReview = true }: { product: ProductViewModel; showReview?: boolean }) {
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState("");

  const payWithMercadoPago = async () => {
    setPayLoading(true);
    setPayError("");
    try {
      const res = await fetch("/api/mercadopago/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo iniciar el pago.");
      window.location.href = data.url;
    } catch (err) {
      setPayError(err instanceof Error ? err.message : "No se pudo iniciar el pago.");
      setPayLoading(false);
    }
  };

  // Precio publicado: en dólares. Los productos viejos que solo tienen precio en pesos siguen igual.
  const hasUsdPrice = Boolean(product.priceUsd && product.priceUsd > 0);
  const hasMercadoPago = hasUsdPrice || Boolean(product.priceArs);
  const hasPdfOffer = product.owned || hasMercadoPago;
  const hasAmazon = Boolean(product.amazonKindleUrl || product.amazonPaperbackUrl);

  return (
    <>
          {payError && <p className="mt-4 font-ui text-sm text-wine-bright">{payError}</p>}

          <div className="mt-7 grid items-stretch gap-3 sm:grid-cols-2">
            {hasPdfOffer && (
              <div className="flex h-full flex-col rounded-xl border border-gold/25 bg-noir-surface2/50 p-4">
                <p className="font-ui text-xs uppercase tracking-wide text-gold-pale">PDF digital · descarga inmediata</p>
                <p className="mt-0.5 font-ui text-[11px] text-gold-dim">
                  {product.paypal !== "hidden" && hasUsdPrice
                    ? "Mercado Pago (Latinoamérica) o PayPal (todo el mundo)"
                    : "Mercado Pago · válido para LATAM"}
                </p>
                <p className="mt-1 flex items-center gap-1 font-ui text-[11px] text-sky-400">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Compra segura
                </p>

                <div className="mt-auto pt-3">
                  {product.owned && product.fileUrl ? (
                    <a href={product.fileUrl}
                      className="focus-ring block w-full rounded-full bg-gold px-5 py-2.5 text-center font-ui text-sm font-medium uppercase tracking-wide text-noir-bg hover:bg-gold-bright"
                    >
                      Descargar PDF
                    </a>
                  ) : (
                    <>
                      {hasUsdPrice ? (
                        <div className="mb-3">
                          <p className="font-ui text-lg font-medium text-gold-pale">{formatUsdAmount(product.priceUsd!)}</p>
                          <p className="mt-0.5 font-ui text-[11px] leading-snug text-gold-dim">
                            {product.priceArsEstimate
                              ? `≈ ${formatArsAmount(product.priceArsEstimate)} con Mercado Pago. ${FX_NOTE}`
                              : FX_NOTE}
                          </p>
                        </div>
                      ) : (
                        <p className="mb-2 font-ui text-lg font-medium text-gold-pale">
                          ARS {product.priceArs?.toLocaleString("es-AR")}
                        </p>
                      )}
                      <div className="space-y-2.5">
                        <button
                          type="button"
                          disabled={payLoading}
                          onClick={payWithMercadoPago}
                          className={MERCADOPAGO_BUTTON_CLASS}
                        >
                          <BrandLabel brand="mercadopago">
                            {payLoading ? "Redirigiendo…" : hasUsdPrice ? "Comprar con Mercado Pago" : "Comprar"}
                          </BrandLabel>
                        </button>
                        {hasUsdPrice && (
                          <PaypalButton
                            endpoint="/api/paypal/create-order"
                            body={{ productId: product.id }}
                            visibility={product.paypal}
                            label="Comprar con PayPal"
                          />
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {hasAmazon && (
              <div className="flex h-full flex-col rounded-xl border border-gold/25 bg-noir-surface2/50 p-4">
                <p className="font-ui text-xs uppercase tracking-wide text-gold-pale">Adquirir en Amazon</p>
                <p className="mt-0.5 font-ui text-[11px] text-gold-dim">
                  Envío y entrega dependen exclusivamente de Amazon según tu ubicación.
                </p>
                <p className="mt-1 flex items-center gap-1 font-ui text-[11px] text-sky-400">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Compra segura
                </p>
                {product.amazonKindleUrl && (
                  <p className="mt-1.5 font-ui text-[11px] text-gold-dim">
                    Kindle (digital) · disponible en <span className="text-gold-pale">Kindle Unlimited</span>
                  </p>
                )}
                <div className="mt-auto space-y-2.5 pt-3">
                  {product.amazonKindleUrl && (
                    <a target="_blank"
                      rel="noreferrer"
                      href={product.amazonKindleUrl}
                      className="focus-ring flex min-h-[3.75rem] items-center justify-between gap-3 rounded-full bg-gold px-5 py-2.5 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg hover:bg-gold-bright"
                    >
                      <span>Kindle</span>
                      {product.amazonKindlePrice && <AmazonPrice value={product.amazonKindlePrice} />}
                    </a>
                  )}
                  {product.amazonPaperbackUrl && (
                    <a target="_blank"
                      rel="noreferrer"
                      href={product.amazonPaperbackUrl}
                      className="focus-ring flex min-h-[3.75rem] items-center justify-between gap-3 rounded-full bg-gold px-5 py-2.5 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg hover:bg-gold-bright"
                    >
                      <span>Libro físico</span>
                      {product.amazonPaperbackPrice && <AmazonPrice value={product.amazonPaperbackPrice} />}
                    </a>
                  )}
                </div>
              </div>
            )}

            {!hasPdfOffer && !hasAmazon && (
              <p className="font-ui text-xs text-gold-dim sm:col-span-2">
                Este producto todavía no tiene una forma de pago configurada.
              </p>
            )}

            {typeof product.salesCount === "number" && product.salesCount > 0 && (
              <div className="rounded-xl border border-gold/25 bg-gold/5 px-4 py-3 text-center sm:col-span-2">
                <span className="font-ui text-sm uppercase tracking-wide text-gold-pale">
                  {product.salesCount.toLocaleString("es-AR")}{" "}
                  {product.salesCount === 1 ? "persona ya lo compró" : "personas ya lo compraron"}
                </span>
              </div>
            )}

            {showReview && (
            <div className="rounded-xl border border-gold/25 bg-gold/5 px-4 py-3 text-center sm:col-span-2">
              <p className="font-ui text-sm uppercase tracking-wide text-gold-pale">
                ¿Ya adquiriste este producto? ¡Envíanos tu reseña!
              </p>
              <Link
                href="/contacto"
                className="focus-ring mt-2 inline-block rounded-full border border-gold/50 px-4 py-1.5 font-ui text-xs uppercase tracking-wide text-gold-pale transition hover:bg-gold/10"
              >
                Enviar reseña por correo
              </Link>
            </div>
            )}
          </div>
    </>
  );
}

/**
 * «Un vistazo por dentro»: capturas en carrusel y visor ampliado. Cada uso tiene su propio visor,
 * así cada diseño muestra sus capturas por separado.
 */
function GallerySection({
  images,
  title,
  Heading,
  heading = "Un vistazo por dentro",
}: {
  images: string[];
  title: string;
  Heading: "h2" | "h3" | "h4";
  heading?: string;
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const gallery = images;
  const galleryCount = images.length;

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const showPrev = useCallback(
    () => setLightboxIndex((i) => (i === null || galleryCount === 0 ? null : (i - 1 + galleryCount) % galleryCount)),
    [galleryCount]
  );
  const showNext = useCallback(
    () => setLightboxIndex((i) => (i === null || galleryCount === 0 ? null : (i + 1) % galleryCount)),
    [galleryCount]
  );

  // Visor abierto: flechas del teclado y Escape, y la página de atrás no se desplaza.
  const lightboxOpen = lightboxIndex !== null;
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
    };
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [lightboxOpen, closeLightbox, showPrev, showNext]);

  // Deslizar con el dedo: solo cuenta si el movimiento es claramente horizontal
  // (así no se confunde con bajar o subir la página ni con un toque suelto).
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start || galleryCount < 2) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      if (dx > 0) showPrev();
      else showNext();
    }
  };

  if (galleryCount === 0) return null;

  return (
    <section className={SECTION_CLASS}>
      <Heading className={SECTION_TITLE_CLASS}>{heading}</Heading>
      <Carousel
        itemCount={galleryCount}
        itemClassName="w-[55%] sm:w-1/3 lg:w-1/4"
        renderItem={(i) => (
          <button
            type="button"
            onClick={() => setLightboxIndex(i)}
            className="focus-ring block aspect-[3/4] w-full overflow-hidden rounded-lg border border-gold/25 transition hover:scale-[1.03]"
            aria-label={`Ampliar la página ${i + 1} de ${galleryCount}`}
          >
            <img
              src={gallery[i]}
              alt={`Imagen ${i + 1} de ${title}`}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </button>
        )}
      />
      {/* Visor de las capturas del interior: flechas pegadas a la imagen y deslizar con el dedo */}
      {lightboxIndex !== null && galleryCount > 0 && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Imagen ampliada"
          className="fixed inset-0 z-50 flex items-center justify-center bg-noir-bg/95 p-3 pb-16 sm:p-16"
          style={{ touchAction: "pan-y" }}
          onClick={closeLightbox}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <button
            type="button"
            onClick={closeLightbox}
            aria-label="Cerrar"
            className="focus-ring absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-gold bg-noir-bg text-xl text-gold-pale shadow hover:bg-gold hover:text-noir-bg sm:right-6 sm:top-6"
          >
            ✕
          </button>

          <div
            className="relative flex max-h-full max-w-full items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={gallery[lightboxIndex]}
              alt={`Imagen ${lightboxIndex + 1} de ${title}`}
              draggable={false}
              className="max-h-[78vh] max-w-full select-none rounded-lg object-contain shadow-[0_0_60px_rgba(0,0,0,0.45)]"
            />

            {galleryCount > 1 && (
              <>
                <button
                  type="button"
                  onClick={showPrev}
                  aria-label="Página anterior"
                  className="focus-ring absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-gold text-2xl leading-none text-noir-bg shadow-lg transition hover:bg-gold-bright sm:-left-14 sm:h-12 sm:w-12"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={showNext}
                  aria-label="Página siguiente"
                  className="focus-ring absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-gold text-2xl leading-none text-noir-bg shadow-lg transition hover:bg-gold-bright sm:-right-14 sm:h-12 sm:w-12"
                >
                  ›
                </button>
              </>
            )}
          </div>

          {galleryCount > 1 && (
            <div className="pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1.5">
              <span className="rounded-full border border-gold/50 bg-noir-bg px-3 py-1 font-ui text-xs text-gold-pale">
                {lightboxIndex + 1} / {galleryCount}
              </span>
              <span className="font-ui text-[11px] text-gold-dim sm:hidden">Desliza para ver más páginas</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/** Para quién es, qué vas a recibir y testimonios (textos de la colección o del producto). */
function ContentSections({ product, Heading }: { product: ProductViewModel; Heading: "h2" | "h3" }) {
  const SectionTag = Heading;
  return (
    <>
      {product.audienceText && (
        <section className={SECTION_CLASS}>
          <SectionTag className={SECTION_TITLE_CLASS}>Para quién es esto</SectionTag>
          <div className="rounded-xl border border-gold/25 bg-gold/5 p-5 sm:p-7">
            <FormattedText
              text={product.audienceText}
              className="font-body text-lg leading-relaxed text-gold-pale/90 sm:text-xl"
            />
          </div>
        </section>
      )}

      {product.contentHighlights.length > 0 && (
        <section className={SECTION_CLASS}>
          <SectionTag className={SECTION_TITLE_CLASS}>Qué vas a recibir</SectionTag>
          <ul role="list" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {product.contentHighlights.map((h, i) => (
              <li
                key={i}
                className="rounded-xl border border-gold/25 bg-noir-surface2/50 p-5 transition hover:border-gold/60"
              >
                <h4 className="font-display text-base leading-snug text-gold-pale">{h.title}</h4>
                <FormattedText
                  text={h.description}
                  className="mt-3 font-body text-base leading-relaxed text-gold-pale/85"
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {product.testimonials.length > 0 && (
        <section className={SECTION_CLASS}>
          <SectionTag className={SECTION_TITLE_CLASS}>Lo que dicen quienes ya lo tienen</SectionTag>
          <Carousel
            itemCount={product.testimonials.length}
            itemClassName="w-[85%] sm:w-1/2 lg:w-1/3"
            autoPlayMs={5000}
            renderItem={(i) => {
              const t = product.testimonials[i];
              return (
                <div className="flex h-full flex-col justify-between rounded-xl border border-gold/20 bg-noir-surface2 p-5 transition hover:-translate-y-0.5 hover:border-gold/50">
                  <div>
                    <div className="mb-3 flex gap-0.5" aria-label={`${t.stars} de 5 estrellas`}>
                      {Array.from({ length: 5 }).map((_, s) => (
                        <span key={s} className={s < t.stars ? "text-sky-400" : "text-sky-400/25"}>
                          ★
                        </span>
                      ))}
                    </div>
                    <p className="font-body text-base italic leading-relaxed text-gold-pale/90">
                      &ldquo;{t.text}&rdquo;
                    </p>
                  </div>
                  <span className="mt-4 block font-ui text-sm italic text-gold-pale">{t.name}</span>
                </div>
              );
            }}
          />
        </section>
      )}


    </>
  );
}

/** Preguntas frecuentes y botones de compartir. */
function FaqAndShare({
  product,
  Heading,
  shareUrl,
}: {
  product: ProductViewModel;
  Heading: "h2" | "h3";
  shareUrl: string;
}) {
  const SectionTag = Heading;
  return (
    <>
      {product.faq.length > 0 && (
        <section className={SECTION_CLASS} aria-label="Preguntas frecuentes">
          <SectionTag className={SECTION_TITLE_CLASS}>Preguntas frecuentes</SectionTag>
          <div className="divide-y divide-gold/20 rounded-2xl border border-gold/25 bg-noir-surface/40">
            {product.faq.map((item) => (
              <details key={item.question} className="group px-5 py-4">
                <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-4 font-display text-base text-gold-pale [&::-webkit-details-marker]:hidden">
                  <span>{item.question}</span>
                  <span
                    aria-hidden="true"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold/40 font-ui text-lg leading-none text-gold transition-transform duration-300 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <FormattedText
                  text={item.answer}
                  className="mt-3 max-w-3xl font-body text-lg leading-relaxed text-gold-pale/85"
                />
              </details>
            ))}
          </div>
        </section>
      )}

      <section className={SECTION_CLASS}>
        <SectionTag className={SECTION_TITLE_CLASS}>Compartir</SectionTag>
        <ShareButtons url={shareUrl} title={`${product.title} — Zodiac Noir`} image={product.coverImage ?? product.heroImage} />
      </section>

    </>
  );
}

/** Enlace a la página propia y botón de cerrar (solo dentro de /tienda). */
function TopLinks({ pageHref, onClose }: { pageHref?: string; onClose?: () => void }) {
  if (!onClose && !pageHref) return null;
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 font-body text-sm italic">
      {pageHref ? (
        <Link href={pageHref} className="focus-ring text-gold-pale underline decoration-gold underline-offset-4 hover:text-gold">
          Abrir la página propia de este producto ↗
        </Link>
      ) : (
        <span />
      )}
      {onClose && (
        <button type="button" onClick={onClose} className="focus-ring text-gold-pale hover:text-gold">
          cerrar ficha ✕
        </button>
      )}
    </div>
  );
}

type DetailProps = {
  product: ProductViewModel;
  titleAs?: "h1" | "h2";
  shareUrl: string;
  // Si se pasa, se muestra un enlace a la página propia del producto (solo dentro de /tienda).
  pageHref?: string;
  onClose?: () => void;
  // Se llama cuando termina de cargar la portada (la ficha crece y /tienda vuelve a acomodar el scroll).
  onHeroLoad?: () => void;
  detailRef?: RefObject<HTMLDivElement>;
  // Diseño al que se baja al abrir la ficha (viene del enlace ?diseno=...). Solo se usa en colecciones.
  initialDesignSlug?: string | null;
};

/** Ficha de un producto común (sin diseños). */
function SingleProduct({ product, titleAs = "h2", shareUrl, pageHref, onClose, onHeroLoad, detailRef }: DetailProps) {
  const Title = titleAs;
  const SectionTag = titleAs === "h1" ? "h2" : "h3";
  const heroSrc = product.heroImage ?? product.coverImage;
  const coverAlt =
    product.coverImageAlt || `Portada de ${product.title}${product.variantLabel ? ` — ${product.variantLabel}` : ""}`;

  return (
    <div>
      <StoreViewTracker kind="product" slug={product.slug} />
      <TopLinks pageHref={pageHref} onClose={onClose} />

      <div className="grid gap-8 sm:grid-cols-[1fr_1.1fr] sm:gap-10">
        <div className="mx-auto w-full max-w-xs self-start overflow-hidden rounded-xl border border-gold/20 bg-noir-surface2 shadow-[0_18px_40px_-20px_rgba(38,24,63,0.45)] sm:max-w-none">
          {heroSrc ? (
            <img src={heroSrc} alt={coverAlt} onLoad={onHeroLoad} className="block h-auto w-full" />
          ) : (
            <div className="flex aspect-[4/5] items-center justify-center font-display text-6xl text-gold/50" aria-hidden="true">
              ✦
            </div>
          )}
        </div>

        <div ref={detailRef} className="scroll-mt-36 sm:scroll-mt-24">
          <Title className="font-display text-2xl leading-tight text-gold-pale sm:text-3xl">{product.title}</Title>

          <RichDescription text={product.description} className="mt-5 font-body leading-relaxed text-gold-pale/85" />

          <BuyPanel product={product} />
        </div>
      </div>

      {product.videoUrl && (
        <section className={SECTION_CLASS}>
          <SectionTag className={SECTION_TITLE_CLASS}>Mira la presentación</SectionTag>
          <ProductVideo key={product.videoUrl} src={product.videoUrl} title={product.title} />
        </section>
      )}

      <ContentSections product={product} Heading={SectionTag} />
      <GallerySection images={product.galleryImages} title={product.title} Heading={SectionTag} />
      <FaqAndShare product={product} Heading={SectionTag} shareUrl={shareUrl} />
    </div>
  );
}

// Enlace compartible de un diseño: el de la colección con ?diseno=<slug>.
function designShareUrl(shareUrl: string, slug: string): string {
  try {
    const url = new URL(shareUrl);
    url.searchParams.set("diseno", slug);
    return url.toString();
  } catch {
    return shareUrl;
  }
}

/**
 * Tarjeta completa de un diseño: portada, nombre, lo que lo hace especial, compra, su video y sus capturas.
 * La descripción general de la colección no se repite aquí: está una sola vez arriba.
 */
function DesignCard({
  collection,
  design,
  index,
  total,
  cardHeading,
  shareUrl,
  onBack,
}: {
  collection: ProductViewModel;
  design: ProductViewModel;
  index: number;
  total: number;
  cardHeading: "h2" | "h3";
  shareUrl: string;
  onBack: () => void;
}) {
  const CardTitle = cardHeading;
  const SubTag = cardHeading === "h2" ? "h3" : "h4";
  // Para comprar: el diseño con los datos de la colección (el id del pago es el del diseño).
  const buyProduct = mergeDesign(collection, design);
  const heroSrc = design.heroImage ?? design.coverImage;
  const name = design.variantLabel || design.title;
  const coverAlt = design.coverImageAlt || `Portada de ${collection.title} — ${name}`;
  const particularity = looksLikeHtml(design.description) ? (htmlToPlain(design.description) ? design.description : "") : design.description.trim();

  return (
    <article
      id={`diseno-${design.slug}`}
      aria-label={`Diseño ${index + 1} de ${total}: ${name}`}
      className="mt-6 scroll-mt-24 rounded-2xl border border-gold/30 bg-noir-surface/40 p-5 shadow-[0_18px_40px_-24px_rgba(38,24,63,0.5)] sm:p-8"
    >
      <StoreViewTracker kind="product" slug={design.slug} />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="font-ui text-xs uppercase tracking-wide text-gold-dim">
          Diseño {index + 1} de {total}
        </p>
        <button type="button" onClick={onBack} className="focus-ring font-body text-sm italic text-gold-pale hover:text-gold">
          ← ver todos los diseños
        </button>
      </div>

      <div className="grid gap-8 sm:grid-cols-[1fr_1.1fr] sm:gap-10">
        <div className="mx-auto w-full max-w-xs self-start overflow-hidden rounded-xl border border-gold/20 bg-noir-surface2 sm:max-w-none">
          {heroSrc ? (
            <img src={heroSrc} alt={coverAlt} loading="lazy" className="block h-auto w-full" />
          ) : (
            <div className="flex aspect-[4/5] items-center justify-center font-display text-6xl text-gold/50" aria-hidden="true">
              ✦
            </div>
          )}
        </div>

        <div>
          <CardTitle className="font-display text-2xl leading-tight text-gold-pale">{name}</CardTitle>

          {particularity && (
            <div className="mt-4 rounded-xl border border-gold/20 bg-gold/5 p-4">
              <p className="mb-2 font-ui text-xs uppercase tracking-wide text-gold-dim">Lo que hace especial a este diseño</p>
              <RichDescription text={particularity} className="font-body leading-relaxed text-gold-pale/90" />
            </div>
          )}

          <BuyPanel product={buyProduct} showReview={false} />
        </div>
      </div>

      {design.videoUrl && (
        <section className={SECTION_CLASS}>
          <SubTag className={SECTION_TITLE_CLASS}>Mira este diseño</SubTag>
          <ProductVideo key={design.videoUrl} src={design.videoUrl} title={`${collection.title} — ${name}`} />
        </section>
      )}

      <GallerySection images={design.galleryImages} title={`${collection.title} — ${name}`} Heading={SubTag} />

      <section className={SECTION_CLASS}>
        <SubTag className={SECTION_TITLE_CLASS}>Compartir este diseño</SubTag>
        <ShareButtons
          url={designShareUrl(shareUrl, design.slug)}
          title={`${collection.title} — ${name} — Zodiac Noir`}
          image={design.coverImage ?? design.heroImage}
        />
      </section>
    </article>
  );
}

/** Ficha de una colección: descripción general una sola vez, los diseños como tarjetas lado a lado y, al tocar uno, su ficha completa. */
function CollectionProduct({
  product,
  titleAs = "h2",
  shareUrl,
  pageHref,
  onClose,
  onHeroLoad,
  detailRef,
  initialDesignSlug,
}: DetailProps) {
  const Title = titleAs;
  const SectionTag = titleAs === "h1" ? "h2" : "h3";
  const designs = product.designs;
  const heroSrc = product.heroImage ?? product.coverImage ?? designs[0]?.heroImage ?? designs[0]?.coverImage;
  const coverAlt = product.coverImageAlt || `Portada de ${product.title}`;

  // Diseño abierto (su ficha completa aparece debajo de las tarjetas). Viene del enlace ?diseno=... si lo trae.
  const [openSlug, setOpenSlug] = useState<string | null>(() =>
    initialDesignSlug && designs.some((d) => d.slug === initialDesignSlug) ? initialDesignSlug : null
  );
  const openIndex = designs.findIndex((d) => d.slug === openSlug);
  const openDesign = openIndex >= 0 ? designs[openIndex] : null;

  const scrollToDesign = (slug: string) => {
    window.setTimeout(() => {
      document.getElementById(`diseno-${slug}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

  const setUrlDesign = (slug: string | null) => {
    // En la página propia del producto el enlace queda apuntando al diseño abierto, para poder compartirlo.
    if (onClose || typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (slug) url.searchParams.set("diseno", slug);
    else url.searchParams.delete("diseno");
    window.history.replaceState(null, "", url.toString());
  };

  const openDesignCard = (slug: string) => {
    setOpenSlug(slug);
    setUrlDesign(slug);
    scrollToDesign(slug);
  };

  const closeDesignCard = () => {
    setOpenSlug(null);
    setUrlDesign(null);
    document.getElementById("disenos-de-la-coleccion")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Si el enlace trae ?diseno=..., al abrir la ficha se baja hasta ese diseño.
  useEffect(() => {
    if (!initialDesignSlug || !designs.some((d) => d.slug === initialDesignSlug)) return;
    const timer = window.setTimeout(() => scrollToDesign(initialDesignSlug), 350);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDesignSlug]);

  return (
    <div>
      <StoreViewTracker kind="product" slug={product.slug} />
      <TopLinks pageHref={pageHref} onClose={onClose} />

      <div className="grid gap-8 sm:grid-cols-[1fr_1.1fr] sm:gap-10">
        <div className="mx-auto w-full max-w-xs self-start overflow-hidden rounded-xl border border-gold/20 bg-noir-surface2 shadow-[0_18px_40px_-20px_rgba(38,24,63,0.45)] sm:max-w-none">
          {heroSrc ? (
            <img src={heroSrc} alt={coverAlt} onLoad={onHeroLoad} className="block h-auto w-full" />
          ) : (
            <div className="flex aspect-[4/5] items-center justify-center font-display text-6xl text-gold/50" aria-hidden="true">
              ✦
            </div>
          )}
        </div>

        <div ref={detailRef} className="scroll-mt-36 sm:scroll-mt-24">
          <Title className="font-display text-2xl leading-tight text-gold-pale sm:text-3xl">{product.title}</Title>

          <RichDescription text={product.description} className="mt-5 font-body leading-relaxed text-gold-pale/85" />
        </div>
      </div>

      {product.videoUrl && (
        <section className={SECTION_CLASS}>
          <SectionTag className={SECTION_TITLE_CLASS}>Mira la presentación</SectionTag>
          <ProductVideo key={product.videoUrl} src={product.videoUrl} title={product.title} />
        </section>
      )}

      <section id="disenos-de-la-coleccion" className={`${SECTION_CLASS} scroll-mt-24`}>
        <SectionTag className={SECTION_TITLE_CLASS}>
          {designs.length} {designs.length === 1 ? "diseño" : "diseños"} para elegir{" "}
          <span className="font-body text-base italic text-gold-dim">· toca uno para ver su ficha completa</span>
        </SectionTag>
        <DesignGrid designs={designs} openSlug={openSlug} onOpen={openDesignCard} />
      </section>

      {openDesign && (
        <DesignCard
          key={openDesign.id}
          collection={product}
          design={openDesign}
          index={openIndex}
          total={designs.length}
          cardHeading={SectionTag}
          shareUrl={shareUrl}
          onBack={closeDesignCard}
        />
      )}

      <div className="mt-10 rounded-xl border border-gold/25 bg-gold/5 px-4 py-3 text-center">
        <p className="font-ui text-sm uppercase tracking-wide text-gold-pale">
          ¿Ya adquiriste este producto? ¡Envíanos tu reseña!
        </p>
        <Link
          href="/contacto"
          className="focus-ring mt-2 inline-block rounded-full border border-gold/50 px-4 py-1.5 font-ui text-xs uppercase tracking-wide text-gold-pale transition hover:bg-gold/10"
        >
          Enviar reseña por correo
        </Link>
      </div>

      <ContentSections product={product} Heading={SectionTag} />
      <FaqAndShare product={product} Heading={SectionTag} shareUrl={shareUrl} />
    </div>
  );
}

/**
 * Ficha completa de un producto. Si es una colección con varios diseños, muestra la descripción general
 * una sola vez, los diseños como tarjetas lado a lado y, al tocar uno, su ficha completa (portada, detalles propios,
 * compra, video y capturas).
 * Se usa dentro de /tienda (al tocar una tarjeta) y en la página propia de cada producto.
 */
export function ProductDetail(props: DetailProps) {
  if (props.product.designs.length > 0) return <CollectionProduct {...props} />;
  return <SingleProduct {...props} />;
}
