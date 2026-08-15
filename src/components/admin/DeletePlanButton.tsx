"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeletePlanButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onDelete = async () => {
    if (!confirm(`¿Eliminar el plan "${name}"? Esta acción no se puede deshacer.`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/plans/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("No se pudo eliminar");
      router.refresh();
    } catch {
      alert("Ocurrió un error al eliminar el plan.");
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
