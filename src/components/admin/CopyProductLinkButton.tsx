"use client";

import { TrackedLinkMenu } from "@/components/admin/TrackedLinkMenu";

/** Copiar el link de un producto, con la opción de marcar dónde lo vas a compartir (YouTube, Instagram…). */
export function CopyProductLinkButton({ slug }: { slug: string }) {
  return <TrackedLinkMenu path={`/tienda/${slug}`} />;
}
