import type { Metadata } from "next";
import { UnsubscribeForm } from "@/components/newsletter/UnsubscribeForm";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Darme de baja del boletín",
  robots: { index: false, follow: false },
};

export default function BajaPage({ searchParams }: { searchParams?: { token?: string } }) {
  const token = typeof searchParams?.token === "string" ? searchParams.token : "";

  return (
    <main className="mx-auto max-w-xl px-5 py-20 text-center">
      <h1 className="mb-6 font-display text-3xl">Darme de baja del boletín</h1>
      {token ? (
        <UnsubscribeForm token={token} />
      ) : (
        <p className="font-body text-lg opacity-80">
          Este enlace no es válido. Abre el enlace «Darme de baja» que aparece al final de cualquier correo del boletín, o
          escríbenos a {CONTACT_EMAIL} y te damos de baja.
        </p>
      )}
    </main>
  );
}
