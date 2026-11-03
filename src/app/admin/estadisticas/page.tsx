import Link from "next/link";
import { prisma, safeQuery } from "@/lib/prisma";
import { livePublicationFilter } from "@/lib/publication";
import { getTrafficReport, OTHER_PATH, type TrafficReport } from "@/lib/site-traffic";
import { TRAFFIC_SOURCES, isSourceKey, sourceLabel } from "@/lib/traffic-sources";
import { buildCategoryTree, categoryHref, loadCategoryRows, type CategoryNode } from "@/lib/store-categories";
import { TrafficChart } from "@/components/admin/TrafficChart";
import { TrackedLinkBuilder, type LinkDestinationGroup } from "@/components/admin/TrackedLinkBuilder";

export const dynamic = "force-dynamic";

const NUMBER_FORMAT = new Intl.NumberFormat("es-AR");
const fmt = (n: number) => NUMBER_FORMAT.format(n);

const RANGES = [
  { value: "7", label: "7 días", days: 7 },
  { value: "30", label: "30 días", days: 30 },
  { value: "90", label: "90 días", days: 90 },
  { value: "todo", label: "Todo", days: null },
] as const;

const STATIC_LABELS: Record<string, string> = {
  "/": "Página principal",
  "/tienda": "Tienda (portada)",
  "/blog": "Blog (listado)",
  "/membresia": "Membresía",
  "/efemerides": "Efemérides",
  "/signos": "Signos (listado)",
  "/lecturas": "Lecturas",
  "/sobre-nosotros": "Sobre nosotros",
  "/contacto": "Contacto",
  "/privacidad": "Privacidad",
  "/terminos": "Términos",
  [OTHER_PATH]: "Otras páginas",
};

function flatten(nodes: CategoryNode[]): CategoryNode[] {
  return nodes.flatMap((n) => [n, ...flatten(n.children)]);
}

function buildHref(range: string, source: string | null, anchor = "") {
  const params = new URLSearchParams();
  if (range !== "30") params.set("rango", range);
  if (source) params.set("fuente", source);
  const query = params.toString();
  return `/admin/estadisticas${query ? `?${query}` : ""}${anchor}`;
}

function Delta({ current, previous }: { current: number; previous: number | null }) {
  if (previous === null) return null;
  if (previous === 0) {
    return <span className="font-ui text-xs text-gold-dim">{current > 0 ? "Sin datos del período anterior" : ""}</span>;
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  const sign = pct > 0 ? "+" : "";
  return (
    <span className={`font-ui text-xs ${pct >= 0 ? "text-green-300" : "text-wine-bright"}`}>
      {sign}
      {pct}% frente al período anterior
    </span>
  );
}

type PageRow = TrafficReport["pages"][number] & { name: string };

function PageTable({ title, rows, empty }: { title: string; rows: PageRow[]; empty: string }) {
  return (
    <section className="rounded-xl border border-gold/15 bg-noir-surface/40 p-5">
      <h3 className="font-display text-lg text-gold-pale">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-3 font-ui text-sm text-gold-dim">{empty}</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[30rem] border-collapse font-ui text-sm">
            <thead>
              <tr className="border-b border-gold/20 text-left text-xs uppercase tracking-wide text-gold-dim">
                <th scope="col" className="py-2 pr-3 font-medium">Página</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Vistas</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Entradas</th>
                <th scope="col" className="py-2 pl-3 font-medium">Fuente principal</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 15).map((row) => (
                <tr key={row.path} className="border-b border-gold/10 last:border-0">
                  <td className="max-w-[18rem] py-2 pr-3 text-gold-pale">
                    <span className="block truncate" title={row.name}>{row.name}</span>
                    <span className="block truncate text-xs text-gold-dim">{row.path}</span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-gold">{fmt(row.views)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-gold-pale/90">{fmt(row.entries)}</td>
                  <td className="py-2 pl-3 text-gold-pale/80">{row.topSource ? sourceLabel(row.topSource) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 15 && <p className="mt-2 font-ui text-xs text-gold-dim">Se muestran las 15 con más vistas de {rows.length}.</p>}
        </div>
      )}
    </section>
  );
}

export default async function EstadisticasPage({
  searchParams,
}: {
  searchParams?: { rango?: string; fuente?: string };
}) {
  const range = RANGES.find((r) => r.value === searchParams?.rango) ?? RANGES[1];
  const source = isSourceKey(searchParams?.fuente) ? searchParams!.fuente! : null;

  const report = await getTrafficReport({ days: range.days, source });

  // Nombres legibles para las páginas y destinos del generador de links.
  const [articles, products, categoryRows] = await Promise.all([
    safeQuery(() =>
      prisma.article.findMany({ where: livePublicationFilter(), select: { slug: true, title: true }, orderBy: { publishedAt: "desc" } })
    ),
    safeQuery(() =>
      prisma.product.findMany({
        where: { published: true, parentId: null },
        select: { slug: true, title: true },
        orderBy: { createdAt: "desc" },
      })
    ),
    loadCategoryRows(),
  ]);
  const categories = flatten(buildCategoryTree(categoryRows, { onlyVisible: true }));

  const names = new Map<string, string>();
  Object.entries(STATIC_LABELS).forEach(([path, name]) => names.set(path, name));
  articles.forEach((a) => names.set(`/blog/${a.slug}`, a.title));
  products.forEach((p) => names.set(`/tienda/${p.slug}`, p.title));
  categories.forEach((c) => names.set(categoryHref(c.slug), `Categoría: ${c.name}`));

  const rows: PageRow[] = report.pages.map((p) => ({
    ...p,
    name: names.get(p.path) ?? (p.path.startsWith("/signos/") ? `Signo: ${p.path.slice(8)}` : p.path),
  }));
  const home = rows.find((r) => r.path === "/");
  const isBlogArticle = (p: string) => p.startsWith("/blog/");
  const isCategory = (p: string) => p.startsWith("/tienda/categoria/");
  const isProduct = (p: string) => p.startsWith("/tienda/") && !isCategory(p);
  const sitePages = rows.filter((r) => !isBlogArticle(r.path) && !isCategory(r.path) && !isProduct(r.path));

  const maxSource = Math.max(1, ...report.sources.map((s) => s.entries));
  const totalEntries = report.sources.reduce((sum, s) => sum + s.entries, 0);

  const destinations: LinkDestinationGroup[] = [
    {
      label: "Sitio",
      items: [
        { path: "/", label: "Página principal" },
        { path: "/tienda", label: "Tienda (portada)" },
        { path: "/blog", label: "Blog (listado)" },
        { path: "/membresia", label: "Membresía" },
      ],
    },
    { label: "Categorías de la tienda", items: categories.map((c) => ({ path: categoryHref(c.slug), label: c.name })) },
    { label: "Productos", items: products.map((p) => ({ path: `/tienda/${p.slug}`, label: p.title })) },
    { label: "Artículos", items: articles.map((a) => ({ path: `/blog/${a.slug}`, label: a.title })) },
  ];

  const chip = (active: boolean) =>
    `focus-ring inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-ui text-xs uppercase tracking-wide transition ${
      active ? "border-gold bg-gold text-noir-bg" : "border-gold/30 text-gold-pale hover:border-gold hover:bg-gold/10"
    }`;

  const hasData = report.totals.views > 0 || report.sources.length > 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl text-gold-pale">Estadísticas de visitas</h1>
        <p className="mt-2 max-w-3xl font-body text-lg leading-relaxed text-gold-pale/80">
          Todo el sitio en un solo lugar: la página principal, cada artículo, cada producto y de dónde llega la gente. Una{" "}
          <strong className="font-semibold text-gold-pale">visita</strong> es una persona que entra al sitio (se cuenta una vez por
          pestaña). Las <strong className="font-semibold text-gold-pale">vistas</strong> son las páginas que abrió, y las{" "}
          <strong className="font-semibold text-gold-pale">entradas</strong> son las veces que alguien empezó su visita en esa página.
        </p>
      </div>

      <nav aria-label="Período" className="flex flex-wrap gap-2">
        {RANGES.map((r) => (
          <Link key={r.value} href={buildHref(r.value, source)} aria-current={r.value === range.value ? "page" : undefined} className={chip(r.value === range.value)}>
            {r.label}
          </Link>
        ))}
      </nav>
      <nav aria-label="Fuente" className="mt-3 flex flex-wrap gap-2">
        <Link href={buildHref(range.value, null)} aria-current={!source ? "page" : undefined} className={chip(!source)}>
          Todas las fuentes
        </Link>
        {TRAFFIC_SOURCES.filter((s) => report.sources.some((x) => x.key === s.key) || s.key === source).map((s) => (
          <Link key={s.key} href={buildHref(range.value, s.key)} aria-current={source === s.key ? "page" : undefined} className={chip(source === s.key)}>
            {s.label}
          </Link>
        ))}
      </nav>
      {source && (
        <p className="mt-3 font-ui text-sm text-gold-pale/80" role="status">
          Estás viendo solo lo que llegó desde <strong className="text-gold">{sourceLabel(source)}</strong>.
        </p>
      )}

      {/* Números principales */}
      <section aria-label="Resumen" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gold/20 bg-noir-surface/50 p-5">
          <p className="font-ui text-xs uppercase tracking-wide text-gold-dim">Visitas al sitio</p>
          <p className="mt-1 font-display text-3xl text-gold">{fmt(report.totals.entries)}</p>
          <Delta current={report.totals.entries} previous={report.previous?.entries ?? null} />
        </div>
        <div className="rounded-xl border border-gold/20 bg-noir-surface/50 p-5">
          <p className="font-ui text-xs uppercase tracking-wide text-gold-dim">Páginas vistas</p>
          <p className="mt-1 font-display text-3xl text-gold">{fmt(report.totals.views)}</p>
          <Delta current={report.totals.views} previous={report.previous?.views ?? null} />
        </div>
        <div className="rounded-xl border border-gold/20 bg-noir-surface/50 p-5">
          <p className="font-ui text-xs uppercase tracking-wide text-gold-dim">Página principal</p>
          <p className="mt-1 font-display text-3xl text-gold">{fmt(home?.views ?? 0)}</p>
          <p className="font-ui text-xs text-gold-dim">vistas de «/» en este período</p>
        </div>
        <div className="rounded-xl border border-gold/20 bg-noir-surface/50 p-5">
          <p className="font-ui text-xs uppercase tracking-wide text-gold-dim">Hoy</p>
          <p className="mt-1 font-display text-3xl text-gold">{fmt(report.today.entries)}</p>
          <p className="font-ui text-xs text-gold-dim">visitas · {fmt(report.today.views)} páginas vistas</p>
        </div>
      </section>

      {!hasData && (
        <div className="mt-6 rounded-xl border border-gold/20 bg-gold/5 p-5 font-body text-lg text-gold-pale/90" role="status">
          Todavía no hay visitas registradas{source ? " desde esa fuente" : ""} en este período. Los números empiezan a juntarse desde que
          se publicó esta sección; tus propias visitas como administradora no se cuentan. Las vistas de cada artículo y de la tienda que ya
          tenías siguen en sus listas.
        </div>
      )}

      {/* Gráfico */}
      <section className="mt-6 rounded-xl border border-gold/15 bg-noir-surface/40 p-5">
        <h2 className="font-display text-lg text-gold-pale">Visitas por día</h2>
        <p className="font-ui text-xs text-gold-dim">
          {range.days ? `Últimos ${range.days} días` : "Últimos 90 días"} · día de Argentina
        </p>
        <div className="mt-3">
          <TrafficChart data={report.daily} />
        </div>
      </section>

      {/* Fuentes */}
      <section className="mt-6 rounded-xl border border-gold/15 bg-noir-surface/40 p-5">
        <h2 className="font-display text-lg text-gold-pale">¿Desde dónde llegan?</h2>
        {report.sources.length === 0 ? (
          <p className="mt-3 font-ui text-sm text-gold-dim">Cuando lleguen las primeras visitas verás aquí de qué fuente vienen.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {report.sources.map((s) => (
              <li key={s.key}>
                <Link
                  href={buildHref(range.value, s.key)}
                  className="focus-ring grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-gold/10 sm:grid-cols-[12rem_1fr_auto]"
                >
                  <span className="truncate font-ui text-sm text-gold-pale">{sourceLabel(s.key)}</span>
                  <span className="h-2.5 overflow-hidden rounded-full bg-gold/15" aria-hidden="true">
                    <span className="block h-full rounded-full bg-gold" style={{ width: `${Math.max(2, (s.entries / maxSource) * 100)}%` }} />
                  </span>
                  <span className="text-right font-ui text-sm tabular-nums text-gold">
                    {fmt(s.entries)}
                    <span className="ml-1.5 text-xs text-gold-dim">
                      {totalEntries > 0 ? `${Math.round((s.entries / totalEntries) * 100)}%` : ""}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 font-ui text-xs text-gold-dim">
          Toca una fuente para ver solo lo que llegó desde ahí. Los links con seguimiento (más abajo) hacen que YouTube e Instagram se
          reconozcan siempre: Instagram, en particular, no siempre avisa de dónde viene la gente si el link no está marcado.
        </p>
      </section>

      {/* Páginas */}
      <div className="mt-6 grid gap-6">
        <PageTable title="Página principal y páginas del sitio" rows={sitePages} empty="Sin visitas en este período." />
        <PageTable title="Productos" rows={rows.filter((r) => isProduct(r.path))} empty="Todavía no hay visitas a fichas de productos en este período." />
        <PageTable title="Artículos" rows={rows.filter((r) => isBlogArticle(r.path))} empty="Todavía no hay visitas a artículos en este período." />
        <PageTable title="Categorías de la tienda" rows={rows.filter((r) => isCategory(r.path))} empty="Todavía no hay visitas a categorías en este período." />
      </div>

      {/* Campañas */}
      {report.campaigns.length > 0 && (
        <section className="mt-6 rounded-xl border border-gold/15 bg-noir-surface/40 p-5">
          <h2 className="font-display text-lg text-gold-pale">Campañas</h2>
          <p className="font-ui text-xs text-gold-dim">Son los nombres que pusiste al armar un link (por ejemplo, el de cada video).</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[24rem] border-collapse font-ui text-sm">
              <thead>
                <tr className="border-b border-gold/20 text-left text-xs uppercase tracking-wide text-gold-dim">
                  <th scope="col" className="py-2 pr-3 font-medium">Campaña</th>
                  <th scope="col" className="px-3 py-2 font-medium">Fuente</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Visitas</th>
                  <th scope="col" className="py-2 pl-3 text-right font-medium">Vistas</th>
                </tr>
              </thead>
              <tbody>
                {report.campaigns.slice(0, 20).map((c) => (
                  <tr key={`${c.campaign}|${c.source}`} className="border-b border-gold/10 last:border-0">
                    <td className="py-2 pr-3 text-gold-pale">{c.campaign}</td>
                    <td className="px-3 py-2 text-gold-pale/80">{sourceLabel(c.source)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-gold">{fmt(c.entries)}</td>
                    <td className="py-2 pl-3 text-right tabular-nums text-gold-pale/90">{fmt(c.views)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Generador de links */}
      <section id="links" className="mt-8 scroll-mt-6 rounded-xl border border-gold/25 bg-noir-surface/50 p-5 sm:p-6">
        <h2 className="font-display text-xl text-gold-pale">Links con seguimiento</h2>
        <p className="mt-2 max-w-3xl font-body text-lg leading-relaxed text-gold-pale/80">
          Usa estos links cuando compartas algo en YouTube, Instagram u otra red. Son los mismos de siempre, con una marca al final
          que le avisa al panel de dónde vino cada visita. Elige la página, copia el link de la red donde lo vas a pegar y listo.
        </p>
        <div className="mt-5">
          <TrackedLinkBuilder groups={destinations} />
        </div>
        <p className="mt-4 font-ui text-xs text-gold-dim">
          También encuentras el botón «Copiar link» en la lista de productos y en la de artículos.
        </p>
      </section>

      <p className="mt-6 max-w-3xl font-ui text-xs leading-relaxed text-gold-dim">
        No se guarda ninguna dirección IP ni dato personal: solo cuántas veces se abrió cada página y de qué fuente llegó. No se cuentan
        tus visitas como administradora, ni robots y servicios automáticos. Una página cuenta una vez por pestaña, así que recargar no suma.
      </p>
    </div>
  );
}
