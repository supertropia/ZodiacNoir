// Lectura de un archivo Word (.docx) para el importador. Corre en el navegador: el Word no se envía al servidor
// (así no hay límite de peso aunque tenga muchas imágenes). Las imágenes incrustadas quedan, por ahora, dentro del
// HTML como datos («data:image/png;base64,…»); recién al crear los borradores se suben a Vercel Blob.

import mammoth from "mammoth";
import type { ReadDoc } from "@/lib/import-plan";

const SUPPORTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
const SKIPPED_SRC = "about:blank#sin-soporte";

export async function readDocx(path: string, data: ArrayBuffer): Promise<ReadDoc> {
  const warnings: string[] = [];
  let skipped = 0;

  const result = await mammoth.convertToHtml(
    { arrayBuffer: data },
    {
      convertImage: mammoth.images.imgElement(async (image) => {
        if (!SUPPORTED_IMAGE_TYPES.includes(image.contentType)) {
          skipped += 1;
          return { src: SKIPPED_SRC };
        }
        const base64 = await image.read("base64");
        const alt = (image as unknown as { altText?: string }).altText ?? "";
        return { src: `data:${image.contentType};base64,${base64}`, alt };
      }),
    }
  );

  let html = result.value;
  if (skipped > 0) {
    html = html.replace(new RegExp(`<img[^>]*src="${SKIPPED_SRC.replace(/[.#]/g, "\\$&")}"[^>]*>`, "g"), "");
    warnings.push(
      `${skipped} imagen${skipped === 1 ? "" : "es"} del Word no se pudo${skipped === 1 ? "" : "n"} usar porque no están en formato PNG, JPG, GIF ni WEBP. Súbelas como archivos sueltos.`
    );
  }

  return { path, html, warnings };
}
