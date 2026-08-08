import type { Metadata } from "next";
import { NatalChartCalculator } from "@/components/NatalChartCalculator";

export const metadata: Metadata = {
  title: "Calculá tu carta natal",
  description: "Calculá gratis tu carta astral con fecha, hora y lugar de nacimiento.",
};

export default function NatalChartPage() {
  return (
    <section className="mx-auto max-w-4xl px-5 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-ui text-xs uppercase tracking-widest2 text-gold-dim">Herramienta gratuita</p>
        <h1 className="mt-3 font-display text-4xl text-gold-pale">Calculá tu carta astral</h1>
        <p className="mt-4 font-body text-lg text-gold-pale/80">
          Ingresá tu fecha, hora y lugar de nacimiento para ver tu Sol, Luna, Ascendente y la
          posición completa de los planetas.
        </p>
      </div>

      <div className="mt-12">
        <NatalChartCalculator />
      </div>
    </section>
  );
}
