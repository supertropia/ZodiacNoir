import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateNatalChartPdf } from "@/lib/natal-chart-pdf";
import type { NatalChartResult } from "@/lib/astrology";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name, birthDate, birthTime, birthPlace, latitude, longitude, chart } = body as {
      email: string;
      name?: string;
      birthDate: string;
      birthTime: string;
      birthPlace: string;
      latitude: number;
      longitude: number;
      chart: NatalChartResult;
    };

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Ingresá un email válido." }, { status: 400 });
    }
    if (!birthDate || !birthTime || !birthPlace || !chart) {
      return NextResponse.json({ error: "Faltan datos de la carta natal." }, { status: 400 });
    }

    // Guarda el lead y suma a la lista de newsletter (si todavía no estaba suscripto).
    await Promise.all([
      prisma.natalChartLead.create({
        data: {
          email,
          name: name || null,
          birthDate,
          birthTime,
          birthPlace,
          latitude,
          longitude,
          chartSummary: JSON.stringify(chart),
        },
      }),
      prisma.subscriber.upsert({ where: { email }, update: {}, create: { email } }),
    ]);

    const pdfBuffer = await generateNatalChartPdf({ name, birthDate, birthTime, birthPlace, chart });

<<<<<<< HEAD
    return new NextResponse(new Uint8Array(pdfBuffer), {
=======
    return new NextResponse(pdfBuffer, {
>>>>>>> 4619b5ff56aed1e04562b763bca19836479f5bea
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="carta-natal-zodiac-noir.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generando PDF de carta natal:", error);
    return NextResponse.json({ error: "No pudimos generar el PDF. Intentá de nuevo." }, { status: 500 });
  }
}
