"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function TogglePublishProductButton({ id, title, published }: { id: string; title: string; published: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onToggle = async () => {
    const message = published
      ? `¿Despublicar "${title}"? Dejará de verse en la tienda y no se podrá comprar, pero no se borra: podés volver a publicarlo cuando quieras.`
      : `¿Publicar "${title}"? Se va a ver en la tienda de inmediato.`;
    if (!confirm(message)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !published }),
      });
      if (!res.ok) throw new Error("No se pudo cambiar el estado");
      router.refresh();
    } catch {
      alert("Ocurrió un error al cambiar el estado del producto.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={onToggle} disabled={loading}
      className="focus-ring rounded-full border border-gold/40 px-4 py-2 font-ui text-xs uppercase tracking-wide text-gold transition hover:border-gold hover:bg-gold/10 disabled:opacity-50">
      {loading ? "Guardando…" : published ? "Despublicar" : "Publicar"}
    </button>
  );
}
