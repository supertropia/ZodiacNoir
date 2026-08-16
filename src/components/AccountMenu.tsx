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
        className="focus-ring hidden rounded-full border border-gold/40 px-4 py-2 font-ui text-xs uppercase tracking-wide text-gold transition hover:border-gold hover:bg-gold/10 sm:block"
      >
        Ingresar
      </Link>
    );
  }

  return (
    <div className="hidden items-center gap-2 sm:flex">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={name ?? email}
          className="h-7 w-7 rounded-full border border-gold/40 object-cover"
        />
      ) : null}
      <span className="max-w-[120px] truncate font-ui text-xs text-gold-pale">
        {name ?? email}
      </span>
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="focus-ring rounded-full border border-gold/40 px-4 py-2 font-ui text-xs uppercase tracking-wide text-gold transition hover:border-gold hover:bg-gold/10"
      >
        Salir
      </button>
    </div>
  );
}
