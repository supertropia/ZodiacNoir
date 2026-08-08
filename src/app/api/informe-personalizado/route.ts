import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const { name, email, whatsapp, birthDate, birthTime, birthPlace, message } = await req.json();

    if (!name || !email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Nombre y email válido son obligatorios." }, { status: 400 });
    }

    await prisma.personalReportRequest.create({
      data: {
        name,
        email,
        whatsapp: whatsapp || null,
        birthDate: birthDate || null,
        birthTime: birthTime || null,
        birthPlace: birthPlace || null,
        message: message || null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error guardando pedido de informe personalizado:", error);
    return NextResponse.json({ error: "No se pudo enviar el formulario." }, { status: 500 });
  }
}
