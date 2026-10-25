// Correo con el enlace de descarga de un PDF comprado (se usa en los pagos con PayPal).
// Si Resend no está configurado o falla, no rompe el pago: la persona igual puede descargar el PDF
// desde la ficha del libro si compró con su cuenta.

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function sendDownloadEmail(to: string, productTitle: string, fileUrl: string | null): Promise<void> {
  if (!process.env.RESEND_API_KEY || !fileUrl) return;
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const title = escapeHtml(productTitle);
    await resend.emails.send({
      from: process.env.NEWSLETTER_FROM || "Zodiac Noir <onboarding@resend.dev>",
      to,
      subject: `Tu PDF ya está listo: ${productTitle}`,
      html: `
        <p>¡Gracias por tu compra en Zodiac Noir!</p>
        <p>Tu PDF <strong>${title}</strong> ya está disponible. Puedes descargarlo desde este enlace:</p>
        <p><a href="${escapeHtml(fileUrl)}">${escapeHtml(fileUrl)}</a></p>
        <p>Guarda este correo por si quieres volver a descargarlo más adelante.</p>
        <p>Que lo disfrutes ✦</p>
      `,
    });
  } catch (error) {
    console.error("Error enviando el correo de descarga:", error);
  }
}
