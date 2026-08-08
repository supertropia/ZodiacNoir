import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Herramientas" };

export default function ToolsHubPage() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <p className="font-ui text-xs uppercase tracking-widest2 text-gold-dim">Herramientas gratuitas</p>
      <h1 className="mt-3 font-display text-4xl text-gold-pale">Calculá tu cielo</h1>
      <p className="mt-4 max-w-2xl font-body text-lg text-gold-pale/80">
        Dos herramientas gratuitas para empezar a conocer tu mapa astrológico.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-gold/25 bg-noir-surface/50 p-8">
          <p className="font-display text-sm uppercase tracking-wide text-gold-dim">Calculá</p>
          <h2 className="mt-1 font-display text-2xl text-gold-pale">tu carta astral</h2>
          <p className="mt-4 font-body text-base text-gold-pale/80">
            Conocer el mapa de los planetas al momento de tu nacimiento te ayuda a entender tus
            talentos, tu personalidad y tu propósito de vida.
          </p>
          <Link
            href="/carta-natal"
            className="focus-ring mt-6 inline-block rounded-full bg-gold px-6 py-3 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright"
          >
            Calculá tu carta gratis
          </Link>
        </div>

        <div className="rounded-2xl border border-gold/25 bg-noir-surface/50 p-8">
          <p className="font-display text-sm uppercase tracking-wide text-gold-dim">Calculá</p>
          <h2 className="mt-1 font-display text-2xl text-gold-pale">tus tránsitos diarios</h2>
          <p className="mt-4 font-body text-base text-gold-pale/80">
            Saber cómo se mueven los planetas el día de hoy te permite comprender la energía que
            está influyendo en vos para tomar mejores decisiones.
          </p>
          <Link
            href="/transitos-diarios"
            className="focus-ring mt-6 inline-block rounded-full border border-gold/40 px-6 py-3 font-ui text-sm font-medium uppercase tracking-wide text-gold transition hover:bg-gold/10"
          >
            Ver tránsitos de hoy gratis
          </Link>
        </div>
      </div>
    </section>
  );
}
