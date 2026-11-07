import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requireAdminSession } from "@/lib/require-admin";
import { IMPORT_ALLOWED_TYPES, IMPORT_MAX_BYTES, IMPORT_UPLOAD_PREFIX, type ImportUploadKind } from "@/lib/import-limits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// El importador sube imágenes, PDF y videos directo desde el navegador a Vercel Blob (por una ruta normal de
// Vercel no entran archivos de más de ~4,5 MB). Esta ruta solo entrega el permiso de subida, y únicamente a la
// administración. El archivo nunca pasa por acá.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as HandleUploadBody | null;
  if (!body) return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const session = await requireAdminSession();
        if (!session) throw new Error("No autorizado.");
        if (!pathname.startsWith(IMPORT_UPLOAD_PREFIX)) throw new Error("Ruta de subida no permitida.");
        const kind: ImportUploadKind = clientPayload === "pdf" ? "pdf" : clientPayload === "video" ? "video" : "image";
        return {
          allowedContentTypes: [...IMPORT_ALLOWED_TYPES[kind]],
          maximumSizeInBytes: IMPORT_MAX_BYTES[kind],
          addRandomSuffix: true,
        };
      },
      // Vercel avisa acá cuando termina la subida. No hace falta guardar nada: el navegador recibe la dirección
      // del archivo y la envía al crear el borrador.
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error preparando la subida del importador:", error);
    const unauthorized = error instanceof Error && error.message === "No autorizado.";
    return NextResponse.json(
      { error: unauthorized ? "No autorizado." : "No se pudo preparar la subida." },
      { status: unauthorized ? 403 : 400 }
    );
  }
}
