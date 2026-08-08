import type { Metadata } from "next";
import { cosmicEvents } from "@/data/events";

export const metadata: Metadata = {
  title: "Efemérides",
  description: "Calendario de lunaciones, eclipses y retrogradaciones planetarias.",
};

const TYPE_LABEL: Record<string, string> = {
  "eclipse-solar": "Eclipse solar",
  "eclipse-lunar": "Eclipse lunar",
  "luna-nueva": "Luna nueva",
  "luna-llena": "Luna llena",
  "retrogrado-inicio": "Inicia retrogradación",
  "retrogrado-fin": "Termina retrogradación",
  estacion: "Punto cardinal",
};

export default function EphemerisPage() {
  const sorted = [...cosmicEvents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <section className="mx-auto max-w-4xl px-5 py-16">
      <p className="font-ui text-xs uppercase tracking-widest2 text-gold-dim">Calendario</p>
      <h1 className="mt-3 font-display text-4xl text-gold-pale">Efemérides</h1>
      <p className="mt-4 max-w-2xl font-body text-lg text-gold-pale/80">
        Lunaciones, eclipses y estaciones planetarias verificados contra efemérides astronómicas
        públicas. Las horas exactas pueden variar según tu zona horaria.
      </p>

      <ol className="mt-12 space-y-0">
        {sorted.map((e, i) => {
          const date = new Date(e.date + "T12:00:00");
          const formatted = date.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
          return (
            <li key={i} className="flex gap-6 border-l border-gold/20 py-5 pl-6">
              <div className="w-24 shrink-0 font-ui text-xs uppercase tracking-wide text-gold-dim">{formatted}</div>
              <div>
                <p className="font-ui text-xs uppercase tracking-wide text-gold">
                  {TYPE_LABEL[e.type] ?? e.type}
                  {e.sign ? ` · ${e.sign}` : ""}
                </p>
                <h3 className="mt-1 font-display text-lg text-gold-pale">{e.title}</h3>
                <p className="mt-1 font-body text-base text-gold-pale/75">{e.description}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
