// Correos de las lecturas (Resend): confirmación de pago para la persona, aviso para quien
// escribe la lectura, y entrega del PDF. Ninguna función lanza error: devuelven true/false
// para que un problema de correo nunca rompa el cobro ni la entrega.

import type { ReadingOrder } from "@prisma/client";
import {
  READING_DELIVERY_WINDOW,
  formatArgentinaDateTime,
  formatArs,
  formatBirthDate,
  formatUsd,
  getBirthTimeLabel,
  getFocusLabel,
  getReadingService,
} from "./lecturas";
import { getSiteUrl } from "./lecturas-mp";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fromAddress(): string {
  return process.env.NEWSLETTER_FROM || "Zodiac Noir <onboarding@resend.dev>";
}

function serviceName(order: ReadingOrder): string {
  return getReadingService(order.service)?.name ?? "Lectura personalizada";
}

function firstName(order: ReadingOrder): string {
  return order.name.split(" ")[0] || order.name;
}

/** Marco común de los correos: tarjeta blanca con filete dorado, en la estética del sitio. */
function layout(heading: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="es">
<body style="margin:0;padding:0;background:#F5F0FC;">
  <div style="max-width:560px;margin:0 auto;padding:28px 16px;">
    <div style="background:#FFFFFF;border-top:4px solid #C8961B;border-radius:6px;padding:32px 28px;font-family:Georgia,'Times New Roman',serif;color:#26183F;font-size:17px;line-height:1.6;">
      <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:3px;color:#8F6508;">ZODIAC NOIR</p>
      <h1 style="margin:0 0 18px;font-size:24px;line-height:1.3;font-weight:normal;">${heading}</h1>
      ${bodyHtml}
      <hr style="border:none;border-top:1px solid #E3D8F3;margin:28px 0 16px;">
      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#6A5C85;line-height:1.5;">
        Tu lectura es una herramienta de autoconocimiento y no reemplaza el consejo médico, psicológico, legal ni financiero.
      </p>
    </div>
  </div>
</body>
</html>`;
}

async function sendEmail(params: { to: string; subject: string; html: string; replyTo?: string }): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.log("Resend no está configurado; no se envió el correo:", params.subject, "->", params.to);
    return false;
  }
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: fromAddress(),
      to: params.to,
      subject: params.subject,
      html: params.html,
      ...(params.replyTo ? { replyTo: params.replyTo } : {}),
    });
    if (error) {
      console.error("Resend rechazó el correo:", params.subject, error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error enviando correo:", params.subject, error);
    return false;
  }
}

function detailsTable(order: ReadingOrder): string {
  const rows: [string, string][] = [
    ["Lectura", serviceName(order)],
    ["Nombre", order.name],
    ["Nacimiento", formatBirthDate(order.birthDate)],
    ["Hora", getBirthTimeLabel(order.birthTimeMode, order.birthTime)],
    ["Lugar", order.birthPlace],
  ];
  if (order.solarYear) rows.push(["Año a interpretar", String(order.solarYear)]);
  if (order.solarPlace) rows.push(["Lugar el día del cumpleaños", order.solarPlace]);
  rows.push(["Área de interés", getFocusLabel(order.focus)]);

  return `<table style="border-collapse:collapse;width:100%;font-family:Arial,Helvetica,sans-serif;font-size:14px;">
${rows
  .map(
    ([label, value]) =>
      `<tr><td style="padding:6px 12px 6px 0;color:#6A5C85;vertical-align:top;white-space:nowrap;">${escapeHtml(label)}</td><td style="padding:6px 0;color:#26183F;">${escapeHtml(value)}</td></tr>`
  )
  .join("\n")}
</table>`;
}

/**
 * Pago confirmado: correo a la persona (con el plazo de entrega y los datos que cargó, para que
 * pueda avisar si hay un error) y aviso a CONTACT_TO_EMAIL con todo lo necesario para escribir la lectura.
 */
export async function sendReadingPaidEmails(order: ReadingOrder): Promise<void> {
  const siteUrl = getSiteUrl();
  const contactEmail = process.env.CONTACT_TO_EMAIL;
  const deadline = order.deliverBy ? formatArgentinaDateTime(order.deliverBy) : null;

  await sendEmail({
    to: order.email,
    replyTo: contactEmail || undefined,
    subject: `Recibimos tu pago: tu ${serviceName(order).toLowerCase()} llega en un plazo de ${READING_DELIVERY_WINDOW}`,
    html: layout(
      `Gracias, ${escapeHtml(firstName(order))}. Ya estamos con tu lectura`,
      `<p>Confirmamos tu pedido de <strong>${escapeHtml(serviceName(order))}</strong>. La estamos preparando y te llegará a este mismo correo${
        deadline ? `, a más tardar el <strong>${escapeHtml(deadline)}</strong> (hora de Argentina)` : ""
      }.</p>
      <p>Estos son los datos que cargaste. Si ves algún error, responde este correo cuanto antes y lo corregimos:</p>
      ${detailsTable(order)}
      <p style="margin-top:20px;">También puedes seguir tu pedido en <a href="${siteUrl}/mi-cuenta" style="color:#5B34B0;">Mi cuenta</a>.</p>`
    ),
  });

  if (contactEmail) {
    await sendEmail({
      to: contactEmail,
      subject: `Nueva lectura para entregar: ${serviceName(order)} — ${order.name}`,
      html: layout(
        "Hay una lectura nueva para entregar",
        `<p>Plazo prometido a la clienta: <strong>${READING_DELIVERY_WINDOW}</strong> desde la confirmación del pago.${
          deadline ? ` Fecha límite de entrega: <strong>${escapeHtml(deadline)}</strong> (hora de Argentina).` : ""
        }</p>
        ${detailsTable(order)}
        ${
          order.about
            ? `<p style="margin-top:16px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#6A5C85;">Lo que contó sobre sí:</p>
               <p style="margin:0;white-space:pre-wrap;">${escapeHtml(order.about)}</p>`
            : ""
        }
        <p style="margin-top:20px;font-family:Arial,Helvetica,sans-serif;font-size:13px;">Correo: ${escapeHtml(order.email)} · Cobrado: ${escapeHtml(formatArs(order.priceArs))} (${escapeHtml(formatUsd(order.priceUsd))} a ${order.exchangeRate.toLocaleString("es-AR")} ARS por USD)</p>
        <p><a href="${siteUrl}/admin/lecturas" style="color:#5B34B0;">Abrir el panel de lecturas</a></p>`
      ),
    });
  }
}

/** Entrega del PDF a la persona. Devuelve true si el correo salió. */
export async function sendReadingDeliveredEmail(order: ReadingOrder): Promise<boolean> {
  if (!order.fileUrl) return false;
  const siteUrl = getSiteUrl();

  return sendEmail({
    to: order.email,
    replyTo: process.env.CONTACT_TO_EMAIL || undefined,
    subject: `Tu ${serviceName(order).toLowerCase()} está lista`,
    html: layout(
      `${escapeHtml(firstName(order))}, tu lectura está lista`,
      `<p>Aquí tienes tu <strong>${escapeHtml(serviceName(order))}</strong> en PDF. Tómate un momento tranquilo para leerla; las lecturas simbólicas se disfrutan mejor sin prisa.</p>
      <p style="margin:24px 0;">
        <a href="${escapeHtml(order.fileUrl)}" style="background:#C8961B;color:#1E1233;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;padding:13px 26px;border-radius:999px;display:inline-block;">Descargar mi lectura</a>
      </p>
      <p>Guarda este correo: el enlace seguirá disponible. También encuentras tu lectura en <a href="${siteUrl}/mi-cuenta" style="color:#5B34B0;">Mi cuenta</a>, iniciando sesión con este correo.</p>
      <p>Si quieres comentarme algo sobre ella, responde este correo. Gracias por confiar en Zodiac Noir ✦</p>`
    ),
  });
}
