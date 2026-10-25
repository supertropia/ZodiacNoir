import Link from "next/link";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, safeQuery } from "@/lib/prisma";
import { ProductGrid } from "@/components/store/ProductGrid";
import { StoreViewTracker } from "@/components/store/StoreViewTracker";
import { toProductViewModel, type ProductViewModel } from "@/lib/store-products";
import { serializeJsonLd } from "@/lib/seo";
import { summarize } from "@/lib/product-seo";
import { toPlainText } from "@/components/store/FormattedText";
import { getUsdArsQuote } from "@/lib/exchange-rate";
import { getPaypalVisibility } from "@/lib/paypal-access";
import { FX_NOTE } from "@/lib/pricing";

const SITE_URL = process.env.NEXTAUTH_URL || "https://zodiacnoirweb.com";

const PAGE_TITLE = "Libros y e-books de astrología humanista";
const PAGE_DESCRIPTION =
  "Libros y e-books de astrología humanista: tránsitos planetarios, lunaciones y efemérides. Descarga el PDF al instante o pídelos en Amazon desde cualquier país.";

export const dynamic = "force-dynamic";

// Se usa generateMetadata (y no un objeto fijo) para que, al compartir la tienda en redes,
// la vista previa muestre la portada de un libro real en lugar de quedar sin imagen.
export async function generateMetadata(): Promise<Metadata> {
  let shareImage: string | null = null;
  try {
    const first = await safeQuery(() =>
      prisma.product.findFirst({
        where: { published: true },
        orderBy: { createdAt: "desc" },
        select: { coverImage: true, heroImage: true },
      })
    );
    shareImage = first?.coverImage ?? first?.heroImage ?? null;
  } catch {
    shareImage = null;
  }

  return {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    alternates: { canonical: "/tienda" },
    openGraph: {
      title: `${PAGE_TITLE} · Zodiac Noir`,
      description: PAGE_DESCRIPTION,
      url: "/tienda",
      type: "website",
      locale: "es_LA",
      ...(shareImage ? { images: [{ url: shareImage, alt: "Libros de astrología de Zodiac Noir" }] } : {}),
    },
    twitter: {
      card: shareImage ? "summary_large_image" : "summary",
      title: `${PAGE_TITLE} · Zodiac Noir`,
      description: PAGE_DESCRIPTION,
      ...(shareImage ? { images: [shareImage] } : {}),
    },
  };
}

const FAQ: { q: string; a: string }[] = [
  {
    q: "¿Cómo recibo el PDF después de pagar?",
    a: "Apenas se confirma el pago, el botón de descarga aparece en la ficha del libro (si compraste con tu cuenta) y además te enviamos el enlace por correo. Si no lo ves en tu bandeja de entrada, revisa la carpeta de spam o correo no deseado.",
  },
  {
    q: "¿En qué moneda están los precios?",
    a: "Todos los precios están en dólares (USD), para que se mantengan estables. Si pagas con Mercado Pago, que cobra en pesos argentinos, convertimos el precio al dólar blue del día, con un pequeño margen por la variación hasta que el pago se acredita; ves el monto en pesos antes de pagar. Si pagas con PayPal, se cobra directamente en dólares.",
  },
  {
    q: "¿Puedo comprar desde fuera de Latinoamérica?",
    a: "Sí. El PDF directo se paga con Mercado Pago (Latinoamérica) o con PayPal, que funciona en todo el mundo. También puedes pedir el libro en Amazon, en versión Kindle o en papel; el envío y la entrega dependen de Amazon según tu ubicación.",
  },
  {
    q: "¿Qué diferencia hay entre el PDF, el Kindle y el libro físico?",
    a: "El PDF se descarga al instante y lo puedes leer en cualquier dispositivo. El Kindle es la versión digital para la app o el lector de Amazon. El libro físico es la edición impresa que Amazon te envía a casa. El contenido es el mismo; cambia el formato y la forma de recibirlo.",
  },
  {
    q: "¿Necesito saber astrología para leer estos libros?",
    a: "Depende del título. En la ficha de cada libro, la sección «Para quién es esto» te indica el nivel y a quién está dirigido, para que elijas el que mejor se ajusta a ti.",
  },
  {
    q: "¿Quién escribe estos libros?",
    a: "Zodiac Noir: una mirada de astrología humanista y psicología astrológica, con base en el despliegue temporal, la psicología junguiana y el trabajo con símbolos. Puedes conocer más en la página Sobre nosotros.",
  },
  {
    q: "Tuve un problema con mi compra, ¿qué hago?",
    a: "Escríbenos desde la página de contacto con el correo que usaste al pagar y te ayudamos a resolverlo.",
  },
];

export default async function TiendaPage({
  searchParams,
}: {
  searchParams: { compra?: string; producto?: string };
}) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  const isLoggedIn = Boolean(email);

  const products = await safeQuery(() =>
    prisma.product.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
    })
  );

  // Cotización del dólar (para mostrar el equivalente en pesos) y quién ve el botón de PayPal.
  const quote = await getUsdArsQuote();
  const paypal = await getPaypalVisibility();

  const allViewModels: ProductViewModel[] = await Promise.all(
    products.map((product) => toProductViewModel(product, email, "/tienda?compra=1", { fxRate: quote?.rate ?? null, paypal }))
  );
  // Dos secciones: libros y e-books, y material PDF descargable (calendarios, cuadernos imprimibles…).
  const viewModels = allViewModels.filter((p) => p.kind !== "pdf");
  const pdfModels = allViewModels.filter((p) => p.kind === "pdf");

  // Datos estructurados (schema.org): le explican a Google que esta página es un catálogo de libros,
  // con el nombre, la descripción, la portada y el precio de cada uno.
  const pageUrl = `${SITE_URL}/tienda`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${pageUrl}#pagina`,
        url: pageUrl,
        name: `${PAGE_TITLE} · Zodiac Noir`,
        description: PAGE_DESCRIPTION,
        inLanguage: "es",
        isPartOf: { "@type": "WebSite", name: "Zodiac Noir", url: SITE_URL },
        mainEntity: { "@id": `${pageUrl}#catalogo` },
      },
      {
        "@type": "ItemList",
        "@id": `${pageUrl}#catalogo`,
        name: "Catálogo de libros y e-books de astrología",
        numberOfItems: products.length,
        itemListElement: products.map((product, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "Product",
            name: product.title,
            description: summarize(product.metaDescription || toPlainText(product.description), 300),
            url: `${pageUrl}/${product.slug}`,
            ...(product.coverImage || product.heroImage
              ? { image: product.coverImage ?? product.heroImage }
              : {}),
            brand: { "@type": "Brand", name: "Zodiac Noir" },
            ...(product.priceUsd || product.priceArs
              ? {
                  offers: {
                    "@type": "Offer",
                    price: product.priceUsd ?? product.priceArs,
                    priceCurrency: product.priceUsd ? "USD" : "ARS",
                    availability: "https://schema.org/InStock",
                    url: `${pageUrl}/${product.slug}`,
                  },
                }
              : {}),
          },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Tienda", item: pageUrl },
        ],
      },
    ],
  };
  const jsonLdString = serializeJsonLd(jsonLd);

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString }} />
      <StoreViewTracker kind="page" />

      {/* Presentación de la tienda */}
      <header className="max-w-3xl">
        <p className="font-ui text-xs uppercase tracking-widest2 text-gold-dim">Tienda</p>
        <h1 className="mt-2 font-display text-3xl leading-tight text-gold-pale sm:text-4xl">
          Libros y e-books de astrología
        </h1>
        <p className="mt-4 font-body text-xl leading-relaxed text-gold-pale/90">
          Esta es la tienda de Zodiac Noir: libros y e-books de astrología humanista, ciclos lunares,
          tránsitos planetarios y efemérides, pensados para que entiendas el cielo y lo lleves a tu vida
          cotidiana.
        </p>
        <p className="mt-3 font-body text-lg leading-relaxed text-gold-pale/80">
          <strong className="font-semibold text-gold-pale">Toca o haz clic en cualquier libro</strong> para ver su
          descripción completa, lo que incluye y para quién es. Puedes adquirirlo aquí mismo en PDF, con entrega
          inmediata, o pedirlo en Amazon desde cualquier parte del mundo, en Kindle o en libro físico.
        </p>
        <p className="mt-3 font-ui text-sm leading-relaxed text-gold-dim">
          Todos los precios están en dólares (USD). {FX_NOTE} Con PayPal se cobra directamente en dólares.
        </p>

        <ul className="mt-5 flex flex-wrap gap-2.5 font-ui text-xs uppercase tracking-wide text-gold-pale">
          <li className="rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1.5">PDF · pago único · descarga inmediata</li>
          <li className="rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1.5">Kindle y libro físico en Amazon</li>
          <li className="rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1.5">Disponible en todo el mundo</li>
        </ul>
      </header>

      {searchParams?.compra === "1" && (
        <div className="mt-8 rounded-xl border border-gold/30 bg-gold/10 px-5 py-4 font-ui text-sm text-gold-pale" role="status">
          {isLoggedIn ? (
            <>
              ¡Gracias por tu compra! Estamos confirmando el pago — puede tardar unos segundos.
              Si no ves el botón de descarga todavía, actualizá esta página en un momento.
            </>
          ) : (
            <>
              ¡Gracias por tu compra! Revisá el correo electrónico que usaste al pagar en Mercado
              Pago — ahí te enviamos el link de descarga de tu PDF apenas se confirme el pago
              (puede tardar unos minutos). <strong>Si no lo ves en tu bandeja de entrada, revisá
              la carpeta de spam o correo no deseado</strong>, a veces llega ahí.
            </>
          )}
        </div>
      )}
      {searchParams?.compra === "pendiente" && (
        <div className="mt-8 rounded-xl border border-gold/30 bg-gold/10 px-5 py-4 font-ui text-sm text-gold-pale" role="status">
          Tu pago quedó pendiente de confirmación (por ejemplo, si elegiste pagar en efectivo).
          En cuanto se acredite vas a poder descargar el PDF desde acá con el mismo email.
        </div>
      )}
      {searchParams?.compra === "error" && (
        <div className="mt-8 rounded-xl border border-wine/50 bg-wine/10 px-5 py-4 font-ui text-sm text-wine-bright" role="alert">
          Hubo un problema con el pago y no se completó. Podés intentarlo de nuevo cuando quieras.
        </div>
      )}

      {/* Catálogo */}
      <section aria-labelledby="catalogo-titulo" className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 id="catalogo-titulo" className="font-display text-2xl text-gold-pale">
            Catálogo
          </h2>
          {viewModels.length > 0 && (
            <p className="font-body text-base italic text-gold-dim">Toca un libro para ver su descripción ↓</p>
          )}
        </div>

        {viewModels.length === 0 ? (
          <div className="mt-6 rounded-xl border border-gold/20 bg-noir-surface/50 p-6 font-ui text-sm text-gold-dim">
            Todavía no hay productos cargados. Creá uno nuevo desde <code>/admin/productos/nuevo</code>.
          </div>
        ) : (
          <ProductGrid products={viewModels} initialProductSlug={searchParams?.producto} sectionId="libros" />
        )}
      </section>

      {/* Material PDF descargable: calendarios, cuadernos imprimibles y similares */}
      {pdfModels.length > 0 && (
        <section aria-labelledby="pdf-titulo" className="mt-16">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 id="pdf-titulo" className="font-display text-2xl text-gold-pale">
              Material PDF descargable
            </h2>
            <p className="font-body text-base italic text-gold-dim">Calendarios, cuadernos imprimibles y más ↓</p>
          </div>
          <p className="mt-3 max-w-3xl font-body text-lg leading-relaxed text-gold-pale/80">
            Material práctico para imprimir o usar en pantalla. Pago único y descarga inmediata.
          </p>
          <ProductGrid products={pdfModels} initialProductSlug={searchParams?.producto} sectionId="material-pdf" />
        </section>
      )}

      {/* Cómo conseguir los libros */}
      <section aria-labelledby="formas-titulo" className="mt-16">
        <h2 id="formas-titulo" className="font-display text-2xl text-gold-pale">
          Dos formas de conseguir tu libro
        </h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-gold/25 bg-noir-surface/60 p-6">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-8 w-8 text-gold" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M5 19h14" />
            </svg>
            <h3 className="mt-3 font-display text-lg text-gold-pale">PDF directo en esta tienda</h3>
            <p className="mt-2 font-body text-lg leading-relaxed text-gold-pale/80">
              Pago único con Mercado Pago (Latinoamérica) o con PayPal. Cuando se confirma el pago, descargas el
              PDF al instante y también lo recibes por correo. Ideal si quieres empezar a leer hoy mismo.
            </p>
          </div>
          <div className="rounded-2xl border border-gold/25 bg-noir-surface/60 p-6">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-8 w-8 text-gold" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
            </svg>
            <h3 className="mt-3 font-display text-lg text-gold-pale">Amazon, desde cualquier país</h3>
            <p className="mt-2 font-body text-lg leading-relaxed text-gold-pale/80">
              Si estás fuera de Latinoamérica o prefieres el papel, abre la ficha del libro y elige Kindle o
              libro físico. Amazon se encarga del pago, el envío y la entrega según tu ubicación.
            </p>
          </div>
        </div>
      </section>

      {/* Preguntas frecuentes */}
      <section aria-labelledby="faq-titulo" className="mt-16">
        <h2 id="faq-titulo" className="font-display text-2xl text-gold-pale">
          Preguntas frecuentes
        </h2>
        <div className="mt-6 divide-y divide-gold/20 rounded-2xl border border-gold/25 bg-noir-surface/40">
          {FAQ.map((item) => (
            <details key={item.q} className="group px-5 py-4 sm:px-6">
              <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-4 font-display text-base text-gold-pale [&::-webkit-details-marker]:hidden">
                <span>{item.q}</span>
                <span
                  aria-hidden="true"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold/40 font-ui text-lg leading-none text-gold transition-transform duration-300 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-3xl font-body text-lg leading-relaxed text-gold-pale/80">{item.a}</p>
              {item.q.startsWith("¿Quién escribe") && (
                <Link href="/sobre-nosotros" className="focus-ring mt-2 inline-block font-ui text-sm text-gold-pale underline decoration-gold decoration-2 underline-offset-4 hover:text-gold">
                  Conocer más sobre Zodiac Noir
                </Link>
              )}
              {item.q.startsWith("Tuve un problema") && (
                <Link href="/contacto" className="focus-ring mt-2 inline-block font-ui text-sm text-gold-pale underline decoration-gold decoration-2 underline-offset-4 hover:text-gold">
                  Ir a la página de contacto
                </Link>
              )}
            </details>
          ))}
        </div>
      </section>

      {/* Invitación a la membresía y a los artículos */}
      <section className="mt-16 rounded-2xl border border-gold/30 bg-gold/5 px-6 py-8 text-center sm:px-10">
        <h2 className="font-display text-xl text-gold-pale sm:text-2xl">¿Prefieres seguir leyendo con nosotros?</h2>
        <p className="mx-auto mt-3 max-w-2xl font-body text-lg leading-relaxed text-gold-pale/80">
          En el sitio publicamos artículos de astrología sobre lunaciones, eclipses y tránsitos. Con la membresía
          accedes además a los artículos premium.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link
            href="/blog"
            className="focus-ring rounded-full border border-gold/50 px-5 py-2.5 font-ui text-sm uppercase tracking-wide text-gold-pale transition hover:bg-gold/10"
          >
            Ver el blog
          </Link>
          <Link
            href="/membresia"
            className="focus-ring rounded-full bg-gold px-5 py-2.5 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright"
          >
            Conocer la membresía
          </Link>
        </div>
      </section>
    </div>
  );
}
