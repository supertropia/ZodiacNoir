"use client";

import { FormEvent, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { ConstellationEye } from "@/components/ConstellationEye";
import { NAME_MAX_LENGTH, validateName } from "@/lib/name-validation";

// Nota: esta página no se indexa (ver src/app/robots.ts). Es una página
// transaccional (dispara el OAuth de Google o el envío de un enlace por correo)
// sin valor de contenido para SEO, y mantenerla fuera del rastreo reduce la
// superficie que un escáner automático podría interpretar erróneamente como una
// imitación de un formulario de login.

type Mode = "ingreso" | "registro";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DEFAULT_ERROR = "No pudimos completar el ingreso. Intentá de nuevo en unos minutos.";

const ERROR_MESSAGES: Record<string, string> = {
  NombreInvalido:
    "Escribí tu nombre y apellido usando solo letras (se permiten tildes, espacios, guiones y apóstrofes).",
  NoCuenta: "No encontramos una cuenta con ese correo. Elegí «Crear cuenta» para registrarte.",
  EmailInvalido: "Ese correo no parece válido. Revisá que esté bien escrito.",
  EmailTemporal: "No aceptamos correos temporales. Usá tu correo habitual.",
  EmailTypo:
    "Parece haber un error de tipeo en el dominio de tu correo (por ejemplo, «gmial» en lugar de «gmail»). Revisalo e intentá de nuevo.",
  EmailDominioInexistente: "No pudimos encontrar ese dominio de correo. Revisá que esté bien escrito.",
  EmailEnvioReciente:
    "Ya te enviamos un enlace hace un momento. Revisá tu correo (y la carpeta de spam) o esperá un minuto para pedir otro.",
  EmailSignin: "No pudimos enviar el correo. Intentá de nuevo en unos minutos.",
  Verification: "El enlace venció o ya se usó. Pedí uno nuevo.",
  OAuthAccountNotLinked: "Ese correo ya está registrado con otro método. Probá ingresar con Google.",
  AccessDenied: DEFAULT_ERROR,
  Datos: DEFAULT_ERROR,
  Servidor: DEFAULT_ERROR,
};

// Solo aceptamos volver a una página de esta misma web (nunca a otro sitio).
function safeCallback(value: string | null): string {
  if (value && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) return value;
  return "/";
}

export default function SignInPage() {
  const [mode, setMode] = useState<Mode>("registro");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // campo trampa para robots: una persona nunca lo completa
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [message, setMessage] = useState("");
  const [callbackUrl, setCallbackUrl] = useState("/");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCallbackUrl(safeCallback(params.get("volver")));
    const error = params.get("error");
    if (error) setMessage(ERROR_MESSAGES[error] ?? DEFAULT_ERROR);
  }, []);

  const changeMode = (next: Mode) => {
    setMode(next);
    setMessage("");
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "sending") return;

    if (website) {
      // Un robot completó el campo trampa: simulamos éxito sin enviar nada.
      setStatus("sent");
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_RE.test(cleanEmail)) {
      setMessage(ERROR_MESSAGES.EmailInvalido);
      return;
    }

    let cleanName = "";
    if (mode === "registro") {
      const nameCheck = validateName(name);
      if (!nameCheck.ok) {
        setMessage(ERROR_MESSAGES.NombreInvalido);
        return;
      }
      cleanName = nameCheck.name;
    }

    setStatus("sending");
    setMessage("");
    try {
      // 1) El servidor valida todo y, si es una cuenta nueva, guarda el nombre.
      const res = await fetch("/api/login/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modo: mode, name: cleanName, email: cleanEmail, website }),
      });
      const data: { ok?: boolean; code?: string } = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setMessage(ERROR_MESSAGES[data.code ?? ""] ?? DEFAULT_ERROR);
        setStatus("idle");
        return;
      }

      // 2) Se envía el enlace de ingreso al correo.
      const result = await signIn("email", { email: cleanEmail, callbackUrl, redirect: false });
      if (result?.error) {
        setMessage(ERROR_MESSAGES[result.error] ?? DEFAULT_ERROR);
        setStatus("idle");
        return;
      }

      setEmail(cleanEmail);
      setStatus("sent");
    } catch {
      setMessage(DEFAULT_ERROR);
      setStatus("idle");
    }
  };

  const isRegister = mode === "registro";

  return (
    <section className="mx-auto flex max-w-md flex-col items-center px-5 py-20 text-center">
      <ConstellationEye size={90} />
      <h1 className="mt-6 font-display text-3xl text-gold-pale">
        {isRegister ? "Creá tu cuenta" : "Ingresá a Zodiac Noir"}
      </h1>
      <p className="mt-3 font-body text-lg text-gold-pale/80">
        Guardá tus artículos favoritos y gestioná tu membresía y tu suscripción al boletín.
      </p>

      <button
        onClick={() => signIn("google", { callbackUrl })}
        className="focus-ring mt-9 flex items-center gap-3 rounded-full border border-gold/40 bg-noir-surface px-6 py-3 font-ui text-sm text-gold-pale transition hover:border-gold hover:bg-gold/10"
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.9 3.6 14.7 2.6 12 2.6 6.9 2.6 2.7 6.8 2.7 12S6.9 21.4 12 21.4c6.9 0 9.3-4.8 9.3-7.3 0-.5-.05-.9-.13-1.3H12z" />
        </svg>
        Continuar con Google
      </button>

      <div className="mt-8 flex w-full items-center gap-4" aria-hidden="true">
        <span className="h-px flex-1 bg-gold/20" />
        <span className="font-ui text-xs uppercase tracking-wide text-gold-dim">o con tu correo</span>
        <span className="h-px flex-1 bg-gold/20" />
      </div>

      {status === "sent" ? (
        <div
          role="status"
          className="mt-6 w-full rounded-2xl border border-gold/30 bg-gold/10 px-5 py-5 text-left font-ui text-sm text-gold-pale"
        >
          <p className="font-medium text-gold">Revisá tu correo ✦</p>
          <p className="mt-2 text-gold-pale/85">
            Te enviamos un enlace a <span className="break-all text-gold">{email}</span>. Tocalo para ingresar:
            sirve una sola vez y vence en 15 minutos. Si no lo ves, mirá también la carpeta de spam.
          </p>
          <button
            type="button"
            onClick={() => {
              setStatus("idle");
              setMessage("");
            }}
            className="focus-ring mt-4 text-xs uppercase tracking-wide text-gold-dim underline hover:text-gold"
          >
            Usar otro correo
          </button>
        </div>
      ) : (
        <>
          <div
            role="group"
            aria-label="Elegí cómo continuar"
            className="mt-6 grid w-full grid-cols-2 gap-1 rounded-full border border-gold/30 p-1"
          >
            <button
              type="button"
              onClick={() => changeMode("registro")}
              aria-pressed={isRegister}
              className={`focus-ring rounded-full px-3 py-2 font-ui text-xs uppercase tracking-wide transition ${
                isRegister ? "bg-gold text-noir-bg" : "text-gold-pale hover:bg-gold/10"
              }`}
            >
              Crear cuenta
            </button>
            <button
              type="button"
              onClick={() => changeMode("ingreso")}
              aria-pressed={!isRegister}
              className={`focus-ring rounded-full px-3 py-2 font-ui text-xs uppercase tracking-wide transition ${
                !isRegister ? "bg-gold text-noir-bg" : "text-gold-pale hover:bg-gold/10"
              }`}
            >
              Ya tengo cuenta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 w-full text-left" noValidate>
            {isRegister && (
              <div className="mb-4">
                <label htmlFor="login-name" className="block font-ui text-xs uppercase tracking-wide text-gold-dim">
                  Nombre y apellido
                </label>
                <input
                  id="login-name"
                  type="text"
                  autoComplete="name"
                  maxLength={NAME_MAX_LENGTH}
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="María Pérez"
                  className="focus-ring mt-2 w-full rounded-full border border-gold/40 bg-noir-surface px-5 py-3 font-ui text-base text-gold-pale placeholder:text-gold-dim/70 focus:border-gold"
                />
              </div>
            )}

            <label htmlFor="login-email" className="block font-ui text-xs uppercase tracking-wide text-gold-dim">
              Tu correo electrónico
            </label>
            <input
              id="login-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              maxLength={254}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@correo.com"
              className="focus-ring mt-2 w-full rounded-full border border-gold/40 bg-noir-surface px-5 py-3 font-ui text-base text-gold-pale placeholder:text-gold-dim/70 focus:border-gold"
            />

            {/* Campo trampa anti-robots: oculto para las personas. */}
            <div className="absolute left-[-9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
              <label htmlFor="login-website">No completar este campo</label>
              <input
                id="login-website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            {message && (
              <p role="alert" className="mt-3 font-ui text-sm text-wine-bright">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "sending"}
              className="focus-ring mt-4 w-full rounded-full bg-gold px-6 py-3 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright disabled:opacity-60"
            >
              {status === "sending"
                ? "Enviando…"
                : isRegister
                  ? "Crear cuenta y enviarme el enlace"
                  : "Enviarme un enlace para ingresar"}
            </button>
            <p className="mt-3 text-center font-ui text-xs text-gold-dim">
              Sin contraseñas: te mandamos un enlace de un solo uso a tu correo.
            </p>
          </form>
        </>
      )}

      <p className="mt-8 font-ui text-xs text-gold-dim">
        Al ingresar aceptás nuestra política editorial y de privacidad.
      </p>
    </section>
  );
}
