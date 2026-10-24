import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getReadingService } from "@/lib/lecturas";
import { getUsdArsQuote, usdToArs } from "@/lib/exchange-rate";
import { validateReadingRequest } from "@/lib/lecturas-validation";
import { createReadingPreference } from "@/lib/lecturas-mp";
import { getReadingsEnabled } from "@/lib/site-settings";
import { requireAdminSession } from "@/lib/require-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Máximo de pedidos sin pagar por correo en una hora (frena abusos sin molestar a nadie real).
const MAX_PENDING_PER_HOUR = 5;

export async function POST(req: Request) {
  try {
    // Con las lecturas ocultas nadie puede pedirlas, salvo la administración (para probar el flujo).
    if (!(await getReadingsEnabled()) && !(await requireAdminSession())) {
      return NextResponse.json({ error: "Las lecturas todavía no están disponibles." }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "No pudimos leer tu pedido." }, { status: 400 });
    }

    // Campo oculto que una persona nunca completa: si viene con texto, es un programa automático.
    if (typeof body.website === "string" && body.website.trim() !== "") {
      return NextResponse.json({ error: "No pudimos procesar tu pedido." }, { status: 400 });
    }

    const result = await validateReadingRequest(body);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    const data = result.data;
    const service = getReadingService(data.service);
    if (!service) {
      return NextResponse.json({ error: "Lectura no encontrada." }, { status: 404 });
    }

    const recentPending = await prisma.readingOrder.count({
      where: {
        email: data.email,
        status: "pending",
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
    });
    if (recentPending >= MAX_PENDING_PER_HOUR) {
      return NextResponse.json(
        { error: "Ya iniciaste varios pedidos hace un momento. Espera un rato o escríbenos desde Contacto." },
        { status: 429 }
      );
    }

    // Mercado Pago cobra en pesos y no convierte: fijamos acá la cotización y el monto en ARS.
    const quote = await getUsdArsQuote();
    if (!quote) {
      return NextResponse.json(
        { error: "No pudimos obtener la cotización del dólar en este momento. Inténtalo de nuevo en unos minutos." },
        { status: 503 }
      );
    }
    const priceArs = usdToArs(service.priceUsd, quote.rate);

    const order = await prisma.readingOrder.create({
      data: {
        service: data.service,
        status: "pending",
        email: data.email,
        name: data.name,
        birthDate: data.birthDate,
        birthTime: data.birthTime,
        birthTimeMode: data.birthTimeMode,
        birthPlace: data.birthPlace,
        focus: data.focus,
        about: data.about,
        solarYear: data.solarYear,
        solarPlace: data.solarPlace,
        priceUsd: service.priceUsd,
        exchangeRate: quote.rate,
        priceArs,
      },
    });

    try {
      const preference = await createReadingPreference({
        orderId: order.id,
        title: `${service.name} — Zodiac Noir`,
        priceArs,
        payerEmail: data.email,
      });
      return NextResponse.json({ url: preference.initPoint, priceArs, rate: quote.rate });
    } catch (error) {
      console.error("No se pudo iniciar el cobro de la lectura:", error);
      await prisma.readingOrder.update({ where: { id: order.id }, data: { status: "cancelled" } });
      return NextResponse.json({ error: "No se pudo iniciar el pago. Inténtalo de nuevo en unos minutos." }, { status: 502 });
    }
  } catch (error) {
    console.error("Error en /api/lecturas/checkout:", error);
    return NextResponse.json({ error: "No se pudo procesar tu pedido." }, { status: 500 });
  }
}
