// Cobro de las lecturas con Mercado Pago (Checkout Pro, pago único en pesos).
// Es independiente de src/lib/mercadopago.ts (tienda de PDFs y membresías) para no tocarlo:
// usa el mismo MERCADOPAGO_ACCESS_TOKEN, pero sus avisos llegan a /api/lecturas/webhook.

const MP_API_BASE = "https://api.mercadopago.com";

function getAccessToken(): string {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error("Falta la variable de entorno MERCADOPAGO_ACCESS_TOKEN");
  return token;
}

export function getSiteUrl(): string {
  return process.env.NEXTAUTH_URL || "https://zodiacnoirweb.com";
}

// Tiempo que queda abierto el link de pago. Pasado ese tiempo la cotización del dólar que
// usamos ya no es reciente, así que se pide empezar de nuevo.
const PREFERENCE_VALID_HOURS = 3;

type CreateReadingPreferenceParams = {
  orderId: string;
  title: string;
  priceArs: number;
  payerEmail: string;
};

/**
 * Crea la preferencia de pago de un pedido y devuelve la URL de checkout (init_point).
 * La moneda es SIEMPRE ARS: Mercado Pago Argentina no convierte otras monedas.
 */
export async function createReadingPreference({
  orderId,
  title,
  priceArs,
  payerEmail,
}: CreateReadingPreferenceParams): Promise<{ id: string; initPoint: string }> {
  const siteUrl = getSiteUrl();

  const body: Record<string, unknown> = {
    items: [
      {
        id: orderId,
        title,
        quantity: 1,
        currency_id: "ARS",
        unit_price: priceArs,
      },
    ],
    external_reference: orderId,
    payer: { email: payerEmail },
    statement_descriptor: "ZODIAC NOIR",
    back_urls: {
      success: `${siteUrl}/lecturas/gracias?pedido=${orderId}`,
      pending: `${siteUrl}/lecturas/gracias?pedido=${orderId}&estado=pendiente`,
      failure: `${siteUrl}/lecturas?pago=error`,
    },
    auto_return: "approved",
    notification_url: `${siteUrl}/api/lecturas/webhook`,
  };

  const send = (payload: Record<string, unknown>) =>
    fetch(`${MP_API_BASE}/checkout/preferences`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAccessToken()}`,
      },
      body: JSON.stringify(payload),
    });

  // Primero con vencimiento del link. Si Mercado Pago lo rechazara por el formato de la fecha,
  // reintentamos sin él para que el pago nunca deje de funcionar.
  const now = Date.now();
  let res = await send({
    ...body,
    expires: true,
    expiration_date_from: new Date(now).toISOString().replace("Z", "+00:00"),
    expiration_date_to: new Date(now + PREFERENCE_VALID_HOURS * 3600 * 1000).toISOString().replace("Z", "+00:00"),
  });

  if (!res.ok) {
    console.error("Mercado Pago rechazó la preferencia con vencimiento, reintentando sin él:", res.status, await res.text());
    res = await send(body);
  }

  if (!res.ok) {
    console.error("Error creando preferencia de lectura en Mercado Pago:", res.status, await res.text());
    throw new Error("No se pudo crear el cobro en Mercado Pago.");
  }

  const data = await res.json();
  return { id: data.id, initPoint: data.init_point };
}

export type ReadingPayment = {
  id: number;
  status: string; // approved | pending | in_process | rejected | refunded | cancelled | charged_back
  external_reference: string | null;
  transaction_amount: number;
  currency_id: string;
  payer?: { email?: string | null };
};

/**
 * Consulta el pago directamente a Mercado Pago con nuestro propio Access Token.
 * El aviso (webhook) solo nos dice QUÉ pago mirar: no confiamos en su contenido.
 */
export async function getReadingPayment(paymentId: string): Promise<ReadingPayment> {
  const res = await fetch(`${MP_API_BASE}/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });

  if (!res.ok) {
    console.error("Error consultando pago de lectura en Mercado Pago:", res.status, await res.text());
    throw new Error("No se pudo consultar el pago en Mercado Pago.");
  }

  return res.json();
}
