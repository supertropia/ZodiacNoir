import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cancelPreapproval } from "@/lib/mercadopago";

export const dynamic = "force-dynamic";

const ACTIVE_STATUSES = ["active", "on_trial"];

export async function POST() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "Iniciá sesión para gestionar tu membresía." }, { status: 401 });
  }

  const subscription = await prisma.subscription.findUnique({ where: { email } });
  if (!subscription || !ACTIVE_STATUSES.includes(subscription.status)) {
    return NextResponse.json({ error: "No tenés una membresía activa." }, { status: 400 });
  }

  if (subscription.provider !== "mercadopago" || !subscription.mercadoPagoPreapprovalId) {
    return NextResponse.json(
      {
        error:
          "Tu membresía está gestionada por Lemon Squeezy. Cancelala desde el link del mail de confirmación de tu suscripción, o escribinos desde /contacto.",
      },
      { status: 400 }
    );
  }

  try {
    await cancelPreapproval(subscription.mercadoPagoPreapprovalId);
    await prisma.subscription.update({
      where: { email },
      data: { status: "cancelled", endsAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error cancelando membresía:", error);
    return NextResponse.json(
      { error: "No se pudo cancelar la membresía. Intentá de nuevo en unos minutos." },
      { status: 500 }
    );
  }
}
