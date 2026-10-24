"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  BIRTH_TIME_OPTIONS,
  READING_DELIVERY_WINDOW,
  READING_FOCUS_OPTIONS,
  formatArs,
  formatUsd,
  type BirthTimeMode,
  type ReadingServiceKey,
} from "@/lib/lecturas";

export type ShopService = {
  key: ReadingServiceKey;
  name: string;
  eyebrow: string;
  priceUsd: number;
  /** Precio en pesos al cambio de hoy (null si no hay cotización disponible). */
  priceArs: number | null;
  summary: string;
  includes: string[];
  idealFor: string;
  cta: string;
};

const ABOUT_MAX = 1500;

const inputClass =
  "focus-ring w-full rounded-xl border border-gold/40 bg-transparent px-4 py-3 font-ui text-sm text-current placeholder:text-gold-dim focus:border-gold";
const labelClass = "mb-1 block font-ui text-xs uppercase tracking-wide text-gold-dim";

export function LecturasShop({
  services,
  initialService,
  defaultName,
  defaultEmail,
  currentYear,
  todayIso,
  rateLabel,
  paymentCancelled,
}: {
  services: ShopService[];
  initialService: ReadingServiceKey | null;
  defaultName: string;
  defaultEmail: string;
  currentYear: number;
  todayIso: string;
  rateLabel: string | null;
  paymentCancelled: boolean;
}) {
  const [selected, setSelected] = useState<ReadingServiceKey | null>(initialService);
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [birthDate, setBirthDate] = useState("");
  const [timeMode, setTimeMode] = useState<BirthTimeMode>("exact");
  const [birthTime, setBirthTime] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [focus, setFocus] = useState("general");
  const [about, setAbout] = useState("");
  const [solarYear, setSolarYear] = useState(currentYear);
  const [solarPlace, setSolarPlace] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(""); // trampa para bots: las personas no lo ven
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef<HTMLDivElement>(null);

  const service = services.find((s) => s.key === selected) ?? null;

  // Si se llega desde otra página con ?servicio=..., baja directo al formulario.
  useEffect(() => {
    if (initialService && formRef.current) {
      const timer = setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 250);
      return () => clearTimeout(timer);
    }
  }, [initialService]);

  const choose = (key: ReadingServiceKey) => {
    setSelected(key);
    setError("");
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!service || loading) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/lecturas/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: service.key,
          name,
          email,
          birthDate,
          birthTimeMode: timeMode,
          birthTime: timeMode === "unknown" ? "" : birthTime,
          birthPlace,
          focus,
          about,
          solarYear: service.key === "revolucion-solar" ? solarYear : undefined,
          solarPlace: service.key === "revolucion-solar" ? solarPlace : undefined,
          consent,
          website,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || "No pudimos iniciar el pago. Inténtalo de nuevo en unos minutos.");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal. Inténtalo de nuevo.");
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Tarjetas de los dos servicios */}
      <div className="grid gap-6 lg:grid-cols-2">
        {services.map((s) => {
          const active = s.key === selected;
          return (
            <article
              key={s.key}
              className={`flex flex-col rounded-3xl border bg-noir-surface/50 p-7 transition sm:p-8 ${
                active ? "border-gold shadow-[0_0_40px_rgba(201,162,75,0.18)]" : "border-gold/25 hover:border-gold/60"
              }`}
            >
              <p className="font-ui text-xs uppercase tracking-widest2 text-gold-dim">{s.eyebrow}</p>
              <h3 className="mt-2 font-display text-2xl text-gold-pale sm:text-3xl">{s.name}</h3>

              <p className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-display text-4xl text-gold">{formatUsd(s.priceUsd)}</span>
                {s.priceArs ? (
                  <span className="font-ui text-sm text-gold-pale/80">≈ {formatArs(s.priceArs)} al cambio de hoy</span>
                ) : null}
              </p>

              <p className="mt-4 font-body text-lg leading-relaxed text-gold-pale/90">{s.summary}</p>
              <p className="mt-3 font-body text-base italic leading-relaxed text-gold-pale/75">{s.idealFor}</p>

              <details className="group mt-5 rounded-xl border border-gold/20 bg-noir-bg/30">
                <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 font-ui text-xs uppercase tracking-wide text-gold-pale [&::-webkit-details-marker]:hidden">
                  <span>Qué incluye</span>
                  <span aria-hidden="true" className="text-lg leading-none text-gold transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <ul className="space-y-2.5 px-4 pb-4 font-body text-base leading-relaxed text-gold-pale/85">
                  {s.includes.map((item) => (
                    <li key={item} className="flex gap-2.5">
                      <span aria-hidden="true" className="mt-1 text-gold">
                        ✦
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </details>

              <div className="mt-auto pt-6">
                <button
                  type="button"
                  onClick={() => choose(s.key)}
                  aria-pressed={active}
                  className="focus-ring w-full rounded-full bg-gold px-6 py-3 text-center font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright"
                >
                  {active ? "Elegida · completa tus datos ↓" : s.cta}
                </button>
                <p className="mt-3 text-center font-ui text-xs text-gold-dim">
                  Entrega por correo en un plazo de {READING_DELIVERY_WINDOW} desde la confirmación del pago
                </p>
              </div>
            </article>
          );
        })}
      </div>

      {/* Formulario del pedido */}
      <div id="pedido" ref={formRef} className="scroll-mt-28 pt-12">
        {paymentCancelled && (
          <div className="mb-6 rounded-xl border border-gold/30 bg-gold/10 px-5 py-4 font-ui text-sm text-gold-pale" role="status">
            El pago no se completó y no se te cobró nada. Si quieres, puedes intentarlo otra vez desde acá.
          </div>
        )}

        {!service ? (
          <div className="rounded-3xl border border-dashed border-gold/30 px-6 py-10 text-center">
            <p className="font-display text-xl text-gold-pale">Elige tu lectura para comenzar</p>
            <p className="mx-auto mt-2 max-w-md font-body text-lg text-gold-pale/80">
              Toca «{services[0]?.cta}» o «{services[1]?.cta}» y completa tus datos de nacimiento.
            </p>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="mx-auto max-w-3xl space-y-6 rounded-3xl border border-gold/30 bg-noir-surface/50 p-6 sm:p-10"
          >
            <header>
              <p className="font-ui text-xs uppercase tracking-widest2 text-gold-dim">Tu pedido</p>
              <h3 className="mt-1 font-display text-2xl text-gold-pale">{service.name}</h3>
              <p className="mt-2 font-body text-lg text-gold-pale/80">
                Con estos datos calculo y escribo tu lectura. Mientras más exactos, más precisa será.
              </p>
            </header>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="lec-name" className={labelClass}>
                  Nombre
                </label>
                <input
                  id="lec-name"
                  type="text"
                  required
                  autoComplete="name"
                  maxLength={80}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  placeholder="Cómo quieres que te llame"
                />
              </div>
              <div>
                <label htmlFor="lec-email" className={labelClass}>
                  Correo electrónico
                </label>
                <input
                  id="lec-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="tu@email.com"
                />
                <p className="mt-1 font-ui text-xs text-gold-dim">Aquí recibirás tu lectura en PDF.</p>
              </div>
            </div>

            <fieldset className="space-y-5 rounded-2xl border border-gold/20 p-5">
              <legend className="px-2 font-ui text-xs uppercase tracking-wide text-gold">Datos de nacimiento</legend>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="lec-date" className={labelClass}>
                    Fecha de nacimiento
                  </label>
                  <input
                    id="lec-date"
                    type="date"
                    required
                    min="1900-01-01"
                    max={todayIso}
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="lec-place" className={labelClass}>
                    Lugar de nacimiento
                  </label>
                  <input
                    id="lec-place"
                    type="text"
                    required
                    maxLength={100}
                    value={birthPlace}
                    onChange={(e) => setBirthPlace(e.target.value)}
                    className={inputClass}
                    placeholder="Ciudad y país, p. ej. Rosario, Argentina"
                  />
                </div>
              </div>

              <div>
                <span className={labelClass}>Hora de nacimiento</span>
                <div className="mt-1 grid gap-2 sm:grid-cols-3">
                  {BIRTH_TIME_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`cursor-pointer rounded-xl border px-4 py-3 transition ${
                        timeMode === opt.value ? "border-gold bg-gold/10" : "border-gold/30 hover:border-gold/60"
                      }`}
                    >
                      <input
                        type="radio"
                        name="lec-time-mode"
                        value={opt.value}
                        checked={timeMode === opt.value}
                        onChange={() => setTimeMode(opt.value)}
                        className="sr-only"
                      />
                      <span className="block font-ui text-sm font-medium text-gold-pale">{opt.label}</span>
                      <span className="mt-0.5 block font-ui text-xs leading-snug text-gold-dim">{opt.hint}</span>
                    </label>
                  ))}
                </div>
                {timeMode !== "unknown" && (
                  <div className="mt-3 max-w-[12rem]">
                    <label htmlFor="lec-time" className={labelClass}>
                      Hora (24 h)
                    </label>
                    <input
                      id="lec-time"
                      type="time"
                      required
                      value={birthTime}
                      onChange={(e) => setBirthTime(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                )}
                {timeMode === "unknown" && (
                  <p className="mt-3 font-ui text-xs leading-relaxed text-gold-dim">
                    Sin la hora no se puede calcular el Ascendente ni las casas. La lectura se centrará en planetas, signos y
                    aspectos, que siguen diciendo mucho de ti.
                  </p>
                )}
              </div>
            </fieldset>

            {service.key === "revolucion-solar" && (
              <fieldset className="space-y-5 rounded-2xl border border-gold/20 p-5">
                <legend className="px-2 font-ui text-xs uppercase tracking-wide text-gold">Tu revolución solar</legend>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="lec-year" className={labelClass}>
                      Año que quieres leer
                    </label>
                    <select
                      id="lec-year"
                      value={solarYear}
                      onChange={(e) => setSolarYear(Number(e.target.value))}
                      className={inputClass}
                    >
                      {[currentYear, currentYear + 1].map((y) => (
                        <option key={y} value={y} className="bg-day-surface text-day-ink">
                          Tu cumpleaños de {y}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="lec-solar-place" className={labelClass}>
                      Dónde estarás ese día
                    </label>
                    <input
                      id="lec-solar-place"
                      type="text"
                      required
                      maxLength={100}
                      value={solarPlace}
                      onChange={(e) => setSolarPlace(e.target.value)}
                      className={inputClass}
                      placeholder="Ciudad y país"
                    />
                  </div>
                </div>
                <p className="font-ui text-xs leading-relaxed text-gold-dim">
                  La revolución solar se calcula para el lugar donde estés en tu cumpleaños, no donde naciste. Si aún no lo
                  sabes, indica donde vives.
                </p>
              </fieldset>
            )}

            <div>
              <label htmlFor="lec-focus" className={labelClass}>
                ¿Qué te gustaría profundizar?
              </label>
              <select id="lec-focus" value={focus} onChange={(e) => setFocus(e.target.value)} className={inputClass}>
                {READING_FOCUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="bg-day-surface text-day-ink">
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="lec-about" className={labelClass}>
                Cuéntame sobre ti <span className="normal-case text-gold-dim">(opcional)</span>
              </label>
              <textarea
                id="lec-about"
                rows={5}
                maxLength={ABOUT_MAX}
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                className={inputClass}
                placeholder="Qué momento estás viviendo, qué preguntas traes, qué te gustaría que mire con atención…"
              />
              <p className="mt-1 text-right font-ui text-xs text-gold-dim">
                {about.length}/{ABOUT_MAX}
              </p>
            </div>

            {/* Trampa para bots: oculto para las personas */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label>
                No completar este campo
                <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
              </label>
            </div>

            <label className="flex cursor-pointer items-start gap-3 font-ui text-sm leading-relaxed text-gold-pale/85">
              <input
                type="checkbox"
                required
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="focus-ring mt-1 h-4 w-4 shrink-0 accent-[#C9A24B]"
              />
              <span>
                Acepto los{" "}
                <Link href="/terminos" target="_blank" className="text-gold underline hover:text-gold-bright">
                  términos y condiciones
                </Link>{" "}
                y que usen mis datos de nacimiento para elaborar mi lectura (más en la{" "}
                <Link href="/privacidad" target="_blank" className="text-gold underline hover:text-gold-bright">
                  política de privacidad
                </Link>
                ).
              </span>
            </label>

            {error && (
              <p role="alert" className="rounded-xl border border-wine-bright/40 bg-wine/10 px-4 py-3 font-ui text-sm text-wine-bright">
                {error}
              </p>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="focus-ring w-full rounded-full bg-gold px-6 py-4 text-center font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright disabled:opacity-60"
              >
                {loading ? "Preparando tu pago…" : `Pagar · ${formatUsd(service.priceUsd)}`}
              </button>
              <p className="mt-3 text-center font-ui text-xs leading-relaxed text-gold-dim">
                {service.priceArs ? (
                  <>
                    Mercado Pago cobra en pesos: pagarás aproximadamente <strong className="text-gold-pale">{formatArs(service.priceArs)}</strong>
                    {rateLabel ? ` (${rateLabel})` : ""}. El monto final se fija al continuar.
                  </>
                ) : (
                  <>Mercado Pago cobra en pesos argentinos; verás el monto exacto antes de pagar.</>
                )}{" "}
                Recibirás tu lectura en PDF por correo en un plazo de {READING_DELIVERY_WINDOW} desde la confirmación del pago.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
