import { prisma, safeQuery } from "@/lib/prisma";

const READINGS_KEY = "readings_enabled";

/**
 * ¿Están visibles las lecturas para el público?
 * Si nunca se activaron (no hay registro) o si la base falla, devuelve false:
 * ante la duda, el servicio queda oculto.
 */
export async function getReadingsEnabled(): Promise<boolean> {
  try {
    const row = await safeQuery(() => prisma.siteSetting.findUnique({ where: { key: READINGS_KEY } }));
    return row?.value === "true";
  } catch {
    return false;
  }
}

export async function setReadingsEnabled(enabled: boolean): Promise<void> {
  const value = enabled ? "true" : "false";
  await prisma.siteSetting.upsert({
    where: { key: READINGS_KEY },
    update: { value },
    create: { key: READINGS_KEY, value },
  });
}

const PAYPAL_KEY = "paypal_enabled";

/**
 * ¿Están visibles los botones de PayPal para el público?
 * Si nunca se activaron (no hay registro) o si la base falla, devuelve false:
 * ante la duda, quedan ocultos y solo los ve la administración.
 */
export async function getPaypalEnabled(): Promise<boolean> {
  try {
    const row = await safeQuery(() => prisma.siteSetting.findUnique({ where: { key: PAYPAL_KEY } }));
    return row?.value === "true";
  } catch {
    return false;
  }
}

export async function setPaypalEnabled(enabled: boolean): Promise<void> {
  const value = enabled ? "true" : "false";
  await prisma.siteSetting.upsert({
    where: { key: PAYPAL_KEY },
    update: { value },
    create: { key: PAYPAL_KEY, value },
  });
}
