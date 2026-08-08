import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/require-admin";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: Request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        error:
          "La subida de imágenes no está configurada todavía. Activá Vercel Blob en el panel de tu proyecto (Storage → Create Database → Blob) y conectalo — la variable BLOB_READ_WRITE_TOKEN se agrega sola. Mientras tanto, podés pegar la URL de una imagen ya alojada en otro lugar.",
      },
      { status: 501 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No se recibió ningún archivo." }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "El archivo debe ser una imagen." }, { status: 400 });
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "La imagen no puede superar los 5 MB." }, { status: 400 });
    }

    const { put } = await import("@vercel/blob");
    const filename = `zodiac-noir/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
    const blob = await put(filename, file, { access: "public" });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Error subiendo imagen:", error);
    return NextResponse.json({ error: "No se pudo subir la imagen." }, { status: 500 });
  }
}
