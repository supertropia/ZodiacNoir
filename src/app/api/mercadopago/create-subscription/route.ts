import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSubscription } from "@/lib/mercadopago";

export const dynamic = "force-dynamic";

const ACTIVE_STATUSES = ["active", "on_trial"];

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const payerEmail = session?.user?.email;
    if (!payerEmail) {
      return NextResponse.json({ error: "Iniciá sesión para suscribirte." }, { status: 401 });
    }

    const { planId } = await req.json();
    if (!planId || typeof planId !== "string") {
      return NextResponse.json({ error: "Falta planId." }, { status: 400 });
    }

    const plan = await prisma.membershipPlan.findUnique({ where: { id: planId } });
    if (!plan) {
      return NextResponse.json({ error: "Plan no encontrado." }, { status: 404 });
    }
    if (!plan.priceArs) {
      return NextResponse.json(
        { error: "Este plan no tiene precio en ARS configurado para Mercado Pago." },
        { status: 400 }
      );
    }

    // Si ya es miembro, no creamos otra suscripción (evita cobrarle dos veces).
    const existing = await prisma.subscription.findUnique({ where: { email: payerEmail } });
    if (existing && ACTIVE_STATUSES.includes(existing.status)) {
      return NextResponse.json({ error: "Ya sos miembro de Zodiac Noir Plus." }, { status: 400 });
    }

    const frequency = plan.interval === "año" ? 12 : 1;

    const subscription = await createSubscription({
      planId: plan.id,
      reason: `${plan.name} — Zodiac Noir`,
      priceArs: plan.priceArs,
      frequency,
      payerEmail,
    });

    // CLAVE: guardamos YA la suscripción como "pending", asociada al email con el que la
    // persona inició sesión en la web y al ID que le asignó Mercado Pago. Así, cuando
    // Mercado Pago avise (o cuando la web le consulte el estado), sabemos exactamente a
    // qué cuenta pertenece, aunque la persona pague con otra cuenta o con otro email.
    await prisma.subscription.upsert({
      where: { email: payerEmail },
      update: {
        provider: "mercadopago",
        status: "pending",
        mercadoPagoPreapprovalId: String(subscription.id),
        planId: plan.id,
        renewsAt: null,
        endsAt: null,
      },
      create: {
        email: payerEmail,
        provider: "mercadopago",
        status: "pending",
        mercadoPagoPreapprovalId: String(subscription.id),
        planId: plan.id,
      },
    });

    return NextResponse.json({ url: subscription.initPoint });
  } catch (error) {
    console.error("Error creando suscripción de Mercado Pago:", error);
    return NextResponse.json({ error: "No se pudo iniciar la suscripción." }, { status: 500 });
  }
}
