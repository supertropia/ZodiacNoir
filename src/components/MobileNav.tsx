"use client";

import { useState } from "react";
import Link from "next/link";

type NavItem = { href: string; label: string };

export function MobileNav({ items, isAdmin }: { items: NavItem[]; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
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
        <div className="absolute inset-x-0 top-full border-t border-gold/15 bg-noir-bg/95 backdrop-blur">
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
          </nav>
        </div>
      )}
    </div>
  );
}
