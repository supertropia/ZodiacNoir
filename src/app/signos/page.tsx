import type { Metadata } from "next";
import Link from "next/link";
import { signs } from "@/data/signs";

export const metadata: Metadata = {
  title: "Los doce signos",
  description: "Elemento, modalidad, regente y perfil de cada uno de los doce signos del zodiaco.",
};

export default function SignsPage() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <p className="font-ui text-xs uppercase tracking-widest2 text-gold-dim">Guía</p>
      <h1 className="mt-3 font-display text-4xl text-gold-pale">Los doce signos</h1>
      <p className="mt-4 max-w-2xl font-body text-lg text-gold-pale/80">
        Cada signo describe una forma de procesar la experiencia, no un destino fijo. Elegí uno
        para ver su elemento, modalidad y regente.
      </p>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {signs.map((s) => (
          <Link
            key={s.slug}
            href={`/signos/${s.slug}`}
            className="group rounded-2xl border border-gold/15 bg-noir-surface/40 p-6 transition hover:border-gold/50 hover:bg-noir-surface"
          >
            <div className="flex items-center gap-3">
              <span className="font-display text-4xl text-gold group-hover:text-gold-bright">{s.glyph}</span>
              <div>
                <h3 className="font-display text-xl text-gold-pale">{s.name}</h3>
                <p className="font-ui text-xs text-gold-dim">{s.dates}</p>
              </div>
            </div>
            <p className="mt-4 font-body text-base text-gold-pale/80">{s.summary}</p>
            <p className="mt-3 font-ui text-xs uppercase tracking-wide text-gold-dim">
              {s.element} · {s.modality} · Regente {s.ruler}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
