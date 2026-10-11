"use client";

import { useEffect, useState } from "react";

export function ShareButtons({
  url,
  title,
  image,
}: {
  url: string;
  title: string;
  image?: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  // El menú de compartir del dispositivo solo existe en algunos navegadores (sobre todo en el celular).
  // Desde ahí la persona puede elegir Instagram, TikTok, Truth Social o cualquier otra app instalada.
  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  // Pinterest necesita una imagen para crear el pin. Se usa la portada del artículo, con dirección completa.
  let pinterestMedia = "";
  if (image) {
    try {
      pinterestMedia = `&media=${encodeURIComponent(new URL(image, url).toString())}`;
    } catch {
      pinterestMedia = "";
    }
  }

  const links = [
    {
      name: "X",
      href: `https://x.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      external: true,
      icon: (
        <path d="M18.9 3H21l-6.4 7.3L22.2 21h-6.9l-5.4-6.6L3.7 21H1.5l6.8-7.8L1 3h7l4.9 6.1L18.9 3z" />
      ),
    },
    {
      name: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      external: true,
      icon: <path d="M13.5 21v-8h2.7l.4-3.1h-3.1V8c0-.9.25-1.5 1.55-1.5H17V3.7c-.3 0-1.28-.1-2.4-.1-2.4 0-4.1 1.45-4.1 4.1v2.2H8V13h2.5v8h3z" />,
    },
    {
      name: "WhatsApp",
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      external: true,
      icon: <path d="M20.5 3.5A11 11 0 003.9 17.6L2 22l4.5-1.8A11 11 0 1020.5 3.5zM12 20a8 8 0 01-4.1-1.1l-.3-.2-3 1.2 1-2.9-.2-.3A8 8 0 1112 20zm4.6-5.8c-.3-.1-1.6-.8-1.9-.9-.2-.1-.4-.1-.6.1-.2.3-.6.9-.8 1-.1.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.5-.9-.8-1.4-1.8-1.6-2.1-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5L8.6 7.3c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s1 2.6 1.1 2.8c.1.2 2 3 4.7 4.2.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.6-.7 1.9-1.3.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.6-.3z" />,
    },
    {
      name: "Pinterest",
      href: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}${pinterestMedia}`,
      external: true,
      icon: <path d="M12 2a10 10 0 00-3.6 19.3c0-.8 0-1.8.2-2.6l1.4-6s-.4-.7-.4-1.8c0-1.7.9-2.9 2.1-2.9 1 0 1.5.7 1.5 1.6 0 1-.6 2.4-1 3.8-.2 1 .5 1.9 1.6 1.9 1.9 0 3.2-2.4 3.2-5.3 0-2.2-1.5-3.8-4.2-3.8-3 0-4.9 2.2-4.9 4.7 0 .8.3 1.4.7 1.9.2.2.2.3.1.5l-.3 1c0 .2-.2.3-.4.2-1.2-.5-1.8-1.9-1.8-3.4 0-2.5 2.1-5.6 6.4-5.6 3.4 0 5.7 2.5 5.7 5.1 0 3.5-1.9 6.1-4.7 6.1-.9 0-1.8-.5-2.1-1.1l-.6 2.3c-.2.9-.6 1.9-1 2.6A10 10 0 1012 2z" />,
    },
    {
      name: "Telegram",
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      external: true,
      // Avión de papel dibujado con línea, a juego con el resto de los íconos del sitio
      icon: (
        <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 3L3 10.5l6 2.5 2.5 6L21 3z" />
          <path d="M9 13l5-4" />
        </g>
      ),
    },
    {
      name: "correo",
      // Abre el programa de correo de la persona (Gmail, Outlook, etc.) con el mensaje ya escrito
      href: `mailto:?subject=${encodedTitle}&body=${encodedTitle}%0A%0A${encodedUrl}`,
      external: false,
      icon: (
        <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5.5" width="18" height="13" rx="2" />
          <path d="M3.5 7l8.5 6 8.5-6" />
        </g>
      ),
    },
  ];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title, url });
    } catch {
      // La persona cerró el menú sin elegir nada: no hay nada que hacer.
    }
  };

  const pillClass =
    "focus-ring flex h-9 items-center gap-1.5 rounded-full border border-gold/40 px-3 font-ui text-xs text-gold transition hover:border-gold hover:bg-gold/10";

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Compartir en redes sociales">
      {links.map((l) => (
        <a
          key={l.name}
          href={l.href}
          {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          aria-label={`Compartir por ${l.name}`}
          title={`Compartir por ${l.name}`}
          className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-gold/40 text-gold transition hover:border-gold hover:bg-gold/10"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            {l.icon}
          </svg>
        </a>
      ))}

      {canNativeShare && (
        <button
          type="button"
          onClick={nativeShare}
          title="Elegí cualquier app instalada: Instagram, TikTok, Truth Social, Mensajes…"
          className={pillClass}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="18" cy="5" r="2.5" />
            <circle cx="6" cy="12" r="2.5" />
            <circle cx="18" cy="19" r="2.5" />
            <path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4" />
          </svg>
          Compartir…
        </button>
      )}

      <button
        type="button"
        onClick={copyLink}
        title="Copiá el enlace para pegarlo en Instagram, TikTok, Truth Social o donde quieras"
        className={pillClass}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="9" y="9" width="12" height="12" rx="2" />
          <path d="M5 15V5a2 2 0 012-2h10" />
        </svg>
        {copied ? "¡Copiado!" : "Copiar enlace"}
      </button>
    </div>
  );
}
