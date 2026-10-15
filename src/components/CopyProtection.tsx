"use client";

import { useEffect } from "react";

/**
 * Dificulta copiar texto, imprimir y sacar capturas en todo el sitio.
 * Se desactiva por completo (allowCopy) para la cuenta de administración.
 *
 * Importante: en una web no existe forma de bloquear de verdad una captura de pantalla
 * (el sistema operativo la hace por fuera del navegador). Esto sirve para frenar el uso casual.
 */
const CSS = `
html:not([data-copy-ok]) body { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
html:not([data-copy-ok]) input, html:not([data-copy-ok]) textarea, html:not([data-copy-ok]) [contenteditable="true"] { -webkit-user-select: text; user-select: text; }
html:not([data-copy-ok]) img { -webkit-user-drag: none; user-drag: none; }
html[data-zn-hide] body { filter: blur(24px); }
@media print { html:not([data-copy-ok]) { display: none !important; } }
`;

function isEditable(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null;
  if (!el || !el.tagName) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable === true;
}

export function CopyProtection({ allowCopy }: { allowCopy: boolean }) {
  useEffect(() => {
    const root = document.documentElement;
    if (allowCopy) {
      root.setAttribute("data-copy-ok", "1");
      return;
    }
    root.removeAttribute("data-copy-ok");

    const block = (e: Event) => {
      if (isEditable(e.target)) return;
      e.preventDefault();
    };
    const onCopy = (e: ClipboardEvent) => {
      if (isEditable(e.target)) return;
      e.preventDefault();
      e.clipboardData?.setData("text/plain", "");
    };
    const clearClipboard = () => {
      try {
        navigator.clipboard?.writeText("").catch(() => {});
      } catch {
        /* sin permiso para el portapapeles: no pasa nada */
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const mod = e.ctrlKey || e.metaKey;
      if (key === "printscreen") {
        e.preventDefault();
        clearClipboard();
        return;
      }
      if (mod && ["c", "x", "a", "s", "p", "u"].includes(key) && !isEditable(e.target)) {
        e.preventDefault();
        return;
      }
      if (key === "f12" || (mod && e.shiftKey && ["i", "j", "c"].includes(key))) {
        e.preventDefault();
        return;
      }
      // Capturas de Mac (Cmd+Shift+3/4/5) y de Windows (Win+Shift+S): se oculta el contenido al instante.
      if (e.metaKey && e.shiftKey) root.setAttribute("data-zn-hide", "1");
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        clearClipboard();
        root.setAttribute("data-zn-hide", "1");
        window.setTimeout(() => root.removeAttribute("data-zn-hide"), 1200);
      } else if (e.key === "Meta" || e.key === "Shift") {
        window.setTimeout(() => root.removeAttribute("data-zn-hide"), 1200);
      }
    };
    // Al perder el foco (herramientas de recorte, grabadores de pantalla) el contenido se difumina.
    const hide = () => root.setAttribute("data-zn-hide", "1");
    const show = () => root.removeAttribute("data-zn-hide");
    const onVisibility = () => (document.hidden ? hide() : show());

    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCopy);
    document.addEventListener("contextmenu", block);
    document.addEventListener("dragstart", block);
    document.addEventListener("selectstart", block);
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("keyup", onKeyUp, true);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", hide);
    window.addEventListener("focus", show);

    return () => {
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCopy);
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("dragstart", block);
      document.removeEventListener("selectstart", block);
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("keyup", onKeyUp, true);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", hide);
      window.removeEventListener("focus", show);
      show();
    };
  }, [allowCopy]);

  // El CSS se envía ya en el HTML inicial, así que la protección rige desde el primer instante.
  if (allowCopy) return null;
  return <style dangerouslySetInnerHTML={{ __html: CSS }} />;
}
