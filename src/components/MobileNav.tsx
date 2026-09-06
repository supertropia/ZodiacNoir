"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

type NavItem = { href: string; label: string };

export function MobileNav({
  items,
  isAdmin,
  name,
  email,
  image,
}: {
  items: NavItem[];
  isAdmin: boolean;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-gold/30 text-lg text-gold-pale"
      >
        {open ? "✕" : "☰"}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-30 border-t border-gold/15 bg-noir-bg backdrop-blur">
          <nav className="mx-auto flex max-w-6xl flex-col divide-y divide-gold/10 px-5 py-2 font-ui text-sm uppercase tracking-wide text-gold-pale/90">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="py-3 transition hover:text-gold"
              >
                {item.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="py-3 text-gold transition hover:text-gold-bright"
              >
                Panel
              </Link>
            )}

            <div className="flex items-center justify-between py-3">
              {email ? (
                <>
                  <span className="flex items-center gap-2 normal-case tracking-normal text-gold-pale">
                    {image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image} alt="" className="h-7 w-7 rounded-full border border-gold/40 object-cover" />
                    )}
                    <span className="max-w-[160px] truncate">{name ?? email}</span>
                  </span>
                  <button
                    onClick={() => {
                      setOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                    className="focus-ring rounded-full border border-gold/40 px-4 py-1.5 text-xs text-gold transition hover:bg-gold/10"
                  >
                    Salir
                  </button>
                </>
              ) : (
                <Link
                  href="/ingresar"
                  onClick={() => setOpen(false)}
                  className="focus-ring w-full rounded-full border border-gold/40 px-4 py-2 text-center text-xs text-gold transition hover:bg-gold/10"
                >
                  Ingresar
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
