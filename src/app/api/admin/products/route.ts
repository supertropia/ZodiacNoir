import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ products });
}

export async function POST(req: Request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  try {
    const body = await req.json();
    const { slug, title, description, priceLabel, lemonVariantId, coverImage, fileUrl, published } = body;

    if (!slug || !title || !description || !priceLabel || !lemonVariantId) {
      return NextResponse.json({ error: "Faltan campos obligatorios." }, { status: 400 });
    }

    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "Ya existe un producto con ese slug." }, { status: 409 });
    }

    const product = await prisma.product.create({
      data: {
        slug, title, description, priceLabel, lemonVariantId,
        coverImage: coverImage || null,
        fileUrl: fileUrl || null,
        published: Boolean(published),
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("Error creando producto:", error);
    return NextResponse.json({ error: "No se pudo crear el producto." }, { status: 500 });
  }
}
