import type { Metadata } from "next";
import { Suspense } from "react";
import { PersonalReportForm } from "@/components/PersonalReportForm";

export const metadata: Metadata = { title: "Informe personalizado" };

export default function PersonalReportPage() {
  return (
    <section className="mx-auto max-w-xl px-5 py-16">
      <p className="font-ui text-xs uppercase tracking-widest2 text-gold-dim">A medida</p>
      <h1 className="mt-3 font-display text-4xl text-gold-pale">¿Querés un informe personalizado?</h1>
      <p className="mt-4 font-body text-lg text-gold-pale/80">
        Completá tus datos y te contactamos para preparar una lectura completa de tu carta natal,
        escrita a mano por nuestro equipo — no un informe genérico automatizado.
      </p>
      <div className="mt-10">
        <Suspense fallback={null}>
          <PersonalReportForm />
        </Suspense>
      </div>
    </section>
  );
}
