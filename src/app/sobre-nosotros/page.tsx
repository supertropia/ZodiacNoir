import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sobre nosotros",
  description: "Quiénes escriben en Zodiac Noir y cómo trabajamos el contenido.",
};

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16">
      <p className="font-ui text-xs uppercase tracking-widest2 text-gold-dim">Editorial</p>
      <h1 className="mt-3 font-display text-4xl text-gold-pale">Quiénes somos y cómo trabajamos</h1>

      <div className="mt-10 space-y-8 font-body text-xl leading-relaxed text-gold-pale/85">
        <p>
          Zodiac Noir nace para tratar la astrología con el mismo cuidado editorial que cualquier
          otro tema: con autoría clara, revisión por especialistas y sin recurrir a contenido
          genérico escrito solo para posicionar en buscadores.
        </p>
        <p>
          Cada artículo está firmado por quien lo escribió, con su formación y años de ejercicio.
          Los datos astronómicos (fechas de lunaciones, eclipses y retrogradaciones) se contrastan
          contra efemérides públicas antes de publicarse. La interpretación astrológica siempre se
          presenta como eso — una lente de lectura simbólica — y no como un hecho verificable.
        </p>
        <p>
          No usamos automatización para generar artículos en masa. Si en algún momento
          incorporamos herramientas de IA como apoyo de redacción, lo vamos a indicar de forma
          explícita en el artículo correspondiente.
        </p>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-gold/15 bg-noir-surface/40 p-6">
          <h3 className="font-display text-xl text-gold-pale">Elena Duarte</h3>
          <p className="mt-1 font-ui text-xs uppercase tracking-wide text-gold-dim">
            Astróloga profesional (AFAN), 14 años de consulta
          </p>
          <p className="mt-3 font-body text-base text-gold-pale/80">
            Especializada en astrología psicológica y tránsitos. Escribe la sección de efemérides
            y perfiles de signo.
          </p>
        </div>
        <div className="rounded-2xl border border-gold/15 bg-noir-surface/40 p-6">
          <h3 className="font-display text-xl text-gold-pale">Tomás Reyes</h3>
          <p className="mt-1 font-ui text-xs uppercase tracking-wide text-gold-dim">
            Tarotista, tradición Rider-Waite-Smith
          </p>
          <p className="mt-3 font-body text-base text-gold-pale/80">
            Ocho años de lectura de tarot en consulta privada. Escribe la sección de tarot y
            colabora en efemérides.
          </p>
        </div>
      </div>
    </section>
  );
}
