import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const plan = await prisma.membershipPlan.findUnique({ where: { id: params.id } });
  if (!plan) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json({ plan });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  try {
    const body = await req.json();
    const { slug, name, description, priceLabel, interval, lemonVariantId, featured, benefits } = body;

    if (!slug || !name || !description || !priceLabel || !interval || !lemonVariantId) {
      return NextResponse.json({ error: "Faltan campos obligatorios." }, { status: 400 });
    }

    const current = await prisma.membershipPlan.findUnique({ where: { id: params.id } });
    if (!current) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    if (slug !== current.slug) {
      const clashing = await prisma.membershipPlan.findUnique({ where: { slug } });
      if (clashing) return NextResponse.json({ error: "Ya existe otro plan con ese slug." }, { status: 409 });
    }

    const plan = await prisma.membershipPlan.update({
      where: { id: params.id },
      data: { slug, name, description, priceLabel, interval, lemonVariantId, featured: Boolean(featured), benefits: benefits || "" },
    });

    return NextResponse.json({ plan });
  } catch (error) {
    console.error("Error actualizando plan:", error);
    return NextResponse.json({ error: "No se pudo actualizar el plan." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  try {
    await prisma.membershipPlan.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error eliminando plan:", error);
    return NextResponse.json({ error: "No se pudo eliminar el plan." }, { status: 500 });
  }
}
