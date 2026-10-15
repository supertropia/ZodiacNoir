"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { ShareButtons } from "@/components/ShareButtons";
import { FormattedText } from "@/components/store/FormattedText";
import { StoreViewTracker } from "@/components/store/StoreViewTracker";
import type { ProductViewModel } from "@/lib/store-products";

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

const SECTION_CLASS = "mt-10 border-t border-gold/20 pt-8";
const SECTION_TITLE_CLASS = "mb-5 font-display text-xl text-gold-pale";

/**
 * Ficha completa de un producto: portada, descripción, formas de compra, contenido,
 * testimonios, capturas del interior, preguntas frecuentes y botones de compartir.
 * Se usa dentro de /tienda (al tocar una tarjeta) y en la página propia de cada libro.
 */
export function ProductDetail({
  product,
  titleAs = "h2",
  shareUrl,
  pageHref,
  onClose,
  onHeroLoad,
  detailRef,
}: {
  product: ProductViewModel;
  titleAs?: "h1" | "h2";
  shareUrl: string;
  // Si se pasa, se muestra un enlace a la página propia del libro (solo dentro de /tienda).
  pageHref?: string;
  onClose?: () => void;
  // Se llama cuando termina de cargar la portada (la ficha crece y /tienda vuelve a acomodar el scroll).
  onHeroLoad?: () => void;
  detailRef?: RefObject<HTMLDivElement>;
}) {
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const Title = titleAs;
  const SectionTag = titleAs === "h1" ? "h2" : "h3";

  const gallery = product.galleryImages;
  const galleryCount = gallery.length;
  const heroSrc = product.heroImage ?? product.coverImage;
  const coverAlt = product.coverImageAlt || `Portada del libro ${product.title}`;

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

  const hasPdfOffer = product.owned || Boolean(product.priceArs);
  const hasAmazon = Boolean(product.amazonKindleUrl || product.amazonPaperbackUrl);

  return (
    <div>
      <StoreViewTracker kind="product" slug={product.slug} />
      {(onClose || pageHref) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 font-body text-sm italic">
          {pageHref ? (
            <Link href={pageHref} className="focus-ring text-gold-pale underline decoration-gold underline-offset-4 hover:text-gold">
              Abrir la página propia de este libro ↗
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
      )}

      <div className="grid gap-8 sm:grid-cols-[1fr_1.1fr] sm:gap-10">
        <div className="mx-auto w-full max-w-xs self-start overflow-hidden rounded-xl border border-gold/20 bg-noir-surface2 shadow-[0_18px_40px_-20px_rgba(38,24,63,0.45)] sm:max-w-none">
          {heroSrc ? (
            <img
              src={heroSrc}
              alt={coverAlt}
              onLoad={onHeroLoad}
              className="block h-auto w-full"
            />
          ) : (
            <div className="flex aspect-[4/5] items-center justify-center font-display text-6xl text-gold/50" aria-hidden="true">
              ✦
            </div>
          )}
        </div>

        <div ref={detailRef} className="scroll-mt-36 sm:scroll-mt-24">
          <Title className="font-display text-2xl leading-tight text-gold-pale sm:text-3xl">{product.title}</Title>

          <FormattedText
            text={product.description}
            autoParagraphs
            className="mt-5 font-body text-lg leading-relaxed text-gold-pale/85"
          />

          {payError && <p className="mt-4 font-ui text-sm text-wine-bright">{payError}</p>}

          <div className="mt-7 grid items-stretch gap-3 sm:grid-cols-2">
            {hasPdfOffer && (
              <div className="flex h-full flex-col rounded-xl border border-gold/25 bg-noir-surface2/50 p-4">
                <p className="font-ui text-xs uppercase tracking-wide text-gold-pale">PDF digital · descarga inmediata</p>
                <p className="mt-0.5 font-ui text-[11px] text-gold-dim">Mercado Pago · válido para LATAM</p>
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
                      <p className="mb-2 font-ui text-lg font-medium text-gold-pale">
                        ARS {product.priceArs?.toLocaleString("es-AR")}
                      </p>
                      <button
                        type="button"
                        disabled={payLoading}
                        onClick={payWithMercadoPago}
                        className="focus-ring w-full rounded-full bg-gold px-5 py-2.5 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg hover:bg-gold-bright disabled:opacity-60"
                      >
                        {payLoading ? "Redirigiendo…" : "Adquirir"}
                      </button>
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
                <div className="mt-auto space-y-2 pt-3">
                  {product.amazonKindleUrl && (
                    <div>
                      <a target="_blank"
                        rel="noreferrer"
                        href={product.amazonKindleUrl}
                        className="focus-ring flex items-center justify-between rounded-full bg-gold px-5 py-2.5 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg hover:bg-gold-bright"
                      >
                        <span>Kindle (digital)</span>
                        {product.amazonKindlePrice && <AmazonPrice value={product.amazonKindlePrice} />}
                      </a>
                      <p className="mt-1.5 text-center font-ui text-[11px] tracking-wide text-gold-dim">
                        Disponible en <span className="text-gold-pale">Kindle Unlimited</span>
                      </p>
                    </div>
                  )}
                  {product.amazonPaperbackUrl && (
                    <a target="_blank"
                      rel="noreferrer"
                      href={product.amazonPaperbackUrl}
                      className="focus-ring flex items-center justify-between rounded-full bg-gold px-5 py-2.5 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg hover:bg-gold-bright"
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

            <div className="rounded-xl border border-gold/25 bg-gold/5 px-4 py-3 text-center sm:col-span-2">
              <p className="font-ui text-sm uppercase tracking-wide text-gold-pale">
                ¿Ya adquiriste nuestros libros? ¡Envíanos tu reseña!
              </p>
              <Link
                href="/contacto"
                className="focus-ring mt-2 inline-block rounded-full border border-gold/50 px-4 py-1.5 font-ui text-xs uppercase tracking-wide text-gold-pale transition hover:bg-gold/10"
              >
                Enviar reseña por correo
              </Link>
            </div>
          </div>
        </div>
      </div>

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
          <SectionTag className={SECTION_TITLE_CLASS}>Lo que dicen quienes ya lo leyeron</SectionTag>
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

      {galleryCount > 0 && (
        <section className={SECTION_CLASS}>
          <SectionTag className={SECTION_TITLE_CLASS}>Un vistazo por dentro</SectionTag>
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
                  alt={`Página interior ${i + 1} del libro ${product.title}`}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </button>
            )}
          />
        </section>
      )}

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

      {/* Visor de las capturas del interior: flechas pegadas a la imagen y deslizar con el dedo */}
      {lightboxIndex !== null && galleryCount > 0 && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Página del libro ampliada"
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
              alt={`Página interior ${lightboxIndex + 1} del libro ${product.title}`}
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
    </div>
  );
}
