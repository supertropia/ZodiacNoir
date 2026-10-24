import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Marca una lectura como entregada (o deshace la marca) sin subir archivos ni enviar correos:
// la lectura se envía por fuera, desde el correo de quien la escribe.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  try {
    const body = await req.json().catch(() => ({}));
    const undo = body?.undo === true;

    const order = await prisma.readingOrder.findUnique({ where: { id: params.id } });
    if (!order) return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });

    if (undo) {
      if (order.status !== "delivered") {
        return NextResponse.json({ error: "Este pedido no está marcado como entregado." }, { status: 400 });
      }
      await prisma.readingOrder.update({
        where: { id: order.id },
        data: { status: "paid", deliveredAt: null },
      });
      return NextResponse.json({ ok: true, status: "paid" });
    }

    if (order.status !== "paid") {
      return NextResponse.json({ error: "Solo se puede marcar como entregado un pedido pagado." }, { status: 400 });
    }
    await prisma.readingOrder.update({
      where: { id: order.id },
      data: { status: "delivered", deliveredAt: new Date() },
    });
    return NextResponse.json({ ok: true, status: "delivered" });
  } catch (error) {
    console.error("Error actualizando el estado de una lectura:", error);
    return NextResponse.json({ error: "No se pudo actualizar el pedido." }, { status: 500 });
  }
}
