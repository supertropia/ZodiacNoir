"use client";

import { useState } from "react";

export function CopyProductLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const url = `${window.location.origin}/tienda?producto=${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copiá este link:", url);
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="focus-ring rounded-full border border-gold/40 px-4 py-2 font-ui text-xs uppercase tracking-wide text-gold transition hover:border-gold hover:bg-gold/10"
    >
      {copied ? "¡Copiado!" : "Copiar link"}
    </button>
  );
}
