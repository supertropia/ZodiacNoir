import { prisma, safeQuery } from "@/lib/prisma";
import { viewDayKey, viewDayKeyDaysAgo } from "@/lib/views";
import { getReadingService } from "@/lib/lecturas";

/**
 * Ventas para el panel (Panel → Ventas): reúne las compras de productos, las membresías y las lecturas,
 * de todos los medios de pago, en una sola lista con totales.
 *
 * Importante: el sitio no guarda el monto exacto cobrado en productos y membresías. Para esos se usa el
 * precio en dólares que tiene publicado hoy el producto o el plan (en las lecturas sí es el monto real).
 * Los totales cuentan solo ventas confirmadas: compras pagadas, membresías activas y lecturas pagadas o entregadas.
 */

export type SaleKind = "producto" | "membresia" | "lectura";
export type SaleTone = "ok" | "warn" | "off";

export type SaleRow = {
  id: string;
  date: Date;
  kind: SaleKind;
  item: string;
  email: string;
  provider: string;
  stateLabel: string;
  tone: SaleTone;
  amountUsd: number | null;
  /** true si cuenta en los totales (venta confirmada y no devuelta). */
  counted: boolean;
};

export const KIND_LABELS: Record<SaleKind, string> = {
  producto: "Producto",
  membresia: "Membresía",
  lectura: "Lectura",
};

export function providerLabel(provider: string): string {
  if (provider === "paypal") return "PayPal";
  if (provider === "mercadopago") return "Mercado Pago";
  if (provider === "lemonsqueezy") return "Lemon Squeezy";
  return provider || "—";
}

// Datos mínimos que se necesitan de la base (permite probar la lógica sin base de datos).
export type SalesInput = {
  purchases: {
    id: string;
    email: string;
    provider: string;
    status: string;
    createdAt: Date;
    product: { title: string; priceUsd: number | null } | null;
  }[];
  subscriptions: {
    id: string;
    email: string;
    provider: string;
    status: string;
    createdAt: Date;
    plan: { name: string; priceUsd: number | null } | null;
  }[];
  readings: {
    id: string;
    email: string;
    provider: string;
    status: string;
    service: string;
    priceUsd: number;
    paidAt: Date | null;
    createdAt: Date;
  }[];
};

export type SalesData = {
  rows: SaleRow[];
  /** Membresías iniciadas que todavía no se confirmaron (no son ventas). */
  pendingMemberships: number;
};

const ACTIVE_SUBSCRIPTION = ["active", "on_trial"];

export function buildSales(input: SalesInput): SalesData {
  const rows: SaleRow[] = [];

  for (const p of input.purchases) {
    const refunded = p.status === "refunded";
    const paid = p.status === "paid";
    if (!paid && !refunded) continue;
    rows.push({
      id: `p-${p.id}`,
      date: p.createdAt,
      kind: "producto",
      item: p.product?.title ?? "Producto eliminado",
      email: p.email,
      provider: p.provider,
      stateLabel: refunded ? "Devuelta" : "Pagada",
      tone: refunded ? "off" : "ok",
      amountUsd: p.product?.priceUsd ?? null,
      counted: paid,
    });
  }

  let pendingMemberships = 0;
  for (const s of input.subscriptions) {
    if (s.status === "pending") {
      pendingMemberships += 1;
      continue;
    }
    const active = ACTIVE_SUBSCRIPTION.includes(s.status);
    rows.push({
      id: `s-${s.id}`,
      date: s.createdAt,
      kind: "membresia",
      item: s.plan?.name ?? "Membresía",
      email: s.email,
      provider: s.provider,
      stateLabel: active ? "Activa" : s.status === "cancelled" ? "Cancelada" : s.status === "paused" ? "Pausada" : s.status,
      tone: active ? "ok" : "off",
      amountUsd: s.plan?.priceUsd ?? null,
      counted: active,
    });
  }

  for (const r of input.readings) {
    const refunded = r.status === "refunded";
    const done = r.status === "paid" || r.status === "delivered";
    if (!done && !refunded) continue;
    rows.push({
      id: `r-${r.id}`,
      date: r.paidAt ?? r.createdAt,
      kind: "lectura",
      item: getReadingService(r.service)?.name ?? "Lectura",
      email: r.email,
      provider: r.provider,
      stateLabel: refunded ? "Devuelta" : r.status === "delivered" ? "Entregada" : "Pagada · por entregar",
      tone: refunded ? "off" : r.status === "delivered" ? "ok" : "warn",
      amountUsd: r.priceUsd,
      counted: done,
    });
  }

  rows.sort((a, b) => b.date.getTime() - a.date.getTime());
  return { rows, pendingMemberships };
}

export type PeriodTotal = { label: string; count: number; usd: number };
export type MonthTotal = { key: string; label: string; count: number; usd: number };
export type ProviderTotal = { provider: string; count: number };

export type SalesSummary = {
  periods: PeriodTotal[];
  months: MonthTotal[];
  providers: ProviderTotal[];
  refunded: number;
};

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString("es-AR", { month: "long", year: "numeric", timeZone: "UTC" });
}

/** Totales por período, por mes (últimos 6) y por medio de pago. Los días se cuentan en horario de Argentina. */
export function summarizeSales(rows: SaleRow[], now: Date = new Date()): SalesSummary {
  const counted = rows.filter((r) => r.counted);
  const from7 = viewDayKeyDaysAgo(6, now);
  const from30 = viewDayKeyDaysAgo(29, now);

  const total = (list: SaleRow[]) => ({
    count: list.length,
    usd: list.reduce((sum, r) => sum + (r.amountUsd ?? 0), 0),
  });
  const dayOf = (r: SaleRow) => viewDayKey(r.date);

  const periods: PeriodTotal[] = [
    { label: "Últimos 7 días", ...total(counted.filter((r) => dayOf(r) >= from7)) },
    { label: "Últimos 30 días", ...total(counted.filter((r) => dayOf(r) >= from30)) },
    { label: "En total", ...total(counted) },
  ];

  // Los 6 meses que terminan en el mes actual (en horario de Argentina).
  const [cy, cm] = viewDayKey(now).slice(0, 7).split("-").map(Number);
  const months: MonthTotal[] = [];
  for (let i = 0; i < 6; i++) {
    const idx = cy * 12 + (cm - 1) - i;
    const key = `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, "0")}`;
    const inMonth = counted.filter((r) => dayOf(r).slice(0, 7) === key);
    months.push({ key, label: monthLabel(key), ...total(inMonth) });
  }

  const byProvider = new Map<string, number>();
  for (const r of counted) byProvider.set(r.provider, (byProvider.get(r.provider) ?? 0) + 1);
  const providers = Array.from(byProvider, ([provider, count]) => ({ provider, count })).sort((a, b) => b.count - a.count);

  return { periods, months, providers, refunded: rows.filter((r) => r.stateLabel === "Devuelta").length };
}

/** Lee la base y arma la lista. Si algo falla devuelve vacío en vez de romper el panel (con failed = true). */
export async function getSalesData(): Promise<SalesData & { failed: boolean }> {
  try {
    const [purchases, subscriptions, readings] = await Promise.all([
      safeQuery(() =>
        prisma.purchase.findMany({
          orderBy: { createdAt: "desc" },
          take: 1000,
          include: { product: { select: { title: true, priceUsd: true } } },
        })
      ),
      safeQuery(() =>
        prisma.subscription.findMany({
          orderBy: { createdAt: "desc" },
          take: 1000,
          include: { plan: { select: { name: true, priceUsd: true } } },
        })
      ),
      safeQuery(() =>
        prisma.readingOrder.findMany({
          orderBy: { createdAt: "desc" },
          take: 1000,
          select: {
            id: true, email: true, provider: true, status: true, service: true, priceUsd: true, paidAt: true, createdAt: true,
          },
        })
      ),
    ]);
    return { ...buildSales({ purchases, subscriptions, readings }), failed: false };
  } catch (error) {
    console.error("No se pudieron leer las ventas:", error);
    return { rows: [], pendingMemberships: 0, failed: true };
  }
}
