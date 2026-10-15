import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { hasActiveMembership } from "@/lib/membership";
import { sortedEvents, eventTime, formatEventDateShort, formatEventTime } from "@/data/events";

export const metadata: Metadata = {
  title: "Efemérides",
  description: "Calendario de lunaciones, eclipses y retrogradaciones planetarias.",
  alternates: { canonical: "/efemerides" },
};

// La página depende de la hora actual y de la sesión, así que se genera en cada visita.
export const dynamic = "force-dynamic";

// Cuántos eventos futuros se muestran completos a quien no es miembro (los más próximos).
const FREE_UPCOMING = 2;
// Cuántas filas difuminadas se dibujan como vista previa del contenido bloqueado.
const PREVIEW_ROWS = 6;

const TYPE_LABEL: Record<string, string> = {
  "eclipse-solar": "Eclipse solar",
  "eclipse-lunar": "Eclipse lunar",
  "luna-nueva": "Luna nueva",
  "luna-llena": "Luna llena",
  "retrogrado-inicio": "Inicia retrogradación",
  "retrogrado-fin": "Termina retrogradación",
  aspecto: "Aspecto planetario",
  estacion: "Punto cardinal",
};

async function canSeeAll(email?: string | null): Promise<boolean> {
  if (!email) return false;
  if (isAdminEmail(email) || email.toLowerCase() === "zodiac.noir1@gmail.com") return true;
  try {
    return await hasActiveMembership(email);
  } catch {
    return false;
  }
}

export default async function EphemerisPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  const isMember = await canSeeAll(email);

  const events = sortedEvents();
  const now = Date.now();
  const firstUpcoming = events.findIndex((e) => eventTime(e) >= now);
  // Se ve todo lo pasado y los dos eventos más próximos; el resto es solo para miembros.
  const lastFree = firstUpcoming === -1 ? events.length - 1 : firstUpcoming + FREE_UPCOMING - 1;
  const visible = isMember ? events : events.slice(0, lastFree + 1);
  const lockedCount = isMember ? 0 : events.length - visible.length;

  return (
    <section className="mx-auto max-w-4xl px-5 py-16">
      <p className="font-ui text-xs uppercase tracking-widest2 text-gold-dim">Calendario</p>
      <h1 className="mt-3 font-display text-4xl text-gold-pale">Efemérides</h1>
      <p className="mt-4 max-w-2xl font-body text-lg text-gold-pale/80">
        Lunaciones, eclipses y estaciones planetarias verificados contra efemérides astronómicas
        públicas. Todas las fechas y horas están en UTC (Argentina: UTC−3, es decir, 3 horas menos).
      </p>

      <ol className="mt-12 space-y-0">
        {visible.map((e, i) => (
          <li key={i} className="flex gap-6 border-l border-gold/20 py-5 pl-6">
            <div className="w-28 shrink-0 font-ui text-xs uppercase tracking-wide text-gold-dim">
              <div>{formatEventDateShort(e)}</div>
              <div className="mt-1 normal-case tracking-normal text-gold/80">{formatEventTime(e)}</div>
            </div>
            <div>
              <p className="font-ui text-xs uppercase tracking-wide text-gold">
                {TYPE_LABEL[e.type] ?? e.type}
                {e.sign ? ` · ${e.sign}` : ""}
              </p>
              <h3 className="mt-1 font-display text-lg text-gold-pale">{e.title}</h3>
              <p className="mt-1 font-body text-base text-gold-pale/75">{e.description}</p>
            </div>
          </li>
        ))}
      </ol>

      {lockedCount > 0 && (
        <div className="relative">
          {/* Filas de relleno generadas en el servidor: el contenido real nunca se envía al navegador. */}
          <ol aria-hidden="true" className="pointer-events-none select-none space-y-0 blur-sm">
            {Array.from({ length: PREVIEW_ROWS }).map((_, i) => (
              <li key={i} className="flex gap-6 border-l border-gold/20 py-5 pl-6">
                <div className="w-28 shrink-0 font-ui text-xs uppercase tracking-wide text-gold-dim">
                  <div>00 xxx 0000</div>
                  <div className="mt-1 normal-case tracking-normal text-gold/80">00:00 UTC</div>
                </div>
                <div>
                  <p className="font-ui text-xs uppercase tracking-wide text-gold">Evento · Signo</p>
                  <h3 className="mt-1 font-display text-lg text-gold-pale">Título del evento astrológico</h3>
                  <p className="mt-1 font-body text-base text-gold-pale/75">
                    Descripción del evento y lo que significa para cada signo durante este tránsito.
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-noir-bg/60 to-noir-bg" />

          <div className="absolute inset-x-0 top-6 flex justify-center px-2">
            <div className="rounded-2xl border border-gold/30 bg-noir-surface/90 p-7 text-center backdrop-blur">
              <p className="font-ui text-xs uppercase tracking-wide text-gold-dim">Contenido exclusivo</p>
              <h2 className="mt-2 font-display text-2xl text-gold-pale">
                {lockedCount} efemérides más, solo para miembros
              </h2>
              <p className="mx-auto mt-3 max-w-md font-body text-base text-gold-pale/80">
                Sumate a Zodiac Noir Plus para ver el calendario completo, hasta diciembre de 2027.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href="/membresia"
                  className="focus-ring rounded-full bg-gold px-6 py-3 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright"
                >
                  Hazte miembro
                </Link>
                {!email && (
                  <Link
                    href="/ingresar"
                    className="focus-ring rounded-full border border-gold/40 px-6 py-3 font-ui text-sm uppercase tracking-wide text-gold transition hover:bg-gold/10"
                  >
                    Ya soy miembro
                  </Link>
                )}
              </div>
            </div>
          </div>
          {/* Espacio para que la tarjeta no quede cortada al final de las filas difuminadas */}
          <div className="h-40" />
        </div>
      )}
    </section>
  );
}
