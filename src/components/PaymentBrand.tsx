"use client";

import { useState, type ReactNode } from "react";

// Estilo de los botones de pago con los colores de cada plataforma, para que se reconozcan de un vistazo.
// - Mercado Pago: amarillo de la marca con texto azul oscuro.
// - PayPal: celeste con texto azul oscuro (ver PAYPAL_BUTTON_CLASS en PaypalButton.tsx).
export const MERCADOPAGO_BUTTON_CLASS =
  "focus-ring w-full min-h-[3.75rem] rounded-full bg-[#FFE600] px-5 py-2.5 text-center font-ui text-sm font-semibold text-[#2D3277] transition hover:bg-[#F2D900] disabled:opacity-60";

export type PaymentBrandName = "paypal" | "mercadopago";

/**
 * Logo oficial de la plataforma, opcional. Se muestra si el archivo está subido en la carpeta public/pagos
 * (mercadopago.svg y paypal.svg). Si el archivo no está, no se muestra nada y el botón queda solo con su texto.
 */
function BrandLogo({ brand }: { brand: PaymentBrandName }) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/pagos/${brand}.svg`}
      alt=""
      aria-hidden="true"
      draggable={false}
      className="h-5 w-auto shrink-0"
      onError={() => setHidden(true)}
    />
  );
}

/** Contenido de un botón de pago: el logo de la plataforma (si está cargado) y el texto, alineados al centro. */
export function BrandLabel({ brand, children }: { brand: PaymentBrandName; children: ReactNode }) {
  return (
    <span className="inline-flex items-center justify-center gap-2.5">
      <BrandLogo brand={brand} />
      <span>{children}</span>
    </span>
  );
}
