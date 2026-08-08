import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contacto" };

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-xl px-5 py-16 text-center">
      <p className="font-ui text-xs uppercase tracking-widest2 text-gold-dim">Contacto</p>
      <h1 className="mt-3 font-display text-4xl text-gold-pale">Escribinos</h1>
      <p className="mt-4 font-body text-lg text-gold-pale/80">
        Para consultas editoriales, colaboraciones o prensa, escribí a{" "}
        <a href="mailto:hola@zodiacnoir.com" className="text-gold hover:text-gold-bright">
          hola@zodiacnoir.com
        </a>
        .
      </p>
    </section>
  );
}
