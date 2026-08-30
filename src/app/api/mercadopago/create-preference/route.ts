import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPreference } from "@/lib/mercadopago";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json({ error: "Falta productId." }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.published) {
      return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
    }
    if (!product.priceArs) {
      return NextResponse.json(
        { error: "Este producto no tiene precio en ARS configurado para Mercado Pago." },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    const buyerEmail = session?.user?.email ?? null;

    const preference = await createPreference({
      productId: product.id,
      title: product.title,
      priceArs: product.priceArs,
      buyerEmail,
    });

    return NextResponse.json({ url: preference.initPoint });
  } catch (error) {
    console.error("Error creando preferencia de Mercado Pago:", error);
    return NextResponse.json({ error: "No se pudo iniciar el pago." }, { status: 500 });
  }
}
