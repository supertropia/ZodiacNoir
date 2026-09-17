// Integración con Mercado Pago — Checkout Pro (Preferencias, pago único) y
// Suscripciones (Preapproval, pago recurrente).
// Documentación:
// https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/overview
// https://www.mercadopago.com.ar/developers/es/docs/subscriptions/integration-configuration/subscription-no-associated-plan/pending-payments

const MP_API_BASE = "https://api.mercadopago.com";

function getAccessToken(): string {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error("Falta la variable de entorno MERCADOPAGO_ACCESS_TOKEN");
  return token;
}

function getSiteUrl(): string {
  return process.env.NEXTAUTH_URL || "https://zodiacnoirweb.com";
}

type CreatePreferenceParams = {
  productId: string;
  title: string;
  priceArs: number;
  buyerEmail?: string | null;
};

/**
 * Crea una preferencia de pago en Mercado Pago y devuelve la URL de checkout
 * (init_point) a la que hay que redirigir al comprador.
 */
export async function createPreference({
  productId,
  title,
  priceArs,
  buyerEmail,
}: CreatePreferenceParams): Promise<{ id: string; initPoint: string }> {
  const siteUrl = getSiteUrl();

  const body: Record<string, unknown> = {
    items: [
      {
        id: productId,
        title,
        quantity: 1,
        currency_id: "ARS",
        unit_price: priceArs,
      },
    ],
    external_reference: productId,
    back_urls: {
      success: `${siteUrl}/tienda?compra=1`,
      pending: `${siteUrl}/tienda?compra=pendiente`,
      failure: `${siteUrl}/tienda?compra=error`,
    },
    auto_return: "approved",
    notification_url: `${siteUrl}/api/mercadopago/webhook`,
  };

  if (buyerEmail) {
    body.payer = { email: buyerEmail };
  }

  const res = await fetch(`${MP_API_BASE}/checkout/preferences`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAccessToken()}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Error creando preferencia de Mercado Pago:", res.status, errorText);
    throw new Error("No se pudo crear la preferencia de pago en Mercado Pago.");
  }

  const data = await res.json();
  return { id: data.id, initPoint: data.init_point };
}

export type MercadoPagoPayment = {
  id: number;
  status: string; // approved | pending | rejected | refunded | cancelled | in_process
  external_reference: string | null;
  payer?: { email?: string | null };
};

/**
 * Consulta el estado real de un pago directamente contra la API de Mercado Pago,
 * usando nuestro propio Access Token. No confiamos en los datos que llegan en el
 * webhook: los usamos solo para saber QUÉ pago consultar, no para decidir si es válido.
 */
export async function getPayment(paymentId: string): Promise<MercadoPagoPayment> {
  const res = await fetch(`${MP_API_BASE}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Error consultando pago de Mercado Pago:", res.status, errorText);
    throw new Error("No se pudo consultar el pago en Mercado Pago.");
  }

  return res.json();
}

type CreateSubscriptionParams = {
  planId: string;
  reason: string;
  priceArs: number;
  /** 1 = mensual, 12 = anual (siempre medido en meses). */
  frequency: number;
  payerEmail: string;
};

/**
 * Da de alta una suscripción "sin plan asociado" (preapproval) en Mercado Pago y
 * devuelve la URL de checkout (init_point) donde el suscriptor carga su tarjeta.
 * El estado queda en "pending" hasta que la persona completa ese checkout — recién
 * ahí Mercado Pago manda el webhook de subscription_preapproval con status "authorized".
 */
export async function createSubscription({
  planId,
  reason,
  priceArs,
  frequency,
  payerEmail,
}: CreateSubscriptionParams): Promise<{ id: string; initPoint: string }> {
  const siteUrl = getSiteUrl();

  const body = {
    reason,
    external_reference: planId,
    payer_email: payerEmail,
    back_url: `${siteUrl}/membresia?bienvenido=1`,
    auto_recurring: {
      frequency,
      frequency_type: "months",
      transaction_amount: priceArs,
      currency_id: "ARS",
    },
    status: "pending",
  };

  const res = await fetch(`${MP_API_BASE}/preapproval`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAccessToken()}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Error creando suscripción de Mercado Pago:", res.status, errorText);
    throw new Error("No se pudo iniciar la suscripción en Mercado Pago.");
  }

  const data = await res.json();
  return { id: data.id, initPoint: data.init_point };
}

export type MercadoPagoPreapproval = {
  id: string;
  status: string; // pending | authorized | paused | cancelled
  payer_email?: string | null;
  external_reference?: string | null;
  next_payment_date?: string | null;
};

/**
 * Consulta el estado real de una suscripción directamente contra la API de Mercado
 * Pago, igual que getPayment(): el webhook solo nos dice QUÉ suscripción mirar.
 */
export async function getPreapproval(preapprovalId: string): Promise<MercadoPagoPreapproval> {
  const res = await fetch(`${MP_API_BASE}/preapproval/${preapprovalId}`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Error consultando suscripción de Mercado Pago:", res.status, errorText);
    throw new Error("No se pudo consultar la suscripción en Mercado Pago.");
  }

  return res.json();
}
