import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sobre nosotros",
  description:
    "Astrología humanista, tarot y psicología simbólica: quién escribe en Zodiac Noir y cómo trabaja el contenido.",
};

const CREDENTIALS = [
  "Astrología humanista, especializada en despliegue temporal (tránsitos)",
  "Formación en Counseling",
  "Estudios de Psicología",
  "Cábala",
  "Tarot — mazo favorito: Rider-Waite-Smith",
  "Psicología junguiana",
  "Arteterapia",
];

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16">
      <p className="font-ui text-xs uppercase tracking-widest2 text-gold-dim">Editorial</p>
      <h1 className="mt-3 font-display text-4xl text-gold-pale">Sobre mí</h1>

      <div className="mt-10 space-y-8 font-body text-xl leading-relaxed text-gold-pale/85">
        <p>
          Soy <strong>Zodiac Noir</strong>, y este espacio es, ante todo, una forma de pensar la
          astrología y el tarot con seriedad — sin promesas vacías ni horóscopos de relleno. Mi
          formación es en astrología humanista, especializada en despliegue temporal: cómo se
          despliegan los tránsitos y los ciclos planetarios en la vida real de una persona, no
          solo en el papel.
        </p>
        <p>
          Además de la astrología, hice cursos de Counseling y estudié Psicología, lo cual cambió
          por completo mi forma de leer una carta natal: dejé de buscar certezas y empecé a buscar
          preguntas útiles. También me formé en Cábala, en psicología junguiana y en arteterapia —
          tres caminos distintos que terminan en el mismo lugar: el símbolo como herramienta para
          entendernos.
        </p>
        <p>
          Soy tarotista, y mi mazo favorito es el <em>Rider-Waite-Smith</em> — el clásico de los
          clásicos, el que enseña a leer antes de enseñar a interpretar. Colecciono oráculos; me
          fascina la simbología en todas sus formas, y cada mazo nuevo es, para mí, un sistema de
          significado distinto para explorar.
        </p>
        <p>
          Todo el contenido de Zodiac Noir está firmado con este mismo nombre. Los datos
          astronómicos (fechas de lunaciones, eclipses y retrogradaciones) se contrastan contra
          efemérides públicas antes de publicarse. La interpretación astrológica siempre se
          presenta como eso — una lente de lectura simbólica — y no como un hecho verificable.
        </p>
        <p>
          No uso automatización para generar artículos en masa. Si en algún momento incorporo
          herramientas de IA como apoyo de redacción, lo voy a indicar de forma explícita en el
          artículo correspondiente.
        </p>
      </div>

      <div className="mt-14 rounded-2xl border border-gold/15 bg-noir-surface/40 p-7">
        <h2 className="font-display text-xl text-gold-pale">Formación</h2>
        <ul className="mt-4 space-y-2.5">
          {CREDENTIALS.map((item) => (
            <li key={item} className="flex items-start gap-2.5 font-body text-base text-gold-pale/80">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-4">
        <a
          href="https://www.instagram.com/zodiac_noir_astrologia_y_tarot/"
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring rounded-full border border-gold/40 px-5 py-2.5 font-ui text-xs uppercase tracking-wide text-gold transition hover:border-gold hover:bg-gold/10"
        >
          Instagram
        </a>
        <a
          href="https://x.com/zodiacnoir"
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring rounded-full border border-gold/40 px-5 py-2.5 font-ui text-xs uppercase tracking-wide text-gold transition hover:border-gold hover:bg-gold/10"
        >
          X
        </a>
      </div>
    </section>
  );
}
