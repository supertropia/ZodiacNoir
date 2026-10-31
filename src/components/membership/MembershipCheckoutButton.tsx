"use client";

import { useState } from "react";
import Link from "next/link";
import { PaypalButton } from "@/components/PaypalButton";
import { BrandLabel, MERCADOPAGO_BUTTON_CLASS } from "@/components/PaymentBrand";
import type { PaypalVisibility } from "@/lib/paypal-access";

// Aviso que se muestra debajo del botón de pago, tanto con sesión iniciada como sin ella.
function PaymentNotice({ paypal, arsEstimate }: { paypal: PaypalVisibility; arsEstimate: number | null }) {
  return (
    <div className="mt-3 space-y-2 font-ui text-xs leading-relaxed text-gold-dim">
      <p>
        <span className="text-gold-pale/90">Mercado Pago</span> cobra en pesos al dólar blue del día
        {arsEstimate ? (
          <>
            {" "}
            (hoy, aproximadamente <strong className="text-gold-pale">ARS {arsEstimate.toLocaleString("es-AR")}</strong> por mes)
          </>
        ) : null}
        . Está disponible para personas que viven en Argentina, Brasil, Chile, Colombia, México, Perú y Uruguay.
      </p>
      {paypal !== "hidden" && (
        <p>
          <span className="text-gold-pale/90">PayPal</span> cobra directamente en dólares y funciona desde
          cualquier país.
        </p>
      )}
      <p>
        Para evitar confusiones, te recomendamos usar el mismo correo en tu cuenta de Zodiac Noir y en tu cuenta
        de Mercado Pago.
      </p>
      {paypal === "hidden" && (
        <p>Estamos trabajando para poder aceptar membresías desde cualquier parte del mundo. ✦</p>
      )}
    </div>
  );
}

export function MembershipCheckoutButton({
  planId,
  isLoggedIn,
  paypal,
  arsEstimate,
  canPayWithMercadoPago,
}: {
  planId: string;
  isLoggedIn: boolean;
  paypal: PaypalVisibility;
  arsEstimate: number | null;
  /** Falso si el plan solo tiene precio en dólares y aún no hay cotización disponible. */
  canPayWithMercadoPago: boolean;
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
        <PaymentNotice paypal={paypal} arsEstimate={arsEstimate} />
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
        className={`${MERCADOPAGO_BUTTON_CLASS} inline-block py-3`}
      >
        <BrandLabel brand="mercadopago">{loading ? "Redirigiendo…" : "Pagar con Mercado Pago"}</BrandLabel>
      </button>
      {paypal !== "hidden" && (
        <div className="mt-3">
          <PaypalButton
            endpoint="/api/paypal/create-subscription"
            body={{ planId }}
            visibility={paypal}
            label="Suscribirme con PayPal"
            className="focus-ring w-full rounded-full bg-[#FFC439] px-6 py-3 text-center font-ui text-sm font-semibold text-[#111111] transition hover:bg-[#F2B72D] disabled:opacity-60"
          />
        </div>
      )}
      <PaymentNotice paypal={paypal} arsEstimate={arsEstimate} />
    </div>
  );
}
