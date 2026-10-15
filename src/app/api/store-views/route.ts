import { NextResponse } from "next/server";
import { prisma, safeQuery } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";
import { isLikelyBot } from "@/lib/views";
import { productTarget, recordStoreView, STORE_PAGE_TARGET } from "@/lib/store-views";

export const dynamic = "force-dynamic";

/**
 * Registra una visita de la tienda: la página /tienda ({ kind: "page" }) o la ficha de un libro
 * ({ kind: "product", slug }). La llama el navegador de la visitante (StoreViewTracker). No cuenta
 * tus propias visitas como administradora, ni robots, ni libros que no existen o no están publicados.
 * Nunca devuelve un error a la visitante: si algo falla, simplemente no se cuenta.
 */
export async function POST(req: Request) {
  try {
    if (isLikelyBot(req.headers.get("user-agent"))) {
      return NextResponse.json({ counted: false });
    }

    const body = (await req.json().catch(() => null)) as { kind?: unknown; slug?: unknown } | null;
    const kind = body?.kind;
    if (kind !== "page" && kind !== "product") return NextResponse.json({ counted: false });

    if (await requireAdminSession()) {
      return NextResponse.json({ counted: false });
    }

    if (kind === "page") {
      await recordStoreView(STORE_PAGE_TARGET);
      return NextResponse.json({ counted: true });
    }

    const slug = typeof body?.slug === "string" ? body.slug.slice(0, 200) : "";
    if (!slug) return NextResponse.json({ counted: false });

    const product = await safeQuery(() =>
      prisma.product.findUnique({ where: { slug }, select: { id: true, published: true } })
    );
    if (!product || !product.published) return NextResponse.json({ counted: false });

    await recordStoreView(productTarget(product.id));
    return NextResponse.json({ counted: true });
  } catch (error) {
    console.error("Error registrando visita de la tienda:", error);
    return NextResponse.json({ counted: false });
  }
}
