import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Envuelve una consulta de Prisma con reintentos automáticos.
 * Existe un bug intermitente y conocido del motor de Prisma (un "panic" interno
 * en Rust, ver github.com/prisma/prisma/issues/8691 y similares) que hace fallar
 * una consulta al azar aunque los datos y el código sean correctos. Reintentar
 * una vez, con una pequeña espera, resuelve el problema en casi todos los casos
 * sin que la persona que visita el sitio note nada.
 */
export async function safeQuery<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 150 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}
