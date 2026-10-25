"use client";

import { useState } from "react";
import type { PaypalVisibility } from "@/lib/paypal-access";

// Botón amarillo de PayPal. Envía el pedido al servidor, que crea el pago en PayPal y devuelve la
// dirección a la que hay que llevar a la persona para aprobarlo. En modo "preview" solo lo ve la
// administración (con una etiqueta que lo aclara) y el servidor igual exige ser administradora.
export const PAYPAL_BUTTON_CLASS =
  "focus-ring w-full rounded-full bg-[#FFC439] px-5 py-2.5 text-center font-ui text-sm font-semibold text-[#111111] transition hover:bg-[#F2B72D] disabled:opacity-60";

export function PreviewTag() {
  return (
    <span className="mt-1.5 block text-center font-ui text-[11px] text-gold-dim">
      Solo lo ves tú: el público aún no ve PayPal.
    </span>
  );
}

export function PaypalButton({
  endpoint,
  body,
  visibility,
  label = "Pagar con PayPal",
  loadingLabel = "Redirigiendo a PayPal…",
  className,
}: {
  endpoint: string;
  body: Record<string, unknown>;
  visibility: PaypalVisibility;
  label?: string;
  loadingLabel?: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (visibility === "hidden") return null;

  const onClick = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.url) throw new Error(data?.error || "No se pudo iniciar el pago con PayPal.");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar el pago con PayPal.");
      setLoading(false);
    }
  };

  return (
    <div>
      <button type="button" disabled={loading} onClick={onClick} className={className ?? PAYPAL_BUTTON_CLASS}>
        {loading ? loadingLabel : label}
      </button>
      {visibility === "preview" && <PreviewTag />}
      {error && (
        <p role="alert" className="mt-2 font-ui text-xs text-wine-bright">
          {error}
        </p>
      )}
    </div>
  );
}
