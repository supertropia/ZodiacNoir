import { PaypalVisibilityToggle } from "@/components/admin/PaypalVisibilityToggle";
import { getPaypalEnabled } from "@/lib/site-settings";
import { isPaypalConfigured } from "@/lib/paypal";
import { getUsdArsQuote } from "@/lib/exchange-rate";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  const enabled = await getPaypalEnabled();
  const configured = isPaypalConfigured();
  const sandbox = process.env.PAYPAL_ENV === "sandbox";
  const quote = await getUsdArsQuote();

  const publicState = enabled && configured ? "visible" : "oculto";

  return (
    <div>
      <h1 className="font-display text-3xl text-gold-pale">Medios de pago</h1>
      <p className="mt-2 max-w-2xl font-body text-lg text-gold-pale/80">
        Mercado Pago cobra en pesos y PayPal en dólares. Los precios se publican siempre en dólares.
      </p>

      <section className="mt-8 rounded-2xl border border-gold/25 bg-noir-surface/40 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl text-gold-pale">PayPal</h2>
          <span
            className={`rounded-full border px-3 py-1 font-ui text-xs uppercase tracking-wide ${
              publicState === "visible" ? "border-green-400/50 text-green-300" : "border-gold/40 text-gold"
            }`}
          >
            Para el público: {publicState}
          </span>
        </div>

        <p className="mt-3 font-body text-base leading-relaxed text-gold-pale/85">
          Mientras PayPal esté oculto, <strong>solo tú</strong> ves el botón (con una etiqueta que lo aclara) en la tienda,
          la membresía y las lecturas, así puedes probar todo el recorrido. Cuando estés conforme, muéstralo al público
          con el botón de abajo.
        </p>

        <PaypalVisibilityToggle enabled={enabled} configured={configured} />

        <dl className="mt-6 space-y-2 border-t border-gold/15 pt-5 font-ui text-sm">
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-gold-dim">Credenciales en Vercel</dt>
            <dd className={configured ? "text-green-300" : "text-wine-bright"}>
              {configured ? "Cargadas" : "Faltan PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET"}
            </dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-gold-dim">Modo</dt>
            <dd className="text-gold-pale">{sandbox ? "Pruebas (sandbox): no se cobra dinero real" : "Real: se cobra dinero de verdad"}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 rounded-2xl border border-gold/25 bg-noir-surface/40 p-6">
        <h2 className="font-display text-xl text-gold-pale">Dólar para los cobros en pesos</h2>
        <p className="mt-3 font-body text-base leading-relaxed text-gold-pale/85">
          Con Mercado Pago, el precio en dólares se convierte a pesos al <strong>dólar blue</strong> del momento más un margen.
        </p>
        <p className="mt-3 font-ui text-sm text-gold-pale">
          {quote
            ? `Hoy: 1 USD = ARS ${Math.round(quote.rate).toLocaleString("es-AR")} (incluye el margen)`
            : "No se pudo obtener la cotización en este momento."}
        </p>
      </section>
    </div>
  );
}
