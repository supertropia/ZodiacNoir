// Quién ve los botones de PayPal.
//
// - "public": todas las personas (el interruptor del panel está activado y las credenciales están cargadas).
// - "preview": solo la administración (el interruptor está apagado, o faltan las credenciales). Sirve para
//   probar el flujo completo antes de abrirlo al público.
// - "hidden": nadie lo ve.

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { getPaypalEnabled } from "@/lib/site-settings";
import { isPaypalConfigured } from "@/lib/paypal";

export type PaypalVisibility = "hidden" | "preview" | "public";

export async function getPaypalVisibility(): Promise<PaypalVisibility> {
  const session = await getServerSession(authOptions);
  const isAdmin = isAdminEmail(session?.user?.email);
  const enabled = await getPaypalEnabled();

  if (enabled && isPaypalConfigured()) return "public";
  return isAdmin ? "preview" : "hidden";
}

/** Para las rutas del servidor: ¿esta persona puede iniciar un pago con PayPal ahora mismo? */
export async function canUsePaypal(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  const isAdmin = isAdminEmail(session?.user?.email);
  if (isAdmin) return true;
  return (await getPaypalEnabled()) && isPaypalConfigured();
}
