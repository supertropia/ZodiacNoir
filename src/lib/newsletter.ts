// Utilidades del boletín (newsletter): enlaces de baja, armado del correo y conversión de texto a HTML.
// El mismo diseño de correo se usa en las pruebas y en el envío real, así lo que ves es lo que llega.

import { CONTACT_EMAIL } from "@/lib/site";

const SITE_URL = (process.env.NEXTAUTH_URL || "https://zodiacnoirweb.com").replace(/\/$/, "");

export function getSiteUrl(): string {
  return SITE_URL;
}

/** Enlace personal para darse de baja (cada suscriptor tiene el suyo). */
export function unsubscribeUrl(token: string): string {
  return `${SITE_URL}/baja?token=${encodeURIComponent(token)}`;
}

/** Dirección de baja de un solo clic (la usan Gmail y Outlook en su botón "Cancelar suscripción"). */
export function oneClickUnsubscribeUrl(token: string): string {
  return `${SITE_URL}/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Convierte las direcciones web escritas en el texto en enlaces clicables.
function linkify(escaped: string): string {
  return escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" style="color:#8A733B;text-decoration:underline">$1</a>'
  );
}

/**
 * Convierte el texto escrito en el panel en HTML de correo.
 * - Una línea en blanco separa los párrafos.
 * - Una línea que empieza con "## " se convierte en subtítulo.
 * - Las direcciones web (https://...) se vuelven enlaces.
 */
export function textToEmailHtml(text: string): string {
  const blocks = text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  return blocks
    .map((block) => {
      if (block.startsWith("## ")) {
        const title = linkify(escapeHtml(block.slice(3).trim()));
        return `<h2 style="margin:28px 0 10px;font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:1.3;color:#2B2140">${title}</h2>`;
      }
      const html = linkify(escapeHtml(block)).replace(/\n/g, "<br>");
      return `<p style="margin:0 0 16px;font-size:17px;line-height:1.7;color:#2B2140">${html}</p>`;
    })
    .join("\n");
}

/** Versión en texto plano (para quienes leen el correo sin formato). */
export function textToPlain(text: string, token?: string): string {
  const base = text.replace(/\r\n/g, "\n").replace(/^## /gm, "").trim();
  if (!token) return base;
  return `${base}\n\n—\nZodiac Noir · ${SITE_URL}\nPara darte de baja del boletín: ${unsubscribeUrl(token)}`;
}

/** Arma el correo completo: encabezado de marca, contenido y pie con el enlace de baja. */
export function buildNewsletterHtml(bodyHtml: string, token: string | null): string {
  const footerUnsub = token
    ? `Recibes este correo porque te suscribiste al boletín de Zodiac Noir.<br>
       <a href="${unsubscribeUrl(token)}" style="color:#8A733B;text-decoration:underline">Darme de baja</a>`
    : `Este es un correo de prueba: el enlace de baja aparece en los envíos reales.`;

  return `<!doctype html>
<html lang="es">
<body style="margin:0;padding:0;background:#F6F1FA">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6F1FA;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:12px;overflow:hidden">
        <tr><td style="background:#1A1326;padding:24px;text-align:center">
          <a href="${SITE_URL}" style="font-family:Georgia,'Times New Roman',serif;font-size:22px;letter-spacing:4px;color:#E8D5A0;text-decoration:none">ZODIAC NOIR</a>
        </td></tr>
        <tr><td style="padding:32px 28px;font-family:Georgia,'Times New Roman',serif">
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:20px 28px;background:#FAF7FD;border-top:1px solid #E6DDF0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#6B5E80;text-align:center">
          ${footerUnsub}<br>
          <a href="${SITE_URL}" style="color:#6B5E80">zodiacnoirweb.com</a> · ${CONTACT_EMAIL}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
