"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Mientras el pago se está confirmando, vuelve a consultar la página cada pocos segundos
// (hasta un máximo de intentos) para que la persona vea el cambio sin tener que recargar.
export function AutoRefresh({ everyMs = 5000, maxTimes = 24 }: { everyMs?: number; maxTimes?: number }) {
  const router = useRouter();

  useEffect(() => {
    let times = 0;
    const timer = setInterval(() => {
      times += 1;
      router.refresh();
      if (times >= maxTimes) clearInterval(timer);
    }, everyMs);
    return () => clearInterval(timer);
  }, [router, everyMs, maxTimes]);

  return null;
}
