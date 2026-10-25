"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

const DISMISSED_KEY = "zn-nl-dismissed"; // sessionStorage: cerrado en esta visita
const SUBSCRIBED_KEY = "zn-nl-subscribed"; // localStorage: ya se suscribió, no volver a mostrar

function readStorage(kind: "session" | "local", key: string): string | null {
  try {
    return (kind === "session" ? window.sessionStorage : window.localStorage).getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(kind: "session" | "local", key: string, value: string) {
  try {
    (kind === "session" ? window.sessionStorage : window.localStorage).setItem(key, value);
  } catch {
    /* sin almacenamiento disponible: la página funciona igual */
  }
}

type Status = "idle" | "loading" | "success" | "error";

/** Lógica compartida de suscripción para el popup y la tarjeta del final del artículo. */
function useSubscribe(onSuccess?: () => void) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No pudimos suscribirte. Intentá de nuevo.");
      setStatus("success");
      setMessage("¡Listo! Ya sos parte del boletín. Revisá tu correo: te escribimos la bienvenida.");
      setEmail("");
      writeStorage("local", SUBSCRIBED_KEY, "1");
      onSuccess?.();
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Algo salió mal.");
    }
  };

  return { email, setEmail, status, message, submit };
}

/** Ventana pequeña y cerrable que invita a suscribirse al leer un artículo. */
export function NewsletterPopup() {
  const [open, setOpen] = useState(false);
  const { email, setEmail, status, message, submit } = useSubscribe();

  const close = useCallback(() => {
    setOpen(false);
    writeStorage("session", DISMISSED_KEY, "1");
  }, []);

  // Aparece tras ~8 segundos de lectura o al bajar ~40 % del artículo, lo que ocurra primero.
  useEffect(() => {
    if (readStorage("local", SUBSCRIBED_KEY) || readStorage("session", DISMISSED_KEY)) return;

    let done = false;
    const show = () => {
      if (done) return;
      done = true;
      setOpen(true);
    };
    const timer = window.setTimeout(show, 8000);
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0 && window.scrollY / max > 0.4) show();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  // Tras suscribirse, se muestra el mensaje de éxito unos segundos y se cierra sola.
  useEffect(() => {
    if (status !== "success") return;
    const t = window.setTimeout(() => setOpen(false), 5000);
    return () => window.clearTimeout(t);
  }, [status]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-label="Suscripción al boletín de Zodiac Noir"
      className="fixed inset-x-0 bottom-0 z-50 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[24rem]"
    >
      <div className="relative rounded-t-3xl border border-gold/40 bg-noir-surface px-6 pb-7 pt-6 shadow-2xl shadow-black/40 sm:rounded-3xl">
        <button
          type="button"
          onClick={close}
          aria-label="Cerrar"
          className="focus-ring absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-gold-dim transition hover:bg-gold/10 hover:text-gold"
        >
          <span aria-hidden="true" className="text-lg leading-none">
            ×
          </span>
        </button>

        <p className="font-ui text-xs uppercase tracking-widest2 text-gold-dim">Gratis · Cada quincena</p>
        <h2 className="mt-2 pr-6 font-display text-xl leading-snug text-gold-pale">El boletín de Zodiac Noir</h2>

        {status === "success" ? (
          <p role="status" aria-live="polite" className="mt-3 font-body text-base leading-relaxed text-gold">
            {message}
          </p>
        ) : (
          <>
            <p className="mt-2 font-body text-base leading-relaxed text-gold-pale/80">
              Recibí en tu correo los tránsitos y las lunaciones que importan, sin costo. Podés darte de baja cuando
              quieras.
            </p>
            <form onSubmit={submit} className="mt-4">
              <label htmlFor="popup-newsletter-email" className="sr-only">
                Correo electrónico
              </label>
              <input
                id="popup-newsletter-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="focus-ring w-full rounded-full border border-gold/40 bg-transparent px-5 py-3 font-ui text-sm text-current placeholder:text-gold-dim focus:border-gold"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="focus-ring mt-3 w-full rounded-full bg-gold px-6 py-3 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright disabled:opacity-60"
              >
                {status === "loading" ? "Enviando…" : "Quiero suscribirme"}
              </button>
              <div aria-live="polite">
                {message && (
                  <p className={`mt-3 font-ui text-sm ${status === "error" ? "text-wine-bright" : "text-gold"}`}>
                    {message}
                  </p>
                )}
              </div>
            </form>
            <button
              type="button"
              onClick={close}
              className="focus-ring mt-3 block w-full text-center font-ui text-xs text-gold-dim transition hover:text-gold"
            >
              Ahora no
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/** Tarjeta de suscripción al final de cada artículo. */
export function ArticleNewsletterCard() {
  const { email, setEmail, status, message, submit } = useSubscribe();

  return (
    <section
      aria-labelledby="article-newsletter-title"
      className="mt-12 rounded-3xl border border-gold/30 bg-noir-surface/60 px-6 py-9 text-center sm:px-10"
    >
      <p className="font-ui text-xs uppercase tracking-widest2 text-gold-dim">Gratis · Cada quincena</p>
      <h2 id="article-newsletter-title" className="mt-2 font-display text-2xl text-gold-pale">
        Recibí el cielo en tu correo
      </h2>
      <p className="mx-auto mt-3 max-w-md font-body text-lg leading-relaxed text-gold-pale/80">
        Suscribite al boletín de Zodiac Noir. Es gratis y podés darte de baja cuando quieras.
      </p>

      {status === "success" ? (
        <p role="status" aria-live="polite" className="mt-5 font-body text-lg text-gold">
          {message}
        </p>
      ) : (
        <form onSubmit={submit} className="mx-auto mt-6 max-w-md">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label htmlFor="article-newsletter-email" className="sr-only">
              Correo electrónico
            </label>
            <input
              id="article-newsletter-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="focus-ring flex-1 rounded-full border border-gold/40 bg-transparent px-5 py-3 font-ui text-sm text-current placeholder:text-gold-dim focus:border-gold"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="focus-ring shrink-0 rounded-full bg-gold px-6 py-3 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright disabled:opacity-60"
            >
              {status === "loading" ? "Enviando…" : "Suscribirme"}
            </button>
          </div>
          <div aria-live="polite">
            {message && (
              <p className={`mt-3 font-ui text-sm ${status === "error" ? "text-wine-bright" : "text-gold"}`}>
                {message}
              </p>
            )}
          </div>
        </form>
      )}
    </section>
  );
}
