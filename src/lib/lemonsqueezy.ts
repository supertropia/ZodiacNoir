import crypto from "crypto";

/**
 * Arma la URL de checkout de Lemon Squeezy para una variante (producto o plan de membresía).
 * No requiere llamar a la API: Lemon Squeezy soporta "checkout links" simples por URL.
 * Necesitás la variable de entorno LEMONSQUEEZY_STORE (el subdominio de tu tienda, ej. "zodiacnoir").
 */
export function buildCheckoutUrl(variantId: string | null | undefined, opts?: { email?: string; redirectPath?: string }) {
  const store = process.env.LEMONSQUEEZY_STORE;
  if (!store || !variantId) return null;

  const url = new URL(`https://${store}.lemonsqueezy.com/checkout/buy/${variantId}`);
  url.searchParams.set("embed", "0");
  if (opts?.email) url.searchParams.set("checkout[email]", opts.email);
  if (opts?.redirectPath) {
    const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
    url.searchParams.set("checkout[redirect_url]", `${base}${opts.redirectPath}`);
  }
  return url.toString();
}

/**
 * Verifica que el webhook realmente venga de Lemon Squeezy comparando la firma HMAC-SHA256
 * enviada en el header "X-Signature" contra el cuerpo crudo de la petición.
 * Requiere la variable de entorno LEMONSQUEEZY_WEBHOOK_SECRET (configurada también en el
 * panel de Lemon Squeezy al crear el webhook).
 */
export function verifyLemonSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;

  const digest = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(digest, "utf8");
  const b = Buffer.from(signatureHeader, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
