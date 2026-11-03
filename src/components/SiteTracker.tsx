"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

type Attribution = { utm: string; campaign: string; ref: string };

const ATTR_KEY = "zn-attr";

// Si el navegador no deja guardar datos (navegación privada), se usa la memoria de la pestaña.
let memoryAttr: Attribution | null = null;
const memorySeen = new Set<string>();

function readAttr(): Attribution | null {
  try {
    const raw = sessionStorage.getItem(ATTR_KEY);
    if (raw) return JSON.parse(raw) as Attribution;
  } catch {
    // sin almacenamiento
  }
  return memoryAttr;
}

function writeAttr(attr: Attribution) {
  memoryAttr = attr;
  try {
    sessionStorage.setItem(ATTR_KEY, JSON.stringify(attr));
  } catch {
    // sin almacenamiento
  }
}

function alreadySeen(path: string): boolean {
  const key = `zn-pv:${path}`;
  try {
    if (sessionStorage.getItem(key)) return true;
    sessionStorage.setItem(key, "1");
    return false;
  } catch {
    if (memorySeen.has(key)) return true;
    memorySeen.add(key);
    return false;
  }
}

/**
 * No muestra nada: avisa al servidor que se abrió una página, para las estadísticas del panel.
 * Averigua de dónde llegó la persona (el utm_source del link o el sitio de origen) una sola vez por
 * pestaña, y esa fuente vale para todas las páginas que abra después. Una página cuenta una sola vez
 * por pestaña (recargar no suma). No guarda datos personales.
 */
export function SiteTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/api")) return;

    const params = new URLSearchParams(window.location.search);
    const utm = (params.get("utm_source") || "").slice(0, 60);
    const campaign = (params.get("utm_campaign") || "").slice(0, 60);

    let ref = "";
    try {
      if (document.referrer) {
        const host = new URL(document.referrer).hostname.replace(/^www\./, "");
        const own = window.location.hostname.replace(/^www\./, "");
        if (host && host !== own) ref = host;
      }
    } catch {
      ref = "";
    }

    let attr = readAttr();
    let entry = false;
    // Una visita nueva empieza cuando no hay datos guardados o cuando llega con otro link de seguimiento.
    if (!attr || (utm && (utm !== attr.utm || campaign !== attr.campaign))) {
      attr = { utm, campaign, ref };
      writeAttr(attr);
      entry = true;
    }

    // La primera página de una visita siempre cuenta; las demás, una vez por pestaña.
    if (alreadySeen(pathname) && !entry) return;

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, utm: attr.utm, campaign: attr.campaign, ref: attr.ref, entry }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
