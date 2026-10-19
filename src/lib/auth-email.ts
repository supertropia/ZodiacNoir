// Envío del correo con el enlace para ingresar (sin contraseña), usando Resend.
// El remitente sale de AUTH_EMAIL_FROM; si no existe, de NEWSLETTER_FROM (el mismo que ya
// usan el boletín y los PDFs), y como último recurso del subdominio verificado en Resend.

const FALLBACK_FROM = "Zodiac Noir <hello@mail.zodiacnoirweb.com>";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendLoginEmail(to: string, url: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("Falta la variable de entorno RESEND_API_KEY");
  }

  const from = process.env.AUTH_EMAIL_FROM || process.env.NEWSLETTER_FROM || FALLBACK_FROM;
  const safeUrl = escapeHtml(url);

  const html = `
    <div style="font-family:Georgia,'Times New Roman',serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#2a1f4d;">
      <p style="font-size:12px;letter-spacing:4px;text-transform:uppercase;color:#8a6d1f;margin:0 0 16px;">Zodiac Noir</p>
      <h1 style="font-size:24px;margin:0 0 16px;">Tu enlace para ingresar</h1>
      <p style="font-size:16px;line-height:1.6;margin:0 0 24px;">
        Tocá el botón para ingresar a tu cuenta. El enlace sirve una sola vez y vence en 15 minutos.
      </p>
      <p style="margin:0 0 24px;">
        <a href="${safeUrl}" style="display:inline-block;background:#c09a37;color:#1a1033;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;padding:14px 28px;border-radius:999px;">Ingresar a Zodiac Noir</a>
      </p>
      <p style="font-size:13px;line-height:1.6;color:#6b6489;margin:0 0 8px;">
        Si el botón no funciona, copiá y pegá este enlace en tu navegador:
      </p>
      <p style="font-size:12px;line-height:1.5;color:#6b6489;word-break:break-all;margin:0 0 24px;">${safeUrl}</p>
      <p style="font-size:13px;line-height:1.6;color:#6b6489;margin:0;">
        Si no pediste este correo, podés ignorarlo: nadie va a ingresar a tu cuenta sin este enlace.
      </p>
    </div>
  `;

  const text = `Tu enlace para ingresar a Zodiac Noir:\n\n${url}\n\nSirve una sola vez y vence en 15 minutos.\nSi no pediste este correo, podés ignorarlo.`;

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from,
    to,
    subject: "Tu enlace para ingresar a Zodiac Noir",
    html,
    text,
  });

  if (error) {
    console.error("Resend no pudo enviar el enlace de ingreso:", error);
    throw new Error("No se pudo enviar el correo de ingreso.");
  }
}
