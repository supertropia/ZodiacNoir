"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ContentHighlight = { title: string; description: string };
type Testimonial = { name: string; stars: number; text: string; shared: number };

function Carousel({
  itemCount,
  renderItem,
  itemClassName = "w-full sm:w-1/2 lg:w-1/3",
}: {
  itemCount: number;
  renderItem: (index: number) => React.ReactNode;
  itemClassName?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

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

  if (itemCount === 0) return null;

  return (
    <div className="relative">
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
            className="focus-ring absolute left-0 top-1/2 hidden h-8 w-8 -translate-x-3 -translate-y-1/2 items-center justify-center rounded-full border border-gold/30 bg-noir-bg/85 text-gold-pale hover:border-gold hover:text-gold sm:flex"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => scrollToIndex(Math.min(itemCount - 1, index + 1))}
            aria-label="Siguiente"
            className="focus-ring absolute right-0 top-1/2 hidden h-8 w-8 -translate-y-1/2 translate-x-3 items-center justify-center rounded-full border border-gold/30 bg-noir-bg/85 text-gold-pale hover:border-gold hover:text-gold sm:flex"
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

export type ProductViewModel = {
  id: string;
  slug: string;
  title: string;
  description: string;
  priceLabel: string;
  priceArs: number | null;
  amazonKindleUrl: string | null;
  amazonKindlePrice: string | null;
  amazonPaperbackUrl: string | null;
  amazonPaperbackPrice: string | null;
  coverImage: string | null;
  coverImagePosition: number;
  heroImage: string | null;
  heroImagePosition: number;
  galleryImages: string[];
  contentHighlights: ContentHighlight[];
  testimonials: Testimonial[];
  audienceText: string | null;
  owned: boolean;
  fileUrl: string | null;
  checkoutUrl: string | null;
};

export function ProductGrid({
  products,
  initialProductSlug,
}: {
  products: ProductViewModel[];
  initialProductSlug?: string;
}) {
  const [flipped, setFlipped] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [testiIndex, setTestiIndex] = useState(0);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payError, setPayError] = useState("");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const fichaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!initialProductSlug) return;
    const match = products.find((p) => p.slug === initialProductSlug);
    if (match) {
      setOpenId(match.id);
      setTimeout(() => {
        fichaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProductSlug]);

  const openProduct = useMemo(
    () => products.find((p) => p.id === openId) ?? null,
    [products, openId]
  );

  useEffect(() => {
    setTestiIndex(0);
    if (!openProduct || openProduct.testimonials.length < 2) return;
    const timer = setInterval(() => {
      setTestiIndex((i) => (i + 1) % openProduct.testimonials.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [openProduct]);

  const toggleFlip = (id: string) => {
    setFlipped((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openLanding = (id: string) => {
    setOpenId((current) => (current === id ? null : id));
  };

  const payWithMercadoPago = async (productId: string) => {
    setPayingId(productId);
    setPayError("");
    try {
      const res = await fetch("/api/mercadopago/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo iniciar el pago.");
      window.location.href = data.url;
    } catch (err) {
      setPayError(err instanceof Error ? err.message : "No se pudo iniciar el pago.");
      setPayingId(null);
    }
  };

  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/tienda` : "https://zodiacnoirweb.com/tienda";

  return (
    <div>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => {
          const isFlipped = flipped.has(product.id);
          return (
            <div key={product.id} className="[perspective:1400px]">
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggleFlip(product.id)}
                onKeyDown={(e) => e.key === "Enter" && toggleFlip(product.id)}
                className="relative min-h-[360px] w-full cursor-pointer [transform-style:preserve-3d] transition-transform duration-700"
                style={{ transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
              >
                {/* Cara frontal */}
                <div className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl border border-gold/20 bg-noir-surface/60 [backface-visibility:hidden]">
                  <div className="relative h-36 flex-shrink-0 overflow-hidden bg-gradient-to-b from-noir-surface2 to-noir-bg">
                    {product.coverImage && (
                      <img
                        src={product.coverImage}
                        alt={product.title}
                        className="h-full w-full object-cover"
                        style={{ objectPosition: `center ${product.coverImagePosition}%` }}
                      />
                    )}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-noir-surface via-noir-surface/60 to-transparent" />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-display text-base font-semibold leading-snug text-gold-pale">
                      {product.title}
                    </h3>
                    <p className="mt-2 flex-1 font-body text-base leading-snug text-gold-pale/75 [-webkit-box-orient:vertical] [-webkit-line-clamp:3] [display:-webkit-box] overflow-hidden">
                      {product.description}
                    </p>
                    <div className="mt-auto flex items-center justify-end pt-3">
                      <span className="font-body text-sm italic text-gold-dim">+ info ↻</span>
                    </div>
                  </div>
                </div>

                {/* Cara trasera */}
                <div
                  className="absolute inset-0 flex flex-col justify-center gap-3 rounded-2xl border border-gold/20 bg-noir-surface2 p-6 text-center [backface-visibility:hidden]"
                  style={{ transform: "rotateY(180deg)" }}
                >
                  <h4 className="font-display text-sm tracking-wide text-gold-bright">Lo que incluye</h4>
                  <ul className="space-y-2 text-left font-body text-base text-gold-pale/80">
                    {product.contentHighlights.slice(0, 3).map((h, i) => (
                      <li key={i}>
                        <span className="text-gold-dim">✦ </span>
                        {h.title}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openLanding(product.id);
                    }}
                    className="focus-ring mx-auto mt-2 rounded-full border border-gold-dim px-4 py-2 font-ui text-xs uppercase tracking-wide text-gold-bright transition hover:bg-gold hover:text-noir-bg"
                  >
                    + info
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ficha completa compartida */}
      <div
        ref={fichaRef}
        className={`grid overflow-hidden rounded-2xl border border-gold/20 bg-noir-surface transition-[grid-template-rows,margin-top] duration-500 ${
          openProduct ? "mt-9 grid-rows-[1fr]" : "mt-0 grid-rows-[0fr] border-transparent"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          {openProduct && (
            <div className="p-6 sm:p-10">
              <button
                type="button"
                onClick={() => setOpenId(null)}
                className="float-right font-body text-sm italic text-gold-dim hover:text-gold-bright"
              >
                cerrar ficha ✕
              </button>

              <div className="grid gap-6 clear-both sm:grid-cols-[1.1fr_1fr] sm:gap-9">
                <div className="min-h-[220px] overflow-hidden rounded-xl bg-gradient-to-br from-noir-surface2 to-noir-bg">
                  {openProduct.heroImage && (
                    <img
                      src={openProduct.heroImage}
                      alt={openProduct.title}
                      className="h-full w-full object-cover"
                      style={{ objectPosition: `center ${openProduct.heroImagePosition}%` }}
                    />
                  )}
                </div>
                <div>
                  <h2 className="font-display text-2xl leading-tight text-gold-pale">{openProduct.title}</h2>
                  <p className="mt-3 font-body text-lg leading-relaxed text-gold-pale/80">
                    {openProduct.description}
                  </p>

                  {payError && (
                    <p className="mt-4 font-ui text-sm text-wine-bright">{payError}</p>
                  )}

                  <div className="mt-6 grid items-stretch gap-3 sm:grid-cols-2">
                    {(openProduct.owned || openProduct.priceArs) && (
                      <div className="flex h-full flex-col rounded-xl border border-gold/20 bg-noir-surface2/50 p-4">
                        <p className="font-ui text-xs uppercase tracking-wide text-gold-dim">
                          PDF digital · descarga inmediata
                        </p>
                        <p className="mt-0.5 font-ui text-[11px] text-gold-dim">Mercado Pago · válido para LATAM</p>

                        <div className="mt-auto pt-3">
                          {openProduct.owned && openProduct.fileUrl ? (
                            <a href={openProduct.fileUrl}
                              className="focus-ring block w-full rounded-full bg-gold px-5 py-2.5 text-center font-ui text-sm font-medium uppercase tracking-wide text-noir-bg hover:bg-gold-bright"
                            >
                              Descargar PDF
                            </a>
                          ) : (
                            <>
                              <p className="mb-2 font-ui text-lg font-medium text-gold-bright">
                                ARS {openProduct.priceArs?.toLocaleString("es-AR")}
                              </p>
                              <button
                                type="button"
                                disabled={payingId === openProduct.id}
                                onClick={() => payWithMercadoPago(openProduct.id)}
                                className="focus-ring w-full rounded-full bg-gold px-5 py-2.5 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg hover:bg-gold-bright disabled:opacity-60"
                              >
                                {payingId === openProduct.id ? "Redirigiendo…" : "Adquirir"}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {(openProduct.amazonKindleUrl || openProduct.amazonPaperbackUrl) && (
                      <div className="flex h-full flex-col rounded-xl border border-gold/20 bg-noir-surface2/50 p-4">
                        <p className="font-ui text-xs uppercase tracking-wide text-gold-dim">Adquirir en Amazon</p>
                        <p className="mt-0.5 font-ui text-[11px] text-gold-dim">
                          Envío y entrega dependen exclusivamente de Amazon según tu ubicación.
                        </p>
                        <div className="mt-auto space-y-2 pt-3">
                          {openProduct.amazonKindleUrl && (
                            <a target="_blank"
                              rel="noreferrer"
                              href={openProduct.amazonKindleUrl}
                              className="focus-ring flex items-center justify-between rounded-full bg-gold px-5 py-2.5 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg hover:bg-gold-bright"
                            >
                              <span>Kindle (digital)</span>
                              {openProduct.amazonKindlePrice && <span>{openProduct.amazonKindlePrice}</span>}
                            </a>
                          )}
                          {openProduct.amazonPaperbackUrl && (
                            <a target="_blank"
                              rel="noreferrer"
                              href={openProduct.amazonPaperbackUrl}
                              className="focus-ring flex items-center justify-between rounded-full bg-gold px-5 py-2.5 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg hover:bg-gold-bright"
                            >
                              <span>Libro físico</span>
                              {openProduct.amazonPaperbackPrice && <span>{openProduct.amazonPaperbackPrice}</span>}
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {!openProduct.owned && !openProduct.priceArs &&
                      !openProduct.amazonKindleUrl && !openProduct.amazonPaperbackUrl && (
                      <p className="font-ui text-xs text-gold-dim sm:col-span-2">
                        Este producto todavía no tiene una forma de pago configurada.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {openProduct.audienceText && (
                <div className="mt-8">
                  <h4 className="mb-3 font-display text-sm uppercase tracking-wide text-gold-bright">
                    Para quién es esto
                  </h4>
                  <p className="font-body text-lg italic leading-relaxed text-gold-pale/85">
                    {openProduct.audienceText}
                  </p>
                </div>
              )}

              {openProduct.contentHighlights.length > 0 && (
                <div className="mt-8">
                  <h4 className="mb-3 font-display text-sm uppercase tracking-wide text-gold-bright">
                    Qué vas a recibir
                  </h4>
                  <Carousel
                    itemCount={openProduct.contentHighlights.length}
                    itemClassName="w-[85%] sm:w-1/2 lg:w-1/3"
                    renderItem={(i) => {
                      const h = openProduct.contentHighlights[i];
                      return (
                        <div className="h-full rounded-lg border border-gold/15 p-4 transition hover:-translate-y-0.5 hover:border-gold/50 hover:bg-gold/5">
                          <b className="mb-1 block font-display text-sm text-gold-pale">{h.title}</b>
                          <span className="font-body text-base text-gold-pale/75">{h.description}</span>
                        </div>
                      );
                    }}
                  />
                </div>
              )}

              {openProduct.galleryImages.length > 0 && (
                <div className="mt-8">
                  <h4 className="mb-3 font-display text-sm uppercase tracking-wide text-gold-bright">
                    Un vistazo por dentro
                  </h4>
                  <Carousel
                    itemCount={openProduct.galleryImages.length}
                    itemClassName="w-[55%] sm:w-1/3 lg:w-1/4"
                    renderItem={(i) => (
                      <button
                        type="button"
                        onClick={() => setLightboxImage(openProduct.galleryImages[i])}
                        className="focus-ring block aspect-[3/4] w-full overflow-hidden rounded-lg border border-gold/15 transition hover:scale-[1.03]"
                        aria-label="Ampliar imagen"
                      >
                        <img
                          src={openProduct.galleryImages[i]}
                          alt={`Página interior ${i + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    )}
                  />
                </div>
              )}

              {openProduct.testimonials.length > 0 && (
                <div className="mt-8">
                  <h4 className="mb-3 font-display text-sm uppercase tracking-wide text-gold-bright">
                    Lo que dicen quienes ya lo leyeron
                  </h4>
                  <div className="rounded-lg border border-gold/15 p-4">
                    {openProduct.testimonials[testiIndex] && (
                      <div key={testiIndex} className="animate-[fadein_.4s_ease]">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <span className="font-ui text-sm text-gold-pale">
                            {openProduct.testimonials[testiIndex].name}
                          </span>
                          <span className="text-gold">
                            {"★".repeat(openProduct.testimonials[testiIndex].stars)}
                          </span>
                        </div>
                        <blockquote className="font-body text-lg italic text-gold-pale/85">
                          &ldquo;{openProduct.testimonials[testiIndex].text}&rdquo;
                        </blockquote>
                        <span className="mt-2 block font-ui text-xs uppercase tracking-wide text-gold-dim">
                          Compartido {openProduct.testimonials[testiIndex].shared} veces
                        </span>
                      </div>
                    )}
                  </div>
                  {openProduct.testimonials.length > 1 && (
                    <div className="mt-3 flex justify-center gap-1.5">
                      {openProduct.testimonials.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setTestiIndex(i)}
                          className={`h-1.5 w-1.5 rounded-full transition ${
                            i === testiIndex ? "bg-gold" : "bg-gold/30"
                          }`}
                          aria-label={`Testimonio ${i + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-8">
                <h4 className="mb-3 font-display text-sm uppercase tracking-wide text-gold-bright">Compartir</h4>
                <div className="flex flex-wrap gap-2.5">
                  <a target="_blank"
                    rel="noreferrer"
                    href={`https://wa.me/?text=${encodeURIComponent(openProduct.title + " — Zodiac Noir")}%20${encodeURIComponent(shareUrl)}`}
                    className="rounded-full border border-gold/25 bg-white/[0.02] px-4 py-2 font-ui text-sm text-gold-pale transition hover:border-gold hover:text-gold-bright"
                  >
                    WhatsApp
                  </a>
                  <a target="_blank"
                    rel="noreferrer"
                    href="https://www.instagram.com/"
                    className="rounded-full border border-gold/25 bg-white/[0.02] px-4 py-2 font-ui text-sm text-gold-pale transition hover:border-gold hover:text-gold-bright"
                  >
                    Instagram
                  </a>
                  <a target="_blank"
                    rel="noreferrer"
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(openProduct.title + " — Zodiac Noir")}&url=${encodeURIComponent(shareUrl)}`}
                    className="rounded-full border border-gold/25 bg-white/[0.02] px-4 py-2 font-ui text-sm text-gold-pale transition hover:border-gold hover:text-gold-bright"
                  >
                    X
                  </a>
                  <a href={`mailto:?subject=${encodeURIComponent(openProduct.title + " — Zodiac Noir")}&body=${encodeURIComponent(shareUrl)}`}
                    className="rounded-full border border-gold/25 bg-white/[0.02] px-4 py-2 font-ui text-sm text-gold-pale transition hover:border-gold hover:text-gold-bright"
                  >
                    Correo
                  </a>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Vista ampliada de una captura, sin salir de la ficha del producto */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-noir-bg/95 p-4 sm:p-10"
          onClick={() => setLightboxImage(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            aria-label="Cerrar"
            className="focus-ring absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-gold/40 text-xl text-gold-pale hover:border-gold hover:text-gold sm:right-8 sm:top-8"
          >
            ✕
          </button>
          <img
            src={lightboxImage}
            alt="Vista ampliada"
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-full rounded-lg object-contain shadow-[0_0_60px_rgba(0,0,0,0.6)]"
          />
        </div>
      )}
    </div>
  );
}
