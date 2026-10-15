import { prisma, safeQuery } from "@/lib/prisma";
import { summarizeViews, viewDayKey, type ArticleViewStats } from "@/lib/views";

/**
 * Contador de visitas de la tienda. Funciona igual que el de artículos (un número por destino
 * y por día, sin IP ni datos personales), pero en su propia tabla (StoreView).
 *
 * Destinos:
 * - "tienda": la página /tienda
 * - "producto:<id>": la ficha de un libro (se abra desde /tienda o desde su página propia)
 */

export const STORE_PAGE_TARGET = "tienda";

export function productTarget(productId: string): string {
  return `producto:${productId}`;
}

type StoreViewsClient = {
  storeView: {
    upsert: (args: {
      where: { target_day: { target: string; day: string } };
      create: { target: string; day: string; views: number };
      update: { views: { increment: number } };
    }) => Promise<unknown>;
  };
};

/** Suma 1 a las visitas de ese destino en ese día (la crea si es la primera del día). */
export async function recordStoreViewWith(client: StoreViewsClient, target: string, day: string): Promise<void> {
  const args = {
    where: { target_day: { target, day } },
    create: { target, day, views: 1 },
    update: { views: { increment: 1 } },
  };
  try {
    await client.storeView.upsert(args);
  } catch (error) {
    // Dos visitas simultáneas pueden intentar crear la fila del día a la vez (P2002): se reintenta como suma.
    if ((error as { code?: string })?.code === "P2002") {
      await client.storeView.upsert(args);
      return;
    }
    throw error;
  }
}

export async function recordStoreView(target: string): Promise<void> {
  await recordStoreViewWith(prisma as unknown as StoreViewsClient, target, viewDayKey());
}

/**
 * Visitas de /tienda y de cada libro, para el panel. La clave del mapa es el destino
 * ("tienda" o "producto:<id>"). Si la consulta falla (por ejemplo, la tabla todavía no existe)
 * devuelve vacío en vez de romper el panel.
 */
export async function getStoreViewStats(now: Date = new Date()): Promise<Map<string, ArticleViewStats>> {
  try {
    const rows = await safeQuery(() =>
      (prisma as unknown as {
        storeView: { findMany: (a: object) => Promise<{ target: string; day: string; views: number }[]> };
      }).storeView.findMany({ select: { target: true, day: true, views: true } })
    );
    return summarizeViews(
      rows.map((r) => ({ articleId: r.target, day: r.day, views: r.views })),
      now
    );
  } catch (error) {
    console.error("No se pudieron leer las visitas de la tienda:", error);
    return new Map();
  }
}
