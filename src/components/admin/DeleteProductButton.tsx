"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteProductButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onDelete = async () => {
    if (!confirm(`¿Eliminar el producto "${title}"? Esta acción no se puede deshacer.`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (!res.ok) {
        // Si el servidor explica el motivo (por ejemplo, una colección que todavía tiene diseños), se lo mostramos.
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data?.error === "string" ? data.error : "No se pudo eliminar");
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error && err.message !== "No se pudo eliminar" ? err.message : "Ocurrió un error al eliminar el producto.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={onDelete} disabled={loading}
      className="focus-ring rounded-full border border-wine/60 px-4 py-2 font-ui text-xs uppercase tracking-wide text-wine-bright transition hover:bg-wine/20 disabled:opacity-50">
      {loading ? "Eliminando…" : "Eliminar"}
    </button>
  );
}
