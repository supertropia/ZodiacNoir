"use client";

import { signIn } from "next-auth/react";
import { ConstellationEye } from "@/components/ConstellationEye";

export default function SignInPage() {
  return (
    <section className="mx-auto flex max-w-md flex-col items-center px-5 py-20 text-center">
      <ConstellationEye size={90} />
      <h1 className="mt-6 font-display text-3xl text-gold-pale">Ingresá a Zodiac Noir</h1>
      <p className="mt-3 font-body text-lg text-gold-pale/80">
        Guardá tus artículos favoritos y gestioná tu suscripción al boletín.
      </p>

      <button
        onClick={() => signIn("google", { callbackUrl: "/" })}
        className="focus-ring mt-9 flex items-center gap-3 rounded-full border border-gold/40 bg-noir-surface px-6 py-3 font-ui text-sm text-gold-pale transition hover:border-gold hover:bg-gold/10"
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.9 3.6 14.7 2.6 12 2.6 6.9 2.6 2.7 6.8 2.7 12S6.9 21.4 12 21.4c6.9 0 9.3-4.8 9.3-7.3 0-.5-.05-.9-.13-1.3H12z" />
        </svg>
        Continuar con Google
      </button>

      <p className="mt-8 font-ui text-xs text-gold-dim">
        Al ingresar aceptás nuestra política editorial y de privacidad.
      </p>
    </section>
  );
}
