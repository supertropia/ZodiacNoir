import { getSalesData, summarizeSales, providerLabel, KIND_LABELS, type SaleTone } from "@/lib/sales";
import { formatArgentinaDateTime } from "@/lib/lecturas";

export const metadata = { title: "Ventas · Panel" };
export const dynamic = "force-dynamic";

const MAX_ROWS = 100;

const TONE_CLASS: Record<SaleTone, string> = {
  ok: "border-green-800/50 bg-green-900/20 text-green-300",
  warn: "border-gold/40 bg-gold/10 text-gold-pale",
  off: "border-gold/20 text-gold-dim",
};

function usd(amount: number): string {
  return `USD ${amount.toLocaleString("es-AR", { maximumFractionDigits: 2 })}`;
}

function shortDate(date: Date): string {
  return date.toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", day: "2-digit", month: "2-digit", year: "numeric" });
}

export default async function AdminSalesPage() {
  const { rows, pendingMemberships, failed } = await getSalesData();
  const summary = summarizeSales(rows);
  const shown = rows.slice(0, MAX_ROWS);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl text-gold-pale">Ventas</h1>
        <p className="mt-2 max-w-2xl font-body text-lg text-gold-pale/85">
          Todas las compras de productos, las membresías y las lecturas, con PayPal y Mercado Pago juntos.
        </p>
      </div>

      {failed && (
        <div role="alert" className="rounded-lg border border-wine/50 bg-wine/10 px-4 py-3 font-ui text-sm text-wine-bright">
          No se pudieron leer las ventas en este momento. Actualiza la página en unos minutos.
        </div>
      )}

      {/* Totales por período */}
      <section aria-label="Totales" className="grid gap-4 sm:grid-cols-3">
        {summary.periods.map((p) => (
          <div key={p.label} className="min-w-0 rounded-xl border border-gold/25 bg-noir-surface/40 p-5">
            <p className="font-ui text-xs uppercase tracking-wide text-gold-dim">{p.label}</p>
            <p className="mt-2 font-display text-3xl text-gold">
              {p.count.toLocaleString("es-AR")} {p.count === 1 ? "venta" : "ventas"}
            </p>
            <p className="mt-1 font-ui text-sm text-gold-pale/85">≈ {usd(p.usd)}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Por mes */}
        <section aria-labelledby="ventas-mes" className="min-w-0">
          <h2 id="ventas-mes" className="font-display text-xl text-gold-pale">Por mes</h2>
          <div className="mt-3 overflow-x-auto rounded-xl border border-gold/25">
            <table className="w-full min-w-[18rem] text-left font-ui text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-gold-dim">
                  <th className="px-4 py-2 font-medium">Mes</th>
                  <th className="px-4 py-2 text-right font-medium">Ventas</th>
                  <th className="px-4 py-2 text-right font-medium">Monto aprox.</th>
                </tr>
              </thead>
              <tbody>
                {summary.months.map((m) => (
                  <tr key={m.key} className="border-t border-gold/15 text-gold-pale">
                    <td className="px-4 py-2 capitalize">{m.label}</td>
                    <td className="px-4 py-2 text-right">{m.count}</td>
                    <td className="px-4 py-2 text-right">{usd(m.usd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Por medio de pago */}
        <section aria-labelledby="ventas-medio" className="min-w-0">
          <h2 id="ventas-medio" className="font-display text-xl text-gold-pale">Por medio de pago</h2>
          <div className="mt-3 rounded-xl border border-gold/25 p-4 font-ui text-sm text-gold-pale">
            {summary.providers.length === 0 ? (
              <p className="text-gold-dim">Todavía no hay ventas.</p>
            ) : (
              <ul className="space-y-2">
                {summary.providers.map((p) => (
                  <li key={p.provider} className="flex items-center justify-between gap-4">
                    <span>{providerLabel(p.provider)}</span>
                    <span className="text-gold">{p.count} {p.count === 1 ? "venta" : "ventas"}</span>
                  </li>
                ))}
              </ul>
            )}
            {summary.refunded > 0 && (
              <p className="mt-4 border-t border-gold/15 pt-3 text-xs text-gold-dim">
                Devueltas: {summary.refunded} (no se cuentan en los totales).
              </p>
            )}
            {pendingMemberships > 0 && (
              <p className="mt-2 text-xs text-gold-dim">
                Membresías iniciadas sin confirmar: {pendingMemberships} (no son ventas todavía).
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Lista */}
      <section aria-labelledby="ventas-lista">
        <h2 id="ventas-lista" className="font-display text-xl text-gold-pale">Últimas ventas</h2>
        {shown.length === 0 ? (
          <p className="mt-3 rounded-xl border border-gold/25 p-5 font-ui text-sm text-gold-dim">
            Todavía no hay ventas registradas. Cuando entre la primera compra, aparecerá aquí.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-gold/25">
            <table className="w-full min-w-[44rem] text-left font-ui text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-gold-dim">
                  <th className="px-4 py-2 font-medium">Fecha</th>
                  <th className="px-4 py-2 font-medium">Qué</th>
                  <th className="px-4 py-2 font-medium">Comprador</th>
                  <th className="px-4 py-2 font-medium">Medio</th>
                  <th className="px-4 py-2 text-right font-medium">Monto aprox.</th>
                  <th className="px-4 py-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id} className="border-t border-gold/15 align-top text-gold-pale">
                    <td className="whitespace-nowrap px-4 py-2" title={formatArgentinaDateTime(r.date)}>{shortDate(r.date)}</td>
                    <td className="px-4 py-2">
                      <span className="text-xs uppercase tracking-wide text-gold-dim">{KIND_LABELS[r.kind]}</span>
                      <br />
                      {r.item}
                    </td>
                    <td className="break-all px-4 py-2">{r.email}</td>
                    <td className="whitespace-nowrap px-4 py-2">{providerLabel(r.provider)}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-right">{r.amountUsd == null ? "—" : usd(r.amountUsd)}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs ${TONE_CLASS[r.tone]}`}>{r.stateLabel}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {rows.length > MAX_ROWS && (
          <p className="mt-2 font-ui text-xs text-gold-dim">Se muestran las últimas {MAX_ROWS} de {rows.length}. Los totales incluyen todas.</p>
        )}
      </section>

      <p className="max-w-3xl font-ui text-xs leading-relaxed text-gold-dim">
        Cómo leer los montos: en productos y membresías se usa el precio en dólares publicado hoy (el sitio no guarda el monto
        exacto cobrado, y Mercado Pago cobra en pesos). En las lecturas es el monto real. Los totales cuentan compras pagadas,
        membresías activas y lecturas pagadas o entregadas, y no incluyen devoluciones. Una membresía cuenta una vez, cuando se
        activa; las renovaciones no suman. Para el dinero real, mira la Actividad de PayPal y de Mercado Pago.
      </p>
    </div>
  );
}
