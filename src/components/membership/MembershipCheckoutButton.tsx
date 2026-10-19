"use client";

import { useState } from "react";
import Link from "next/link";

// Aviso que se muestra debajo del botón de pago, tanto con sesión iniciada como sin ella.
function PaymentNotice() {
  return (
    <div className="mt-3 space-y-2 font-ui text-xs leading-relaxed text-gold-dim">
      <p>
        <span className="text-gold-pale/90">Pago con Mercado Pago.</span> Por ahora la membresía está
        disponible para personas que viven en Argentina, Brasil, Chile, Colombia, México, Perú y Uruguay.
      </p>
      <p>
        Para evitar confusiones, te recomendamos usar el mismo correo en tu cuenta de Zodiac Noir y en tu cuenta
        de Mercado Pago.
      </p>
      <p>
        Estamos trabajando para poder aceptar membresías desde cualquier parte del mundo. ✦
      </p>
    </div>
  );
}

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
      <div>
        <Link
          href="/ingresar?volver=/membresia"
          className="focus-ring inline-block w-full rounded-full bg-gold px-6 py-3 text-center font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright"
        >
          Iniciá sesión para suscribirte
        </Link>
        <PaymentNotice />
      </div>
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
      <PaymentNotice />
    </div>
  );
}
