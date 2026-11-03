import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Sube o baja una categoría un lugar dentro de su grupo (las principales entre sí, o las subcategorías de una misma categoría).
export async function POST(req: Request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  try {
    const body = await req.json().catch(() => null);
    const id = typeof body?.id === "string" ? body.id : "";
    const direction = body?.direction;
    if (!id || (direction !== "up" && direction !== "down")) {
      return NextResponse.json({ error: "Faltan datos para mover la categoría." }, { status: 400 });
    }

    const current = await prisma.storeCategory.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: "No se encontró la categoría." }, { status: 404 });

    const siblings = await prisma.storeCategory.findMany({
      where: { parentId: current.parentId },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true },
    });

    const index = siblings.findIndex((s) => s.id === id);
    const target = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || target < 0 || target >= siblings.length) {
      return NextResponse.json({ ok: true });
    }

    // Se renumera todo el grupo (0, 1, 2…) para que nunca queden dos categorías con el mismo número.
    const ids = siblings.map((s) => s.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    await prisma.$transaction(
      ids.map((siblingId, order) => prisma.storeCategory.update({ where: { id: siblingId }, data: { sortOrder: order } }))
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error moviendo categoría:", error);
    return NextResponse.json({ error: "No se pudo mover la categoría." }, { status: 500 });
  }
}
