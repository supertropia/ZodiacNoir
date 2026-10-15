import { nextEvent, formatEventDateLong, formatEventTime } from "@/data/events";
import { CountdownTimer } from "./CountdownTimer";

const TYPE_LABEL: Record<string, string> = {
  "eclipse-solar": "Eclipse solar",
  "eclipse-lunar": "Eclipse lunar",
  "luna-nueva": "Luna nueva",
  "luna-llena": "Luna llena",
  "retrogrado-inicio": "Inicio de retrogradación",
  "retrogrado-fin": "Fin de retrogradación",
  aspecto: "Aspecto planetario",
  estacion: "Punto cardinal",
};

export function NextEventWidget() {
  const event = nextEvent(new Date());
  if (!event) return null;

  return (
    <div className="rounded-2xl border border-gold/25 bg-noir-surface/60 p-7">
      <p className="font-ui text-xs uppercase tracking-widest2 text-gold-dim">Próximo evento cósmico</p>
      <p className="mt-2 font-ui text-xs uppercase tracking-wide text-gold">{TYPE_LABEL[event.type] ?? event.type}</p>
      <h3 className="mt-1 font-display text-2xl text-gold-pale">{event.title}</h3>
      {/* Fecha y hora en UTC; la cuenta regresiva apunta al mismo instante exacto. */}
      <p className="mt-2 font-ui text-sm text-gold-dim">
        {formatEventDateLong(event)} · {formatEventTime(event)}
      </p>
      <div className="mt-4">
        <CountdownTimer targetIso={event.utc} />
      </div>
      <p className="mt-4 font-body text-base text-gold-pale/85">{event.description}</p>
    </div>
  );
}
