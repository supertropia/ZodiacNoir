import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";
import { getUsdArsQuote, usdToArs } from "@/lib/exchange-rate";
import { updatePreapprovalAmount } from "@/lib/mercadopago";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Ajusta el cobro mensual en pesos de todas las suscripciones activas de Mercado Pago de un plan,
// según el precio en dólares del plan y el dólar blue de hoy (más el margen).
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  try {
    const plan = await prisma.membershipPlan.findUnique({ where: { id: params.id } });
    if (!plan) return NextResponse.json({ error: "Plan no encontrado." }, { status: 404 });
    if (!plan.priceUsd || plan.priceUsd <= 0) {
      return NextResponse.json({ error: "Este plan no tiene precio en dólares." }, { status: 400 });
    }

    const quote = await getUsdArsQuote();
    if (!quote) {
      return NextResponse.json({ error: "No se pudo obtener la cotización del dólar. Inténtalo en unos minutos." }, { status: 503 });
    }
    const amountArs = usdToArs(plan.priceUsd, quote.rate);

    const subs = await prisma.subscription.findMany({
      where: {
        planId: plan.id,
        provider: "mercadopago",
        status: { in: ["active", "on_trial"] },
        mercadoPagoPreapprovalId: { not: null },
      },
      select: { mercadoPagoPreapprovalId: true },
    });

    let updated = 0;
    let failed = 0;
    for (const sub of subs) {
      try {
        await updatePreapprovalAmount(sub.mercadoPagoPreapprovalId!, amountArs);
        updated++;
      } catch {
        failed++;
      }
    }

    return NextResponse.json({ ok: true, amountArs, rate: quote.rate, total: subs.length, updated, failed });
  } catch (error) {
    console.error("Error actualizando los cobros de Mercado Pago:", error);
    return NextResponse.json({ error: "No se pudo actualizar los cobros." }, { status: 500 });
  }
}
