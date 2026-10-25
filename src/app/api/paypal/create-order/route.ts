import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPaypalOrder, getSiteUrl, isPaypalConfigured } from "@/lib/paypal";
import { canUsePaypal } from "@/lib/paypal-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Inicia el pago de un PDF de la tienda con PayPal (en dólares).
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

    const { productId } = await req.json().catch(() => ({}));
    if (!productId || typeof productId !== "string") {
      return NextResponse.json({ error: "Falta productId." }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.published) {
      return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
    }
    if (!product.priceUsd || product.priceUsd <= 0) {
      return NextResponse.json({ error: "Este producto no tiene precio en dólares configurado." }, { status: 400 });
    }

    const siteUrl = getSiteUrl();
    const order = await createPaypalOrder({
      amountUsd: product.priceUsd,
      description: `${product.title} — Zodiac Noir`,
      customId: `product:${product.id}`,
      returnUrl: `${siteUrl}/api/paypal/return?kind=product&ref=${encodeURIComponent(product.id)}`,
      cancelUrl: `${siteUrl}/tienda?compra=error`,
    });

    return NextResponse.json({ url: order.approveUrl });
  } catch (error) {
    console.error("Error creando la orden de PayPal:", error);
    return NextResponse.json({ error: "No se pudo iniciar el pago con PayPal." }, { status: 502 });
  }
}
