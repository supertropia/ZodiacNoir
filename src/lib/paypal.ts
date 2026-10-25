// Integración con PayPal (cobros en dólares).
//
// - Pagos únicos (PDFs de la tienda y lecturas): API de Órdenes v2. La persona aprueba el pago en
//   PayPal y vuelve a /api/paypal/return, donde el servidor "captura" (cobra) la orden y la verifica.
// - Membresía: API de Suscripciones. Se crea un plan de facturación en PayPal la primera vez y se
//   reutiliza; la persona aprueba la suscripción en PayPal y vuelve a /api/paypal/return.
//
// Variables de entorno (se cargan en Vercel, nunca en el código):
//   PAYPAL_CLIENT_ID      → "Client ID" de la app de PayPal
//   PAYPAL_CLIENT_SECRET  → "Secret" de la app de PayPal
//   PAYPAL_ENV            → "live" (cobros reales, es el valor por defecto) o "sandbox" (pruebas)
//
// Documentación: https://developer.paypal.com/docs/api/orders/v2/ y
// https://developer.paypal.com/docs/api/subscriptions/v1/

import { paypalAmount } from "@/lib/pricing";

const BRAND_NAME = "Zodiac Noir";

function getBase(): string {
  return process.env.PAYPAL_ENV === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
}

export function getSiteUrl(): string {
  return process.env.NEXTAUTH_URL || "https://zodiacnoirweb.com";
}

/** ¿Están cargadas las credenciales de PayPal en el servidor? */
export function isPaypalConfigured(): boolean {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (!isPaypalConfigured()) {
    throw new Error("Faltan las credenciales de PayPal (PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET).");
  }
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;

  const basic = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");
  const res = await fetch(`${getBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) {
    console.error("PayPal rechazó las credenciales:", res.status, await res.text());
    throw new Error("PayPal rechazó las credenciales. Revisa PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET y PAYPAL_ENV.");
  }
  const data = await res.json();
  cachedToken = { value: data.access_token, expiresAt: Date.now() + Number(data.expires_in ?? 300) * 1000 };
  return cachedToken.value;
}

export class PaypalApiError extends Error {
  status: number;
  body: any;
  constructor(message: string, status: number, body: any) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function paypalFetch<T = any>(path: string, init: { method?: string; body?: unknown; requestId?: string } = {}): Promise<T> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
  if (init.requestId) headers["PayPal-Request-Id"] = init.requestId;

  const res = await fetch(`${getBase()}${path}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (!res.ok) {
    console.error(`Error de PayPal en ${init.method ?? "GET"} ${path}:`, res.status, text);
    throw new PaypalApiError(`PayPal respondió con error ${res.status}`, res.status, json);
  }
  return json as T;
}

function findLink(links: any, ...rels: string[]): string | null {
  if (!Array.isArray(links)) return null;
  for (const rel of rels) {
    const link = links.find((l: any) => l?.rel === rel && typeof l?.href === "string");
    if (link) return link.href;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Pagos únicos (Órdenes v2)
// ---------------------------------------------------------------------------

export type PaypalOrder = {
  id: string;
  status: string; // CREATED | PAYER_ACTION_REQUIRED | APPROVED | COMPLETED | VOIDED
  payer?: { email_address?: string; name?: { given_name?: string; surname?: string } };
  purchase_units?: {
    custom_id?: string;
    reference_id?: string;
    amount?: { currency_code?: string; value?: string };
    payments?: {
      captures?: { id: string; status: string; amount?: { currency_code?: string; value?: string } }[];
    };
  }[];
};

/** Crea una orden de pago en dólares y devuelve la URL de PayPal a la que hay que enviar a la persona. */
export async function createPaypalOrder(params: {
  amountUsd: number;
  description: string;
  /** Texto que se guarda en la orden y se verifica al volver (por ejemplo "product:abc123"). */
  customId: string;
  returnUrl: string;
  cancelUrl: string;
  requestId?: string;
}): Promise<{ id: string; approveUrl: string }> {
  const order = await paypalFetch<PaypalOrder & { links?: unknown }>("/v2/checkout/orders", {
    method: "POST",
    requestId: params.requestId,
    body: {
      intent: "CAPTURE",
      purchase_units: [
        {
          custom_id: params.customId,
          description: params.description.slice(0, 120),
          soft_descriptor: "ZODIAC NOIR",
          amount: { currency_code: "USD", value: paypalAmount(params.amountUsd) },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: BRAND_NAME,
            user_action: "PAY_NOW",
            shipping_preference: "NO_SHIPPING",
            landing_page: "LOGIN",
            return_url: params.returnUrl,
            cancel_url: params.cancelUrl,
          },
        },
      },
    },
  });

  const approveUrl = findLink(order.links, "payer-action", "approve");
  if (!order.id || !approveUrl) throw new Error("PayPal no devolvió el enlace de pago.");
  return { id: order.id, approveUrl };
}

export async function getPaypalOrder(orderId: string): Promise<PaypalOrder> {
  return paypalFetch<PaypalOrder>(`/v2/checkout/orders/${encodeURIComponent(orderId)}`);
}

/**
 * Cobra una orden que la persona ya aprobó. Si ya estaba cobrada (por ejemplo, la persona volvió dos
 * veces a la página), devuelve la orden tal como está en vez de fallar.
 */
export async function capturePaypalOrder(orderId: string): Promise<PaypalOrder> {
  try {
    return await paypalFetch<PaypalOrder>(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
      method: "POST",
      body: {},
      requestId: `capture-${orderId}`,
    });
  } catch (error) {
    if (error instanceof PaypalApiError && error.status === 422) {
      const issue = JSON.stringify(error.body ?? {});
      if (issue.includes("ORDER_ALREADY_CAPTURED")) return getPaypalOrder(orderId);
    }
    throw error;
  }
}

/** Datos de la captura (cobro) de una orden, ya validados: estado COMPLETED y moneda USD. */
export function readCompletedCapture(order: PaypalOrder): { captureId: string; amountUsd: number; customId: string } | null {
  if (order.status !== "COMPLETED") return null;
  const unit = order.purchase_units?.[0];
  const capture = unit?.payments?.captures?.[0];
  if (!unit || !capture || capture.status !== "COMPLETED") return null;
  const amount = Number(capture.amount?.value);
  if (capture.amount?.currency_code !== "USD" || !Number.isFinite(amount)) return null;
  return { captureId: capture.id, amountUsd: amount, customId: unit.custom_id ?? "" };
}

/** Consulta una captura (cobro) para saber si fue devuelta, y a qué orden pertenece. */
export async function getPaypalCapture(captureId: string): Promise<{
  status: string;
  orderId: string | null;
}> {
  const data = await paypalFetch<any>(`/v2/payments/captures/${encodeURIComponent(captureId)}`);
  return {
    status: String(data?.status ?? ""),
    orderId: data?.supplementary_data?.related_ids?.order_id ?? null,
  };
}

// ---------------------------------------------------------------------------
// Suscripciones (membresía)
// ---------------------------------------------------------------------------

export type PaypalSubscription = {
  id: string;
  status: string; // APPROVAL_PENDING | APPROVED | ACTIVE | SUSPENDED | CANCELLED | EXPIRED
  plan_id?: string;
  custom_id?: string;
  subscriber?: { email_address?: string };
  billing_info?: { next_billing_time?: string };
};

/** Crea (una sola vez por precio) el producto y el plan de facturación de PayPal y devuelve el ID del plan. */
export async function createPaypalBillingPlan(params: {
  name: string;
  amountUsd: number;
  interval: "MONTH" | "YEAR";
}): Promise<string> {
  const product = await paypalFetch<{ id: string }>("/v1/catalogs/products", {
    method: "POST",
    body: { name: `${params.name} — ${BRAND_NAME}`.slice(0, 127), type: "SERVICE", category: "SOFTWARE" },
  });

  const plan = await paypalFetch<{ id: string }>("/v1/billing/plans", {
    method: "POST",
    body: {
      product_id: product.id,
      name: `${params.name} (${paypalAmount(params.amountUsd)} USD)`.slice(0, 127),
      status: "ACTIVE",
      billing_cycles: [
        {
          frequency: { interval_unit: params.interval, interval_count: 1 },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: { fixed_price: { value: paypalAmount(params.amountUsd), currency_code: "USD" } },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: "CANCEL",
        payment_failure_threshold: 3,
      },
    },
  });
  return plan.id;
}

/** Crea la suscripción y devuelve la URL de PayPal donde la persona la aprueba. */
export async function createPaypalSubscription(params: {
  planId: string;
  customId: string;
  payerEmail?: string | null;
  returnUrl: string;
  cancelUrl: string;
}): Promise<{ id: string; approveUrl: string }> {
  const sub = await paypalFetch<PaypalSubscription & { links?: unknown }>("/v1/billing/subscriptions", {
    method: "POST",
    body: {
      plan_id: params.planId,
      custom_id: params.customId,
      ...(params.payerEmail ? { subscriber: { email_address: params.payerEmail } } : {}),
      application_context: {
        brand_name: BRAND_NAME,
        shipping_preference: "NO_SHIPPING",
        user_action: "SUBSCRIBE_NOW",
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
      },
    },
  });
  const approveUrl = findLink(sub.links, "approve");
  if (!sub.id || !approveUrl) throw new Error("PayPal no devolvió el enlace de la suscripción.");
  return { id: sub.id, approveUrl };
}

export async function getPaypalSubscription(subscriptionId: string): Promise<PaypalSubscription> {
  return paypalFetch<PaypalSubscription>(`/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}`);
}

export async function cancelPaypalSubscription(subscriptionId: string): Promise<void> {
  await paypalFetch(`/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`, {
    method: "POST",
    body: { reason: "Cancelada por la persona suscriptora desde Zodiac Noir" },
  });
}

/** Pasa el estado de PayPal a los valores que ya usa la web ("active" habilita el acceso premium). */
export function mapPaypalSubscriptionStatus(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "active";
    case "SUSPENDED":
      return "paused";
    case "CANCELLED":
    case "EXPIRED":
      return "cancelled";
    default:
      return "pending"; // APPROVAL_PENDING | APPROVED
  }
}
