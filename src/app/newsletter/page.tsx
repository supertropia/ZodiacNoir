import { NewsletterForm } from "@/components/NewsletterForm";

export const metadata = {
  title: "Boletín quincenal",
  description:
    "Suscríbete al boletín de Zodiac Noir: un correo quincenal, sin spam, con las lunaciones, retrogradaciones y efemérides que importan, y una lectura de fondo.",
  alternates: { canonical: "/newsletter" },
  openGraph: {
    title: "Boletín quincenal de Zodiac Noir",
    description: "Las lunaciones y retrogradaciones, antes de que sucedan. Un correo quincenal, sin spam.",
    url: "/newsletter",
    siteName: "Zodiac Noir",
    type: "website",
    locale: "es_LA",
  },
};

export default function NewsletterPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-16 sm:py-24">
      <div className="rounded-3xl border border-gold/25 bg-noir-surface/50 p-8 text-center sm:p-14">
        <p className="font-ui text-xs uppercase tracking-widest2 text-gold-dim">El boletín</p>
        <h1 className="mx-auto mt-3 max-w-xl font-display text-3xl text-gold-pale sm:text-4xl">
          Las lunaciones y retrogradaciones, antes de que sucedan
        </h1>
        <p className="mx-auto mt-4 max-w-md font-body text-lg text-gold-pale/80">
          Un correo quincenal, sin spam, con las efemérides que importan y una lectura de fondo. Déjanos tu correo y te
          sumamos.
        </p>
        <div className="mt-8 flex justify-center">
          <NewsletterForm />
        </div>
        <p className="mt-6 font-ui text-xs text-gold-dim">Es gratis y puedes darte de baja cuando quieras.</p>
      </div>
    </div>
  );
}
