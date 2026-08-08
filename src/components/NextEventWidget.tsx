import { nextEvent } from "@/data/events";

const TYPE_LABEL: Record<string, string> = {
  "eclipse-solar": "Eclipse solar",
  "eclipse-lunar": "Eclipse lunar",
  "luna-nueva": "Luna nueva",
  "luna-llena": "Luna llena",
  "retrogrado-inicio": "Inicio de retrogradación",
  "retrogrado-fin": "Fin de retrogradación",
  estacion: "Punto cardinal",
};

export function NextEventWidget() {
  const event = nextEvent(new Date("2026-07-29"));
  if (!event) return null;

  const date = new Date(event.date + "T12:00:00");
  const formatted = date.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="rounded-2xl border border-gold/25 bg-noir-surface/60 p-7">
      <p className="font-ui text-xs uppercase tracking-widest2 text-gold-dim">Próximo evento cósmico</p>
      <p className="mt-2 font-ui text-xs uppercase tracking-wide text-gold">{TYPE_LABEL[event.type] ?? event.type}</p>
      <h3 className="mt-1 font-display text-2xl text-gold-pale">{event.title}</h3>
      <p className="mt-2 font-ui text-sm text-gold-dim">{formatted}</p>
      <p className="mt-3 font-body text-base text-gold-pale/85">{event.description}</p>
    </div>
  );
}
