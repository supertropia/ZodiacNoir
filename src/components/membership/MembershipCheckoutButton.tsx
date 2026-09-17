"use client";

import { useState } from "react";
import Link from "next/link";

export function MembershipCheckoutButton({
  planId,
  isLoggedIn,
}: {
  planId: string;
  isLoggedIn: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isLoggedIn) {
    return (
      <Link
        href="/ingresar"
        className="focus-ring inline-block w-full rounded-full bg-gold px-6 py-3 text-center font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright"
      >
        Iniciá sesión para suscribirte
      </Link>
    );
  }

  const handleClick = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/mercadopago/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo iniciar la suscripción.");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar la suscripción.");
      setLoading(false);
    }
  };

  return (
    <div>
      {error && <p className="mb-2 font-ui text-xs text-wine-bright">{error}</p>}
      <button
        type="button"
        disabled={loading}
        onClick={handleClick}
        className="focus-ring inline-block w-full rounded-full bg-gold px-6 py-3 text-center font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright disabled:opacity-60"
      >
        {loading ? "Redirigiendo…" : "Sumarme con Mercado Pago"}
      </button>
    </div>
  );
}
