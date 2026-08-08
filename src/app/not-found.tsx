import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto flex max-w-lg flex-col items-center px-5 py-24 text-center">
      <span className="font-display text-6xl text-gold">☾</span>
      <h1 className="mt-6 font-display text-3xl text-gold-pale">Esta página se perdió en tránsito</h1>
      <p className="mt-3 font-body text-lg text-gold-pale/80">
        El contenido que buscás no existe o cambió de lugar.
      </p>
      <Link
        href="/"
        className="focus-ring mt-8 rounded-full bg-gold px-6 py-3 font-ui text-sm uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright"
      >
        Volver al inicio
      </Link>
    </section>
  );
}
