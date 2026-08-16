import { ContactForm } from "@/components/ContactForm";

export const metadata = {
  title: "Contacto",
  description: "Escribinos por consultas, prensa, colaboraciones o soporte con tu compra o membresía.",
};

export default function ContactoPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <p className="font-ui text-xs uppercase tracking-widest2 text-gold-dim">Contacto</p>
      <h1 className="mt-2 font-display text-4xl text-gold-pale">Escribinos</h1>
      <p className="mt-4 font-body text-lg text-gold-pale/85">
        Consultas, prensa, colaboraciones o problemas con una compra o membresía: completá el
        formulario y te respondemos por email.
      </p>

      <div className="mt-10">
        <ContactForm />
      </div>
    </div>
  );
}
