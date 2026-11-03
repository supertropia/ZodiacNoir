import { prisma, safeQuery } from "@/lib/prisma";
import { isArticleLive } from "@/lib/publication";
import { viewDayKey, viewDayKeyDaysAgo } from "@/lib/views";
import { signs } from "@/data/signs";


/**
 * Contador de visitas de TODO el sitio. Guarda un número por día, página, fuente y campaña
 * (tabla PageView). No guarda IP, usuario ni ningún dato personal.
 *
 * - views: veces que se abrió la página (una por página y por pestaña).
 * - entries: veces que alguien empezó su visita al sitio justo en esa página.
 *   La suma de entries de todas las páginas es la cantidad de visitas al sitio.
 */

export const OTHER_PATH = "otras";

const STATIC_PATHS = new Set([
  "/",
  "/tienda",
  "/blog",
  "/membresia",
  "/efemerides",
  "/signos",
  "/lecturas",
  "/sobre-nosotros",
  "/contacto",
  "/privacidad",
  "/terminos",
]);

const SLUG = /^[a-z0-9][a-z0-9-_]{0,119}$/;

/**
 * Convierte la dirección que manda el navegador en una de las que el panel conoce.
 * Devuelve null para páginas que no se cuentan (panel de administración, API, ingreso) y "otras"
 * para cualquier otra cosa, así el total del sitio siempre queda completo y nadie puede llenar la
 * base de datos con direcciones inventadas.
 */
export async function normalizeTrackedPath(raw: unknown): Promise<string | null> {
  if (typeof raw !== "string") return null;
  let path = raw.split("?")[0].split("#")[0].trim().toLowerCase();
  if (!path.startsWith("/") || path.length > 200) return null;
  if (path.length > 1) path = path.replace(/\/+$/, "");
  if (/^\/(admin|api|ingresar|registro|_next)(\/|$)/.test(path)) return null;

  if (STATIC_PATHS.has(path)) return path;

  const parts = path.split("/").filter(Boolean);

  if (parts[0] === "tienda" && parts[1] === "categoria" && parts.length === 3 && SLUG.test(parts[2])) {
    const category = await safeQuery(() => prisma.storeCategory.findUnique({ where: { slug: parts[2] }, select: { id: true } }));
    return category ? path : OTHER_PATH;
  }

  if (parts[0] === "tienda" && parts.length === 2 && SLUG.test(parts[1])) {
    const product = await safeQuery(() =>
      prisma.product.findUnique({ where: { slug: parts[1] }, select: { id: true, published: true } })
    );
    return product?.published ? path : OTHER_PATH;
  }

  if (parts[0] === "blog" && parts.length === 2 && SLUG.test(parts[1])) {
    const article = await safeQuery(() =>
      prisma.article.findUnique({ where: { slug: parts[1] }, select: { published: true, publishedAt: true } })
    );
    return article && isArticleLive(article) ? path : OTHER_PATH;
  }

  if (parts[0] === "signos" && parts.length === 2) {
    return signs.some((s) => s.slug === parts[1]) ? path : OTHER_PATH;
  }

  return OTHER_PATH;
}

type PageViewClient = {
  pageView: {
    upsert: (args: {
      where: { day_path_source_campaign: { day: string; path: string; source: string; campaign: string } };
      create: { day: string; path: string; source: string; campaign: string; views: number; entries: number };
      update: { views: { increment: number }; entries: { increment: number } };
    }) => Promise<unknown>;
  };
};

export async function recordPageViewWith(
  client: PageViewClient,
  input: { day: string; path: string; source: string; campaign: string; entry: boolean }
): Promise<void> {
  const { day, path, source, campaign, entry } = input;
  const args = {
    where: { day_path_source_campaign: { day, path, source, campaign } },
    create: { day, path, source, campaign, views: 1, entries: entry ? 1 : 0 },
    update: { views: { increment: 1 }, entries: { increment: entry ? 1 : 0 } },
  };
  try {
    await client.pageView.upsert(args);
  } catch (error) {
    // Dos visitas simultáneas pueden intentar crear la fila del día a la vez (P2002): se reintenta como suma.
    if ((error as { code?: string })?.code === "P2002") {
      await client.pageView.upsert(args);
      return;
    }
    throw error;
  }
}

export async function recordPageView(input: { path: string; source: string; campaign: string; entry: boolean }): Promise<void> {
  await recordPageViewWith(prisma as unknown as PageViewClient, { ...input, day: viewDayKey() });
}

// ---------------------------------------------------------------------------
// Informe para el panel
// ---------------------------------------------------------------------------

export type TrafficRow = { day: string; path: string; source: string; campaign: string; views: number; entries: number };
type Pair = { views: number; entries: number };

export type TrafficReport = {
  days: number | null;
  sourceFilter: string | null;
  totals: Pair;
  /** El período anterior de la misma duración (para comparar). null si se mira todo el historial. */
  previous: Pair | null;
  today: Pair;
  daily: { day: string; views: number; entries: number }[];
  sources: { key: string; views: number; entries: number }[];
  pages: { path: string; views: number; entries: number; topSource: string | null }[];
  campaigns: { campaign: string; source: string; views: number; entries: number }[];
};

const CHART_DAYS_FOR_ALL = 90;

function add(target: Pair, row: { views: number; entries: number }) {
  target.views += row.views;
  target.entries += row.entries;
}

/** Arma el informe a partir de las filas diarias. Es una función pura para poder probarla sin base de datos. */
export function buildTrafficReport(
  rows: TrafficRow[],
  opts: { days: number | null; source?: string | null; now?: Date }
): TrafficReport {
  const now = opts.now ?? new Date();
  const { days } = opts;
  const sourceFilter = opts.source ?? null;
  const from = days ? viewDayKeyDaysAgo(days - 1, now) : null;
  const prevFrom = days ? viewDayKeyDaysAgo(days * 2 - 1, now) : null;
  const today = viewDayKey(now);

  const inRange = rows.filter((r) => (from ? r.day >= from : true));
  const inPrev = prevFrom && from ? rows.filter((r) => r.day >= prevFrom && r.day < from) : [];

  const sourceOk = (r: TrafficRow) => !sourceFilter || r.source === sourceFilter;

  const totals: Pair = { views: 0, entries: 0 };
  const previous: Pair | null = days ? { views: 0, entries: 0 } : null;
  const todayPair: Pair = { views: 0, entries: 0 };
  for (const r of inRange.filter(sourceOk)) {
    add(totals, r);
    if (r.day === today) add(todayPair, r);
  }
  if (previous) for (const r of inPrev.filter(sourceOk)) add(previous, r);

  // Gráfico: un punto por día, con los días sin visitas en cero.
  const chartDays = days ?? CHART_DAYS_FOR_ALL;
  const byDay = new Map<string, Pair>();
  for (const r of rows.filter(sourceOk)) {
    const p = byDay.get(r.day) ?? { views: 0, entries: 0 };
    add(p, r);
    byDay.set(r.day, p);
  }
  const daily: TrafficReport["daily"] = [];
  for (let i = chartDays - 1; i >= 0; i--) {
    const day = viewDayKeyDaysAgo(i, now);
    const p = byDay.get(day) ?? { views: 0, entries: 0 };
    daily.push({ day, views: p.views, entries: p.entries });
  }

  // Fuentes: siempre sobre todas las fuentes, para poder comparar y elegir una.
  const bySource = new Map<string, Pair>();
  for (const r of inRange) {
    const p = bySource.get(r.source) ?? { views: 0, entries: 0 };
    add(p, r);
    bySource.set(r.source, p);
  }
  const sources = Array.from(bySource, ([key, p]) => ({ key, ...p })).sort(
    (a, b) => b.entries - a.entries || b.views - a.views
  );

  // Páginas, con la fuente que más visitas le trae.
  const byPage = new Map<string, { pair: Pair; sources: Map<string, number> }>();
  for (const r of inRange.filter(sourceOk)) {
    const entry = byPage.get(r.path) ?? { pair: { views: 0, entries: 0 }, sources: new Map<string, number>() };
    add(entry.pair, r);
    entry.sources.set(r.source, (entry.sources.get(r.source) ?? 0) + r.views);
    byPage.set(r.path, entry);
  }
  const pages = Array.from(byPage, ([path, v]) => {
    let top: string | null = null;
    let best = 0;
    v.sources.forEach((count, source) => {
      if (count > best) {
        best = count;
        top = source;
      }
    });
    return { path, ...v.pair, topSource: top };
  }).sort((a, b) => b.views - a.views || b.entries - a.entries);

  // Campañas (solo las visitas que llegaron con un nombre de campaña).
  const byCampaign = new Map<string, { campaign: string; source: string; views: number; entries: number }>();
  for (const r of inRange.filter(sourceOk)) {
    if (!r.campaign) continue;
    const key = `${r.campaign}|${r.source}`;
    const c = byCampaign.get(key) ?? { campaign: r.campaign, source: r.source, views: 0, entries: 0 };
    c.views += r.views;
    c.entries += r.entries;
    byCampaign.set(key, c);
  }
  const campaigns = Array.from(byCampaign.values()).sort((a, b) => b.entries - a.entries || b.views - a.views);

  return { days, sourceFilter, totals, previous, today: todayPair, daily, sources, pages, campaigns };
}

const EMPTY_REPORT_ROWS: TrafficRow[] = [];

/** Lee las visitas guardadas y arma el informe. Si la tabla todavía no existe, devuelve un informe vacío. */
export async function getTrafficReport(opts: { days: number | null; source?: string | null; now?: Date }): Promise<TrafficReport> {
  const now = opts.now ?? new Date();
  let rows = EMPTY_REPORT_ROWS;
  try {
    const earliest = opts.days ? viewDayKeyDaysAgo(Math.max(opts.days * 2 - 1, CHART_DAYS_FOR_ALL), now) : undefined;
    rows = await safeQuery(() =>
      prisma.pageView.findMany({
        where: earliest ? { day: { gte: earliest } } : undefined,
        select: { day: true, path: true, source: true, campaign: true, views: true, entries: true },
      })
    );
  } catch (error) {
    console.error("No se pudieron leer las visitas del sitio:", error);
  }
  return buildTrafficReport(rows, { ...opts, now });
}
