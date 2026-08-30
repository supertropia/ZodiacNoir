"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

type AccountMenuProps = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export function AccountMenu({ name, email, image }: AccountMenuProps) {
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

  return (
    <div className="flex items-center gap-2">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={name ?? email}
          className="h-7 w-7 rounded-full border border-gold/40 object-cover"
        />
      ) : null}
      <span className="hidden max-w-[120px] truncate font-ui text-xs text-gold-pale sm:inline">
        {name ?? email}
      </span>
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="focus-ring rounded-full border border-gold/40 px-3 py-1.5 font-ui text-xs uppercase tracking-wide text-gold transition hover:border-gold hover:bg-gold/10 sm:px-4 sm:py-2"
      >
        Salir
      </button>
    </div>
  );
}
