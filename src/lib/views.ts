import { prisma, safeQuery } from "@/lib/prisma";
import { PUBLICATION_TIME_ZONE } from "@/lib/publication";

/**
 * Contador de vistas por artículo.
 *
 * Se guarda UN número por artículo y por día (tabla ArticleView). No se guarda
 * ninguna dirección IP, ni usuario, ni dato personal: solo cuántas veces se abrió
 * cada artículo. Los días se cuentan en horario de Argentina, para que "hoy" en el
 * panel coincida con tu día y no con el del servidor (que corre en UTC).
 */

/** Día en formato AAAA-MM-DD, en horario de Argentina. */
export function viewDayKey(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: PUBLICATION_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Día (AAAA-MM-DD) de hace `days` días. Argentina no tiene horario de verano, así que 24 h = 1 día. */
export function viewDayKeyDaysAgo(days: number, now: Date = new Date()): string {
  return viewDayKey(new Date(now.getTime() - days * 24 * 60 * 60 * 1000));
}

// Robots y servicios automáticos que no son lectoras: buscadores, vistas previas de redes,
// monitores de disponibilidad y herramientas de descarga.
const BOT_PATTERN =
  /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse|pingdom|uptime|monitor|curl\/|wget|python-requests|axios|node-fetch|go-http|java\/|httpclient/i;

/** true si el User-Agent parece de un robot (o si no trae ninguno). */
export function isLikelyBot(userAgent: string | null | undefined): boolean {
  if (!userAgent || !userAgent.trim()) return true;
  return BOT_PATTERN.test(userAgent);
}

// Parte mínima del cliente de Prisma que necesitamos; permite probar la lógica sin base de datos.
type ViewsClient = {
  articleView: {
    upsert: (args: {
      where: { articleId_day: { articleId: string; day: string } };
      create: { articleId: string; day: string; views: number };
      update: { views: { increment: number } };
    }) => Promise<unknown>;
  };
};

/** Suma 1 a las vistas de ese artículo en ese día (la crea si es la primera del día). */
export async function recordViewWith(client: ViewsClient, articleId: string, day: string): Promise<void> {
  const args = {
    where: { articleId_day: { articleId, day } },
    create: { articleId, day, views: 1 },
    update: { views: { increment: 1 } },
  };
  try {
    await client.articleView.upsert(args);
  } catch (error) {
    // Dos visitas simultáneas pueden intentar crear la fila del día a la vez (error P2002):
    // la segunda ya la encuentra creada, así que se reintenta una vez como suma.
    if ((error as { code?: string })?.code === "P2002") {
      await client.articleView.upsert(args);
      return;
    }
    throw error;
  }
}

export async function recordView(articleId: string): Promise<void> {
  await recordViewWith(prisma as unknown as ViewsClient, articleId, viewDayKey());
}

export type ArticleViewStats = { total: number; last7: number; last30: number };

type DailyRow = { articleId: string; day: string; views: number };

/** Calcula total, últimos 7 y últimos 30 días por artículo a partir de las filas diarias. */
export function summarizeViews(rows: DailyRow[], now: Date = new Date()): Map<string, ArticleViewStats> {
  const from7 = viewDayKeyDaysAgo(6, now); // hoy + los 6 días anteriores
  const from30 = viewDayKeyDaysAgo(29, now);
  const stats = new Map<string, ArticleViewStats>();
  for (const row of rows) {
    const s = stats.get(row.articleId) ?? { total: 0, last7: 0, last30: 0 };
    s.total += row.views;
    // Las claves AAAA-MM-DD se ordenan igual como texto que como fechas.
    if (row.day >= from30) s.last30 += row.views;
    if (row.day >= from7) s.last7 += row.views;
    stats.set(row.articleId, s);
  }
  return stats;
}

/**
 * Estadísticas de todos los artículos, para el panel de administración.
 * Si la consulta falla (por ejemplo, si la tabla todavía no existe) devuelve vacío en vez de
 * romper el panel: los artículos se siguen viendo, solo sin números.
 */
export async function getViewStats(now: Date = new Date()): Promise<Map<string, ArticleViewStats>> {
  try {
    const rows = await safeQuery(() =>
      prisma.articleView.findMany({ select: { articleId: true, day: true, views: true } })
    );
    return summarizeViews(rows, now);
  } catch (error) {
    console.error("No se pudieron leer las vistas:", error);
    return new Map();
  }
}
