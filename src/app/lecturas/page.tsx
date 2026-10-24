import Link from "next/link";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { getReadingsEnabled } from "@/lib/site-settings";
import { ChartWheel } from "@/components/lecturas/ChartWheel";
import { LecturasShop, type ShopService } from "@/components/lecturas/LecturasShop";
import { getUsdArsQuote, usdToArs } from "@/lib/exchange-rate";
import { READING_DELIVERY_WINDOW, READING_SERVICES, getReadingService, type ReadingServiceKey } from "@/lib/lecturas";
import { serializeJsonLd } from "@/lib/seo";

const SITE_URL = process.env.NEXTAUTH_URL || "https://zodiacnoirweb.com";

const PAGE_TITLE = "Lecturas personalizadas: carta natal y revolución solar";
const PAGE_DESCRIPTION =
  "Carta natal arquetípica y revolución solar, escritas para ti desde la astrología humanista y la psicología junguiana. Las recibes en PDF por correo en un plazo de 5 a 7 días hábiles desde la confirmación del pago.";

export const dynamic = "force-dynamic";

const baseMetadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/lecturas" },
  openGraph: {
    title: `${PAGE_TITLE} · Zodiac Noir`,
    description: PAGE_DESCRIPTION,
    url: "/lecturas",
    type: "website",
    locale: "es_LA",
  },
  twitter: {
    card: "summary",
    title: `${PAGE_TITLE} · Zodiac Noir`,
    description: PAGE_DESCRIPTION,
  },
};

// Con las lecturas ocultas, la página no debe indexarse en buscadores.
export async function generateMetadata(): Promise<Metadata> {
  const enabled = await getReadingsEnabled();
  return enabled ? baseMetadata : { ...baseMetadata, robots: { index: false, follow: false } };
}

const STEPS = [
  {
    title: "Eliges tu lectura",
    text: "Carta natal para conocerte a fondo, o revolución solar para orientar tu próximo año.",
  },
  {
    title: "Me cuentas tus datos",
    text: "Fecha, hora y lugar de nacimiento, y qué área te gustaría profundizar. Luego pagas con tarjeta, transferencia o efectivo.",
  },
  {
    title: `La recibes en ${READING_DELIVERY_WINDOW}`,
    text: "Elaboro tu lectura y te llega en PDF a tu correo. También queda disponible en Mi cuenta.",
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "¿Qué necesito para pedir mi lectura?",
    a: "Tu fecha, tu hora y tu lugar de nacimiento. La hora exacta suele figurar en el acta o certificado de nacimiento; si solo la conoces de forma aproximada, también puedes indicarla. Para la revolución solar necesito además saber dónde estarás el día de tu cumpleaños.",
  },
  {
    q: "No conozco mi hora de nacimiento, ¿puedo pedir la lectura igual?",
    a: "Sí. Sin la hora no es posible calcular el Ascendente ni las casas, así que la lectura se centra en la posición de los planetas en los signos y en los aspectos entre ellos. Es una lectura valiosa, pero menos completa que con la hora exacta.",
  },
  {
    q: "¿Cuándo recibo mi lectura?",
    a: `En un plazo de ${READING_DELIVERY_WINDOW} desde la confirmación del pago. Cada lectura se elabora para la persona que la pide, por eso no es instantánea como un PDF de la tienda. Te llega por correo en formato PDF y queda disponible en Mi cuenta si pediste con una cuenta iniciada.`,
  },
  {
    q: "¿Por qué el precio está en dólares si pago en pesos?",
    a: "Los precios de las lecturas se fijan en dólares para que se mantengan estables en el tiempo. Mercado Pago cobra en pesos argentinos, así que al continuar convertimos el precio al dólar oficial del día más un pequeño margen por la variación hasta que el pago se acredita. Ves el monto exacto en pesos antes de pagar y no cambia después.",
  },
  {
    q: "¿Qué es una revolución solar?",
    a: "Cada año, el Sol regresa al grado exacto donde estaba cuando naciste. La carta de ese instante es la revolución solar, y la astrología la usa como un mapa simbólico del año que comienza en tu cumpleaños: qué temas se activan, qué pide atención y qué ciclos se cruzan con tu carta natal.",
  },
  {
    q: "¿La lectura predice mi futuro?",
    a: "No. La astrología que practico es humanista: no anuncia sucesos ni destinos cerrados, sino que ofrece un lenguaje simbólico para entender tus tendencias, tus recursos y tus conflictos, y decidir mejor qué hacer con ellos. Es una herramienta de autoconocimiento y no reemplaza la atención médica, psicológica ni legal.",
  },
  {
    q: "¿Qué hacen con mis datos de nacimiento?",
    a: "Solo los uso para calcular y escribir tu lectura y para enviártela. No se publican ni se comparten con terceros, salvo los servicios que intervienen en el pago, en el envío del correo y en la preparación de la lectura, que puede apoyarse en herramientas de inteligencia artificial; cada lectura la reviso yo antes de enviarla. Puedes ver el detalle en la política de privacidad.",
  },
  {
    q: "Tuve un problema con mi pedido, ¿qué hago?",
    a: "Escríbenos desde la página de contacto con el correo que usaste al pedir y te ayudamos a resolverlo.",
  },
];

export default async function LecturasPage({
  searchParams,
}: {
  searchParams: { servicio?: string; pago?: string };
}) {
  const session = await getServerSession(authOptions);
  const readingsEnabled = await getReadingsEnabled();
  const isAdmin = isAdminEmail(session?.user?.email);

  // Lecturas ocultas: el público ve un aviso; la administración ve la página completa para probarla.
  if (!readingsEnabled && !isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center">
        <p className="font-ui text-xs uppercase tracking-widest2 text-gold-dim">Lecturas personalizadas</p>
        <h1 className="mt-4 font-display text-4xl text-gold-pale sm:text-5xl">
          Muy <span className="italic text-gold">pronto</span>
        </h1>
        <p className="mt-6 font-body text-xl leading-relaxed text-gold-pale/85">
          Estamos preparando las lecturas de carta natal y revolución solar. Mientras tanto, puedes seguir explorando el
          sitio.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/articulos"
            className="focus-ring rounded-full bg-gold px-6 py-3 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright"
          >
            Explorar artículos
          </Link>
          <Link
            href="/efemerides"
            className="focus-ring rounded-full border border-gold/50 px-6 py-3 font-ui text-sm font-medium uppercase tracking-wide text-gold transition hover:bg-gold/10"
          >
            Ver efemérides
          </Link>
        </div>
      </div>
    );
  }

  const quote = await getUsdArsQuote();

  const services: ShopService[] = READING_SERVICES.map((s) => ({
    key: s.key,
    name: s.name,
    eyebrow: s.eyebrow,
    priceUsd: s.priceUsd,
    priceArs: quote ? usdToArs(s.priceUsd, quote.rate) : null,
    summary: s.summary,
    includes: s.includes,
    idealFor: s.idealFor,
    cta: s.cta,
  }));

  const initial = getReadingService(searchParams?.servicio);
  const initialService: ReadingServiceKey | null = initial?.key ?? null;

  const now = new Date();
  const pageUrl = `${SITE_URL}/lecturas`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#pagina`,
        url: pageUrl,
        name: `${PAGE_TITLE} · Zodiac Noir`,
        description: PAGE_DESCRIPTION,
        inLanguage: "es",
        isPartOf: { "@type": "WebSite", name: "Zodiac Noir", url: SITE_URL },
      },
      ...READING_SERVICES.map((s) => ({
        "@type": "Service",
        "@id": `${pageUrl}#${s.key}`,
        name: s.name,
        description: s.summary,
        serviceType: "Lectura astrológica personalizada",
        provider: { "@type": "Organization", name: "Zodiac Noir", url: SITE_URL },
        offers: {
          "@type": "Offer",
          price: s.priceUsd,
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: pageUrl,
        },
      })),
      {
        "@type": "FAQPage",
        mainEntity: FAQ.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Lecturas", item: pageUrl },
        ],
      },
    ],
  };

  return (
    <div className="pb-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />

      {!readingsEnabled && (
        <div className="border-b border-gold/40 bg-gold/10 px-5 py-3 text-center font-ui text-sm text-gold-pale">
          Las lecturas están <strong>ocultas</strong> para el público: esta página solo la ves tú. Para publicarlas, usa el
          botón en{" "}
          <Link href="/admin/lecturas" className="text-gold underline">
            Panel → Lecturas
          </Link>
          .
        </div>
      )}

      {/* Presentación */}
      <section className="relative overflow-hidden px-5 pb-14 pt-10 sm:pt-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="font-ui text-xs uppercase tracking-widest2 text-gold-dim">Lecturas personalizadas</p>
            <h1 className="mt-4 font-display text-4xl leading-tight text-gold-pale sm:text-5xl">
              Tu carta, leída como un <span className="italic text-gold">mapa de tu psique</span>
            </h1>
            <p className="mt-6 max-w-xl font-body text-xl leading-relaxed text-gold-pale/90">
              Una lectura escrita para ti desde la astrología humanista y la mirada arquetípica de Jung: no un texto
              genérico por tu signo, sino tu carta, con tus planetas, tus casas y tus aspectos.
            </p>
            <ul className="mt-6 flex flex-wrap gap-2.5 font-ui text-xs uppercase tracking-wide text-gold-pale">
              <li className="rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1.5">
                PDF a tu correo en 5 a 7 días hábiles
              </li>
              <li className="rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1.5">Pago con tarjeta, transferencia o efectivo</li>
              <li className="rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1.5">Lectura personalizada</li>
            </ul>
            <a
              href="#elige"
              className="focus-ring mt-8 inline-block rounded-full bg-gold px-7 py-3 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright"
            >
              Elegir mi lectura
            </a>
          </div>
          <div className="flex justify-center lg:justify-end">
            <ChartWheel size={340} className="max-w-full drop-shadow-[0_0_45px_rgba(201,162,75,0.25)]" />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5">
        <div className="gold-line" />
      </div>

      {/* Elegir y pedir */}
      <section id="elige" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-14">
        <header className="mb-8 max-w-2xl">
          <h2 className="font-display text-2xl text-gold-pale sm:text-3xl">Dos lecturas, dos preguntas distintas</h2>
          <p className="mt-3 font-body text-lg leading-relaxed text-gold-pale/85">
            La carta natal responde a «¿quién soy?». La revolución solar, a «¿qué me pide este año?». Se piden por
            separado, y se complementan.
          </p>
        </header>

        <LecturasShop
          services={services}
          initialService={initialService}
          defaultName={session?.user?.name ?? ""}
          defaultEmail={session?.user?.email ?? ""}
          currentYear={now.getFullYear()}
          todayIso={now.toISOString().slice(0, 10)}
          rateLabel={quote ? `1 USD = ARS ${Math.round(quote.rate).toLocaleString("es-AR")}` : null}
          paymentCancelled={searchParams?.pago === "error"}
        />
      </section>

      {/* Cómo funciona */}
      <section className="mx-auto max-w-6xl px-5 py-10">
        <h2 className="font-display text-2xl text-gold-pale sm:text-3xl">Cómo funciona</h2>
        <ol className="mt-8 grid gap-5 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="rounded-2xl border border-gold/20 bg-noir-surface/40 p-6">
              <span className="font-display text-3xl text-gold">{i + 1}</span>
              <h3 className="mt-3 font-display text-lg text-gold-pale">{step.title}</h3>
              <p className="mt-2 font-body text-lg leading-relaxed text-gold-pale/80">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* La mirada arquetípica */}
      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-10 rounded-3xl border border-gold/25 bg-noir-surface/40 p-8 sm:p-12 lg:grid-cols-2">
          <div>
            <p className="font-ui text-xs uppercase tracking-widest2 text-gold-dim">La mirada</p>
            <h2 className="mt-2 font-display text-2xl text-gold-pale sm:text-3xl">Astrología arquetípica y humanista</h2>
            <p className="mt-4 font-body text-lg leading-relaxed text-gold-pale/85">
              Para Jung, los planetas y los signos pueden leerse como imágenes de arquetipos: patrones universales con los
              que la psique se expresa. La astrología humanista toma ese puente y lo usa para el autoconocimiento, no para
              el pronóstico.
            </p>
            <p className="mt-3 font-body text-lg leading-relaxed text-gold-pale/85">
              Por eso tu lectura no te dice «qué te va a pasar», sino qué fuerzas internas se están moviendo, dónde está tu
              sombra y qué te pide integrar. La carta es un símbolo para pensar con más honestidad sobre ti, no una
              sentencia.
            </p>
          </div>
          <div>
            <p className="font-ui text-xs uppercase tracking-widest2 text-gold-dim">Quién la escribe</p>
            <h2 className="mt-2 font-display text-2xl text-gold-pale sm:text-3xl">Una sola voz, sin plantillas</h2>
            <p className="mt-4 font-body text-lg leading-relaxed text-gold-pale/85">
              Soy astróloga humanista, especializada en despliegue temporal: cómo se mueven los ciclos planetarios a lo largo
              de una vida. Hice cursos de Counseling y estudié Psicología, y eso marca la forma en que escribo: con
              cuidado, con profundidad y sin lenguaje alarmista.
            </p>
            <p className="mt-3 font-body text-lg leading-relaxed text-gold-pale/85">
              Puedes conocer más sobre el método en{" "}
              <Link href="/sobre-nosotros" className="text-gold underline hover:text-gold-bright">
                Sobre nosotros
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Preguntas frecuentes */}
      <section className="mx-auto max-w-3xl px-5 py-12">
        <h2 className="font-display text-2xl text-gold-pale sm:text-3xl">Preguntas frecuentes</h2>
        <div className="mt-6 divide-y divide-gold/15 rounded-2xl border border-gold/20 bg-noir-surface/40">
          {FAQ.map((item) => (
            <details key={item.q} className="group px-5 py-1">
              <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-display text-base text-gold-pale [&::-webkit-details-marker]:hidden">
                <span>{item.q}</span>
                <span aria-hidden="true" className="shrink-0 text-2xl leading-none text-gold transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="pb-5 font-body text-lg leading-relaxed text-gold-pale/85">{item.a}</p>
            </details>
          ))}
        </div>

        <p className="mt-8 text-center font-ui text-xs leading-relaxed text-gold-dim">
          Las lecturas tienen fines de autoconocimiento y entretenimiento. No constituyen asesoramiento médico, psicológico,
          legal ni financiero, ni garantizan resultados.
        </p>
      </section>
    </div>
  );
}
