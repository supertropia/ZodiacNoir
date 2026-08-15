import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const plans = await prisma.membershipPlan.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ plans });
}

export async function POST(req: Request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  try {
    const body = await req.json();
    const { slug, name, description, priceLabel, interval, lemonVariantId, featured, benefits } = body;

    if (!slug || !name || !description || !priceLabel || !interval || !lemonVariantId) {
      return NextResponse.json({ error: "Faltan campos obligatorios." }, { status: 400 });
    }

    const existing = await prisma.membershipPlan.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "Ya existe un plan con ese slug." }, { status: 409 });
    }

    const plan = await prisma.membershipPlan.create({
      data: { slug, name, description, priceLabel, interval, lemonVariantId, featured: Boolean(featured), benefits: benefits || "" },
    });

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    console.error("Error creando plan:", error);
    return NextResponse.json({ error: "No se pudo crear el plan." }, { status: 500 });
  }
}
