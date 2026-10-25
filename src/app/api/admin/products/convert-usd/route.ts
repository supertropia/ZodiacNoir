import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";
import { getUsdArsQuote } from "@/lib/exchange-rate";
import { formatUsdAmount } from "@/lib/pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Pasa a dólares los productos que todavía tienen solo precio en pesos.
// - { apply: false }: solo muestra la conversión propuesta (no cambia nada).
// - { apply: true }: guarda el precio en USD de cada producto.
// Se usa el dólar blue de hoy SIN margen (el margen se aplica recién al cobrar en pesos) y se redondea
// al dólar entero más cercano. Los productos que ya tienen precio en USD no se tocan.
export async function POST(req: Request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  try {
    const body = await req.json().catch(() => ({}));
    const apply = body?.apply === true;

    const quote = await getUsdArsQuote();
    if (!quote || !quote.baseRate) {
      return NextResponse.json(
        { error: "No se pudo obtener la cotización del dólar blue ahora. Inténtalo en unos minutos." },
        { status: 503 }
      );
    }

    const products = await prisma.product.findMany({
      where: { priceUsd: null },
      orderBy: { createdAt: "asc" },
      select: { id: true, title: true, priceArs: true, priceLabel: true },
    });

    const items = products.map((p) => {
      if (!p.priceArs || p.priceArs <= 0) {
        return { id: p.id, title: p.title, priceArs: null as number | null, priceUsd: null as number | null };
      }
      const usd = Math.max(1, Math.round(p.priceArs / quote.baseRate));
      return { id: p.id, title: p.title, priceArs: p.priceArs, priceUsd: usd as number | null };
    });

    let updated = 0;
    if (apply) {
      for (const item of items) {
        if (!item.priceUsd) continue;
        await prisma.product.update({
          where: { id: item.id },
          data: { priceUsd: item.priceUsd, priceLabel: formatUsdAmount(item.priceUsd) },
        });
        updated += 1;
      }
    }

    return NextResponse.json({ ok: true, applied: apply, updated, rate: quote.baseRate, items });
  } catch (err) {
    console.error("Error al convertir precios a USD:", err);
    return NextResponse.json({ error: "No se pudieron convertir los precios." }, { status: 500 });
  }
}
