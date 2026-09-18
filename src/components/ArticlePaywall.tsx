"use client";

import { useState } from "react";
import Link from "next/link";

export function ArticlePaywall({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="relative mt-4">
      <div aria-hidden="true" className="pointer-events-none select-none space-y-4 blur-sm">
        <p className="font-body text-xl leading-relaxed text-gold-pale/60">
          Las energías de este tránsito abren un ciclo de introspección que se despliega en varios planos de la
          experiencia, invitando a revisar vínculos, proyectos y decisiones que veníamos posponiendo.
        </p>
        <p className="font-body text-xl leading-relaxed text-gold-pale/60">
          A medida que avanza la semana, el influjo se profundiza y trae señales concretas para quienes sepan
          prestar atención a los pequeños detalles cotidianos.
        </p>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-noir-bg to-transparent" />

      <div className="relative mt-6 rounded-2xl border border-gold/30 bg-noir-surface/80 p-7 text-center backdrop-blur">
        <p className="font-ui text-xs uppercase tracking-wide text-gold-dim">Contenido exclusivo</p>
        <h3 className="mt-2 font-display text-2xl text-gold-pale">Este artículo es solo para miembros</h3>
        <p className="mt-3 font-body text-base text-gold-pale/80">
          Sumate a Zodiac Noir Plus para leerlo completo, junto con el resto de los artículos exclusivos.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/membresia"
            className="focus-ring rounded-full bg-gold px-6 py-3 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright"
          >
            Hazte miembro
          </Link>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="focus-ring rounded-full border border-gold/40 px-6 py-3 font-ui text-sm uppercase tracking-wide text-gold transition hover:bg-gold/10"
          >
            Saber más
          </button>
        </div>
        {!isLoggedIn && (
          <p className="mt-4 font-ui text-xs text-gold-dim">
            Si ya sos miembro,{" "}
            <Link href="/ingresar" className="text-gold underline">
              iniciá sesión con Google
            </Link>{" "}
            para desbloquear el artículo.
          </p>
        )}
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5"
          onClick={() => setShowModal(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="max-w-md rounded-2xl border border-gold/30 bg-noir-bg p-7">
            <h3 className="font-display text-xl text-gold-pale">Cómo hacerte miembro</h3>
            <ol className="mt-4 space-y-3 font-ui text-sm text-gold-pale/85">
              <li>
                <span className="text-gold">1.</span> Iniciá sesión con tu cuenta de Google (arriba a la derecha).
              </li>
              <li>
                <span className="text-gold">2.</span> Entrá a{" "}
                <Link href="/membresia" className="text-gold underline">
                  Membresía
                </Link>{" "}
                y elegí el plan.
              </li>
              <li>
                <span className="text-gold">3.</span> Pagá con Mercado Pago — es una suscripción mensual con
                renovación automática, y podés cancelarla cuando quieras desde{" "}
                <Link href="/mi-cuenta" className="text-gold underline">
                  Mi cuenta
                </Link>
                .
              </li>
            </ol>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="focus-ring rounded-full border border-gold/40 px-5 py-2 font-ui text-xs uppercase tracking-wide text-gold transition hover:bg-gold/10"
              >
                Cerrar
              </button>
              <Link
                href="/membresia"
                className="focus-ring rounded-full bg-gold px-5 py-2 font-ui text-xs font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright"
              >
                Ir a Membresía
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
