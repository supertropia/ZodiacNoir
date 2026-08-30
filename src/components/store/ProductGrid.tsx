"use client";

import { useEffect, useMemo, useState } from "react";

type ContentHighlight = { title: string; description: string };
type Testimonial = { name: string; stars: number; text: string; shared: number };

export type ProductViewModel = {
  id: string;
  title: string;
  description: string;
  priceLabel: string;
  priceArs: number | null;
  amazonUrl: string | null;
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

export function ProductGrid({ products }: { products: ProductViewModel[] }) {
  const [flipped, setFlipped] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [testiIndex, setTestiIndex] = useState(0);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payError, setPayError] = useState("");

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
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <span className="font-ui text-lg font-medium text-gold-bright">{product.priceLabel}</span>
                      <span className="font-body text-sm italic text-gold-dim">girar ↻</span>
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
                    Ver ficha completa
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ficha completa compartida */}
      <div
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
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {openProduct.contentHighlights.map((h, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-gold/15 p-4 transition hover:-translate-y-0.5 hover:border-gold/50 hover:bg-gold/5"
                      >
                        <b className="mb-1 block font-display text-sm text-gold-pale">{h.title}</b>
                        <span className="font-body text-base text-gold-pale/75">{h.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {openProduct.galleryImages.length > 0 && (
                <div className="mt-8">
                  <h4 className="mb-3 font-display text-sm uppercase tracking-wide text-gold-bright">
                    Un vistazo por dentro
                  </h4>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {openProduct.galleryImages.map((url, i) => (
                      <div
                        key={i}
                        className="aspect-[3/4] overflow-hidden rounded-lg border border-gold/15 transition hover:scale-[1.03]"
                      >
                        <img src={url} alt={`Página interior ${i + 1}`} className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
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

              {payError && (
                <p className="mt-6 font-ui text-sm text-wine-bright">{payError}</p>
              )}

              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-gold/15 pt-6">
                <span className="font-ui text-2xl font-medium text-gold-bright">{openProduct.priceLabel}</span>

                <div className="flex flex-wrap gap-3">
                  {openProduct.owned && openProduct.fileUrl && (
                    <a href={openProduct.fileUrl}
                      className="focus-ring rounded-full border border-gold px-7 py-3 font-ui text-sm uppercase tracking-wide text-gold hover:bg-gold/10"
                    >
                      Descargar PDF
                    </a>
                  )}

                  {!openProduct.owned && openProduct.priceArs && (
                    <button
                      type="button"
                      disabled={payingId === openProduct.id}
                      onClick={() => payWithMercadoPago(openProduct.id)}
                      className="focus-ring rounded-full bg-gold px-7 py-3 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg hover:bg-gold-bright disabled:opacity-60"
                    >
                      {payingId === openProduct.id ? "Redirigiendo…" : "Descargar eBook · Mercado Pago"}
                    </button>
                  )}

                  {openProduct.amazonUrl && (
                    <a target="_blank"
                      rel="noreferrer"
                      href={openProduct.amazonUrl}
                      className="focus-ring rounded-full border border-gold/40 px-7 py-3 font-ui text-sm uppercase tracking-wide text-gold-pale hover:bg-gold/10"
                    >
                      Comprar en Amazon
                    </a>
                  )}

                  {!openProduct.owned && !openProduct.priceArs && !openProduct.amazonUrl && (
                    <p className="font-ui text-xs text-gold-dim">
                      Este producto todavía no tiene una forma de pago configurada.
                    </p>
                  )}
                </div>
              </div>

              {openProduct.amazonUrl && (
                <p className="mt-3 text-center font-ui text-xs text-gold-dim">
                  Comprando en Amazon podés elegir envío físico o versión Kindle, disponible en la mayoría
                  de los países. La disponibilidad de envío y los tiempos de entrega dependen
                  exclusivamente de Amazon según tu ubicación.
                </p>
              )}
              <p className="mt-3 text-center font-ui text-xs text-gold-dim">
                El eBook se descarga apenas se confirma el pago.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
