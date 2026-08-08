import type { Metadata } from "next";
import { calculateDailyTransits } from "@/lib/astrology";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tránsitos de hoy",
  description: "Posiciones planetarias actuales, actualizadas cada día.",
};

export default function DailyTransitsPage() {
  const transits = calculateDailyTransits();
  const today = new Date().toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <section className="mx-auto max-w-3xl px-5 py-16">
      <p className="font-ui text-xs uppercase tracking-widest2 text-gold-dim">Hoy, {today}</p>
      <h1 className="mt-3 font-display text-4xl text-gold-pale">Tránsitos de hoy</h1>
      <p className="mt-4 max-w-2xl font-body text-lg text-gold-pale/80">
        Estas son las posiciones actuales de los planetas. Cada tránsito activa una energía
        distinta — conocerla te ayuda a entender el clima general del día.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {transits.map((p) => (
          <div key={p.key} className="flex items-center justify-between rounded-xl border border-gold/15 bg-noir-surface/40 px-5 py-4">
            <div>
              <p className="font-display text-lg text-gold-pale">{p.name}</p>
              <p className="font-ui text-xs text-gold-dim">
                {p.degreeInSign}° en {p.sign}
                {p.retrograde && " · Retrógrado"}
              </p>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-10 font-ui text-xs text-gold-dim">
        Cálculo propio con sistema de casas Placidus, zodíaco tropical. Los grados son
        geocéntricos y no dependen de tu ubicación.
      </p>
    </section>
  );
}
