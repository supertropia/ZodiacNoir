import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPreference } from "@/lib/mercadopago";
import { getUsdArsQuote, usdToArs } from "@/lib/exchange-rate";

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

    // El precio se publica en dólares: Mercado Pago cobra en pesos y no convierte monedas, así que
    // la conversión (dólar blue + margen) se hace acá, en el servidor, justo antes de cobrar.
    // Los productos viejos que solo tienen precio en pesos siguen cobrándose con ese monto.
    let priceArs: number;
    if (product.priceUsd && product.priceUsd > 0) {
      const quote = await getUsdArsQuote();
      if (!quote) {
        return NextResponse.json(
          { error: "No pudimos obtener la cotización del dólar en este momento. Inténtalo de nuevo en unos minutos." },
          { status: 503 }
        );
      }
      priceArs = usdToArs(product.priceUsd, quote.rate);
    } else if (product.priceArs) {
      priceArs = product.priceArs;
    } else {
      return NextResponse.json(
        { error: "Este producto no tiene precio configurado para Mercado Pago." },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    const buyerEmail = session?.user?.email ?? null;

    const preference = await createPreference({
      productId: product.id,
      title: product.title,
      priceArs,
      buyerEmail,
    });

    return NextResponse.json({ url: preference.initPoint });
  } catch (error) {
    console.error("Error creando preferencia de Mercado Pago:", error);
    return NextResponse.json({ error: "No se pudo iniciar el pago." }, { status: 500 });
  }
}
