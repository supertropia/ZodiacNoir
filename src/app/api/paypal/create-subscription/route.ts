import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPaypalBillingPlan, createPaypalSubscription, getSiteUrl, isPaypalConfigured } from "@/lib/paypal";
import { canUsePaypal } from "@/lib/paypal-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTIVE_STATUSES = ["active", "on_trial"];

// Inicia la suscripción mensual (membresía) con PayPal, cobrada en dólares.
export async function POST(req: Request) {
  try {
    if (!(await canUsePaypal())) {
      return NextResponse.json({ error: "El pago con PayPal todavía no está disponible." }, { status: 403 });
    }
    if (!isPaypalConfigured()) {
      return NextResponse.json(
        { error: "Falta configurar las credenciales de PayPal en Vercel (PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET)." },
        { status: 503 }
      );
    }

    const session = await getServerSession(authOptions);
    const payerEmail = session?.user?.email;
    if (!payerEmail) {
      return NextResponse.json({ error: "Inicia sesión para suscribirte." }, { status: 401 });
    }

    const { planId } = await req.json().catch(() => ({}));
    if (!planId || typeof planId !== "string") {
      return NextResponse.json({ error: "Falta planId." }, { status: 400 });
    }

    const plan = await prisma.membershipPlan.findUnique({ where: { id: planId } });
    if (!plan) return NextResponse.json({ error: "Plan no encontrado." }, { status: 404 });
    if (!plan.priceUsd || plan.priceUsd <= 0) {
      return NextResponse.json({ error: "Este plan no tiene precio en dólares configurado." }, { status: 400 });
    }

    // Si ya es miembro, no creamos otra suscripción (evita cobrarle dos veces).
    const existing = await prisma.subscription.findUnique({ where: { email: payerEmail } });
    if (existing && ACTIVE_STATUSES.includes(existing.status)) {
      return NextResponse.json({ error: "Ya eres miembro de Zodiac Noir Plus." }, { status: 400 });
    }

    // El plan de facturación de PayPal se crea la primera vez y se reutiliza mientras el precio no cambie.
    let paypalPlanId = plan.paypalPlanId;
    if (!paypalPlanId || plan.paypalPlanUsd !== plan.priceUsd) {
      paypalPlanId = await createPaypalBillingPlan({
        name: plan.name,
        amountUsd: plan.priceUsd,
        interval: plan.interval === "año" ? "YEAR" : "MONTH",
      });
      await prisma.membershipPlan.update({
        where: { id: plan.id },
        data: { paypalPlanId, paypalPlanUsd: plan.priceUsd },
      });
    }

    const siteUrl = getSiteUrl();
    const subscription = await createPaypalSubscription({
      planId: paypalPlanId,
      customId: plan.id,
      payerEmail,
      returnUrl: `${siteUrl}/api/paypal/return?kind=subscription&ref=${encodeURIComponent(plan.id)}`,
      cancelUrl: `${siteUrl}/membresia?pago=cancelado`,
    });

    // Guardamos ya la suscripción como "pending", asociada al email de la cuenta de la web.
    await prisma.subscription.upsert({
      where: { email: payerEmail },
      update: {
        provider: "paypal",
        status: "pending",
        paypalSubscriptionId: subscription.id,
        mercadoPagoPreapprovalId: null,
        planId: plan.id,
        renewsAt: null,
        endsAt: null,
      },
      create: {
        email: payerEmail,
        provider: "paypal",
        status: "pending",
        paypalSubscriptionId: subscription.id,
        planId: plan.id,
      },
    });

    return NextResponse.json({ url: subscription.approveUrl });
  } catch (error) {
    console.error("Error creando la suscripción de PayPal:", error);
    return NextResponse.json({ error: "No se pudo iniciar la suscripción con PayPal." }, { status: 502 });
  }
}
