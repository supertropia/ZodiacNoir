import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSubscription } from "@/lib/mercadopago";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const payerEmail = session?.user?.email;
    if (!payerEmail) {
      return NextResponse.json(
        { error: "Iniciá sesión con Google para suscribirte." },
        { status: 401 }
      );
    }

    const { planId } = await req.json();
    if (!planId) {
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

    const frequency = plan.interval === "año" ? 12 : 1;

    const subscription = await createSubscription({
      planId: plan.id,
      reason: `${plan.name} — Zodiac Noir`,
      priceArs: plan.priceArs,
      frequency,
      payerEmail,
    });

    return NextResponse.json({ url: subscription.initPoint });
  } catch (error) {
    console.error("Error creando suscripción de Mercado Pago:", error);
    return NextResponse.json({ error: "No se pudo iniciar la suscripción." }, { status: 500 });
  }
}
