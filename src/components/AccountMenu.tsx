"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

type AccountMenuProps = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  isAdmin?: boolean;
};

export function AccountMenu({ name, email, image, isAdmin = false }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // El desplegable se cierra al hacer clic afuera o al pulsar Escape.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!email) {
    return (
      <Link
        href="/ingresar"
        className="focus-ring rounded-full border border-gold/40 px-3 py-1.5 font-ui text-xs uppercase tracking-wide text-gold transition hover:border-gold hover:bg-gold/10 sm:px-4 sm:py-2"
      >
        Ingresar
      </Link>
    );
  }

  const label = name ?? email;
  const initial = label.trim().charAt(0).toUpperCase() || "?";
  const itemClass =
    "block w-full px-4 py-3 text-left font-ui text-sm uppercase tracking-wide text-gold-pale transition hover:bg-gold/10 hover:text-gold";

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="account-menu-panel"
        aria-label="Abrir el menú de tu cuenta"
        className="focus-ring flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-gold/40 transition hover:border-gold"
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="font-display text-sm text-gold">{initial}</span>
        )}
      </button>

      {open && (
        <div
          id="account-menu-panel"
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-gold/30 bg-noir-surface shadow-2xl"
        >
          <div className="border-b border-gold/15 px-4 py-3">
            <p className="truncate font-ui text-sm text-gold-pale">{label}</p>
            {name && <p className="truncate font-ui text-xs text-gold-dim">{email}</p>}
          </div>

          <Link href="/mi-cuenta" onClick={() => setOpen(false)} className={itemClass}>
            Mi cuenta
          </Link>

          {isAdmin && (
            <Link href="/admin" onClick={() => setOpen(false)} className={`${itemClass} text-gold`}>
              Panel de administración
            </Link>
          )}

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              signOut({ callbackUrl: "/" });
            }}
            className={`${itemClass} border-t border-gold/10`}
          >
            Salir
          </button>
        </div>
      )}
    </div>
  );
}
