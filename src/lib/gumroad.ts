export type GumroadVerifyResult = {
  valid: boolean;
  cancelled: boolean;
  raw?: unknown;
  error?: string;
};

/**
 * Verifica una clave de licencia de Gumroad contra el producto de membresía configurado.
 * API pública y gratuita de Gumroad: https://app.gumroad.com/api#verify-a-license
 * No requiere token de acceso, solo el "permalink" del producto (se ve en la URL del producto).
 */
export async function verifyGumroadLicense(licenseKey: string): Promise<GumroadVerifyResult> {
  const productPermalink = process.env.GUMROAD_PRODUCT_PERMALINK;

  if (!productPermalink) {
    return { valid: false, error: "GUMROAD_PRODUCT_PERMALINK no está configurado." };
  }

  try {
    const res = await fetch("https://api.gumroad.com/v2/licenses/verify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        product_permalink: productPermalink,
        license_key: licenseKey.trim(),
      }),
    });

    const data = await res.json();

    if (!data.success) {
      return { valid: false, error: "Clave de licencia inválida.", raw: data };
    }

    const purchase = data.purchase ?? {};
    const cancelled = Boolean(
      purchase.subscription_cancelled_at || purchase.subscription_ended_at || purchase.subscription_failed_at
    );

    return { valid: !cancelled, cancelled, raw: data };
  } catch {
    return { valid: false, error: "No se pudo contactar a Gumroad. Probá de nuevo en un momento." };
  }
}
