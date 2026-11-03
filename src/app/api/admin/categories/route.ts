import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";
import { slugify } from "@/lib/slugify";
import { parseOptionalUrl } from "@/lib/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NAME_MAX = 60;
const DESCRIPTION_MAX = 400;

/** Una dirección que no esté usada: si «calendarios» ya existe, prueba «calendarios-2», «calendarios-3»… */
async function uniqueSlug(base: string): Promise<string> {
  const root = base || "categoria";
  let candidate = root;
  let n = 2;
  while (await prisma.storeCategory.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${root}-${n++}`;
  }
  return candidate;
}

// Crea una categoría o una subcategoría (si llega parentId). Solo la administración puede hacerlo.
export async function POST(req: Request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  try {
    const body = await req.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!name) return NextResponse.json({ error: "Escribe el nombre de la categoría." }, { status: 400 });
    if (name.length > NAME_MAX) {
      return NextResponse.json({ error: `El nombre es demasiado largo (máximo ${NAME_MAX} caracteres).` }, { status: 400 });
    }

    const description = typeof body?.description === "string" ? body.description.trim() : "";
    if (description.length > DESCRIPTION_MAX) {
      return NextResponse.json({ error: `La descripción es demasiado larga (máximo ${DESCRIPTION_MAX} caracteres).` }, { status: 400 });
    }

    const image = parseOptionalUrl(body?.image);
    if (!image.ok) return NextResponse.json({ error: "La dirección de la imagen no es válida." }, { status: 400 });

    // Solo hay dos niveles: una subcategoría debe colgar de una categoría principal.
    let parentId: string | null = null;
    if (typeof body?.parentId === "string" && body.parentId) {
      const parent = await prisma.storeCategory.findUnique({ where: { id: body.parentId } });
      if (!parent) return NextResponse.json({ error: "No se encontró la categoría principal." }, { status: 404 });
      if (parent.parentId) {
        return NextResponse.json({ error: "Una subcategoría no puede tener otras subcategorías adentro." }, { status: 400 });
      }
      parentId = parent.id;
    }

    // Va al final de su grupo.
    const last = await prisma.storeCategory.findFirst({
      where: { parentId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const category = await prisma.storeCategory.create({
      data: {
        slug: await uniqueSlug(slugify(name)),
        name,
        description: description || null,
        image: image.url,
        parentId,
        sortOrder: (last?.sortOrder ?? -1) + 1,
        visible: body?.visible === false ? false : true,
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("Error creando categoría:", error);
    return NextResponse.json({ error: "No se pudo crear la categoría." }, { status: 500 });
  }
}
