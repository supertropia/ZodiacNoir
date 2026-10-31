import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requireAdminSession } from "@/lib/require-admin";
import { VIDEO_ALLOWED_TYPES, VIDEO_MAX_BYTES, VIDEO_UPLOAD_PREFIX } from "@/lib/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Los videos pesan demasiado para pasar por una ruta normal de Vercel (el límite ronda los 4,5 MB),
// así que se suben directo desde el navegador a Vercel Blob. Esta ruta solo entrega el permiso (un
// "token" de un solo uso) y únicamente a la administración. El archivo nunca pasa por acá.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as HandleUploadBody | null;
  if (!body) return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });

  try {
    const result = await handleUpload({
      body,
      request,
      // Se ejecuta solo cuando el navegador pide el permiso de subida: acá se comprueba que sea la administración.
      onBeforeGenerateToken: async (pathname) => {
        const session = await requireAdminSession();
        if (!session) throw new Error("No autorizado.");
        if (!pathname.startsWith(VIDEO_UPLOAD_PREFIX)) throw new Error("Ruta de subida no permitida.");
        return {
          allowedContentTypes: [...VIDEO_ALLOWED_TYPES],
          maximumSizeInBytes: VIDEO_MAX_BYTES,
          addRandomSuffix: true,
        };
      },
      // Vercel avisa acá cuando termina la subida. No hace falta guardar nada: la dirección del video
      // la recibe el navegador y se guarda junto con el producto o la novedad.
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error preparando la subida de video:", error);
    const message = error instanceof Error && error.message === "No autorizado." ? "No autorizado." : "No se pudo preparar la subida del video.";
    return NextResponse.json({ error: message }, { status: message === "No autorizado." ? 403 : 400 });
  }
}
