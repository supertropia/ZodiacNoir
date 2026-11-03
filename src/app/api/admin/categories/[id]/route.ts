import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";
import { parseOptionalUrl } from "@/lib/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NAME_MAX = 60;
const DESCRIPTION_MAX = 400;

// Cambia solo lo que llega: nombre, descripción, imagen, mostrar/ocultar, o mover de lugar.
// La dirección (slug) no cambia nunca, para no romper los enlaces que ya se compartieron.
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "No llegaron datos para guardar." }, { status: 400 });
    }

    const current = await prisma.storeCategory.findUnique({
      where: { id: params.id },
      include: { _count: { select: { children: true } } },
    });
    if (!current) return NextResponse.json({ error: "No se encontró la categoría." }, { status: 404 });

    const data: {
      name?: string;
      description?: string | null;
      image?: string | null;
      visible?: boolean;
      parentId?: string | null;
      sortOrder?: number;
    } = {};

    if (body.name !== undefined) {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (!name) return NextResponse.json({ error: "El nombre no puede quedar vacío." }, { status: 400 });
      if (name.length > NAME_MAX) {
        return NextResponse.json({ error: `El nombre es demasiado largo (máximo ${NAME_MAX} caracteres).` }, { status: 400 });
      }
      data.name = name;
    }

    if (body.description !== undefined) {
      const description = typeof body.description === "string" ? body.description.trim() : "";
      if (description.length > DESCRIPTION_MAX) {
        return NextResponse.json({ error: `La descripción es demasiado larga (máximo ${DESCRIPTION_MAX} caracteres).` }, { status: 400 });
      }
      data.description = description || null;
    }

    if (body.image !== undefined) {
      const image = parseOptionalUrl(body.image);
      if (!image.ok) return NextResponse.json({ error: "La dirección de la imagen no es válida." }, { status: 400 });
      data.image = image.url;
    }

    if (body.visible !== undefined) {
      if (typeof body.visible !== "boolean") {
        return NextResponse.json({ error: "Valor de visibilidad inválido." }, { status: 400 });
      }
      data.visible = body.visible;
    }

    if (body.parentId !== undefined) {
      const wanted: string | null = typeof body.parentId === "string" && body.parentId ? body.parentId : null;
      if (wanted !== current.parentId) {
        if (wanted) {
          if (wanted === current.id) {
            return NextResponse.json({ error: "Una categoría no puede estar dentro de sí misma." }, { status: 400 });
          }
          if (current._count.children > 0) {
            return NextResponse.json(
              { error: "Esta categoría tiene subcategorías adentro, así que no puede pasar a ser una subcategoría." },
              { status: 400 }
            );
          }
          const parent = await prisma.storeCategory.findUnique({ where: { id: wanted } });
          if (!parent) return NextResponse.json({ error: "No se encontró la categoría principal." }, { status: 404 });
          if (parent.parentId) {
            return NextResponse.json({ error: "Una subcategoría no puede tener otras subcategorías adentro." }, { status: 400 });
          }
        }
        const last = await prisma.storeCategory.findFirst({
          where: { parentId: wanted },
          orderBy: { sortOrder: "desc" },
          select: { sortOrder: true },
        });
        data.parentId = wanted;
        data.sortOrder = (last?.sortOrder ?? -1) + 1;
      }
    }

    const category = await prisma.storeCategory.update({ where: { id: params.id }, data });
    return NextResponse.json({ category });
  } catch (error) {
    console.error("Error actualizando categoría:", error);
    return NextResponse.json({ error: "No se pudo guardar la categoría." }, { status: 500 });
  }
}

// Borra una categoría solo si está vacía: sin subcategorías y sin productos. Así nunca queda un producto perdido.
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  try {
    const current = await prisma.storeCategory.findUnique({
      where: { id: params.id },
      include: { _count: { select: { children: true, products: true } } },
    });
    if (!current) return NextResponse.json({ error: "No se encontró la categoría." }, { status: 404 });

    if (current._count.children > 0) {
      return NextResponse.json(
        { error: "Esta categoría tiene subcategorías. Bórralas o muévelas primero." },
        { status: 409 }
      );
    }
    if (current._count.products > 0) {
      return NextResponse.json(
        {
          error: `Esta categoría tiene ${current._count.products} ${current._count.products === 1 ? "producto" : "productos"}. Cámbialos de categoría primero, o usa «Ocultar» si solo quieres que no se vea.`,
        },
        { status: 409 }
      );
    }

    await prisma.storeCategory.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error borrando categoría:", error);
    return NextResponse.json({ error: "No se pudo borrar la categoría." }, { status: 500 });
  }
}
