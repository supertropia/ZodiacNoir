export const metadata = {
  title: "Términos y condiciones",
  alternates: { canonical: "/terminos" },
};

export default function TerminosPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 font-body text-gold-pale/90">
      <p className="font-ui text-xs uppercase tracking-widest2 text-gold-dim">Legal</p>
      <h1 className="mt-2 font-display text-4xl text-gold-pale">Términos y condiciones</h1>
      <p className="mt-3 font-ui text-xs text-gold-dim">Última actualización: completá la fecha al publicar.</p>

      <div className="mt-8 space-y-6 leading-relaxed">
        <p>
          Este es un modelo general de términos y condiciones para orientarte. No reemplaza el
          asesoramiento de un abogado: revisalo con uno antes de publicarlo, especialmente si
          vendés productos pagos o membresías.
        </p>

        <section>
          <h2 className="font-display text-xl text-gold">1. Objeto</h2>
          <p className="mt-2">
            Zodiac Noir ("el sitio", "nosotros") ofrece contenido editorial sobre astrología,
            tarot y psicología astrológica con fines de entretenimiento y autoconocimiento, así
            como productos digitales (PDFs) y membresías pagas de acceso a contenido exclusivo.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-gold">2. Naturaleza del contenido</h2>
          <p className="mt-2">
            El contenido publicado tiene fines de entretenimiento y reflexión personal. No
            constituye asesoramiento médico, psicológico, legal ni financiero. Las decisiones
            importantes de tu vida deben tomarse con el acompañamiento de profesionales
            calificados en cada materia.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-gold">3. Cuentas y acceso</h2>
          <p className="mt-2">
            Para acceder a ciertas funciones (comentarios, panel de administración, contenido
            exclusivo) podés iniciar sesión con tu cuenta de Google. Sos responsable de mantener
            la confidencialidad de tu acceso.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-gold">4. Membresías y compras</h2>
          <p className="mt-2">
            Las membresías se cobran de forma recurrente (mensual o anual, según el plan elegido)
            a través de nuestro proveedor de pagos (Lemon Squeezy). Podés cancelar tu membresía en
            cualquier momento desde el enlace de gestión que recibís por email; la cancelación
            evita el próximo cobro pero no genera reembolsos proporcionales del período ya pagado,
            salvo que se indique lo contrario en la página del plan.
          </p>
          <p className="mt-2">
            Los productos digitales (PDFs) se cobran como pago único y se entregan por descarga
            inmediata o por email tras la confirmación del pago. Por tratarse de contenido digital
            entregado de inmediato, las compras no son reembolsables salvo error nuestro o lo que
            exija la ley aplicable en tu país.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-gold">5. Propiedad intelectual</h2>
          <p className="mt-2">
            Los textos, ilustraciones y PDFs publicados en el sitio son propiedad de Zodiac Noir o
            de sus autores y se licencian para uso personal. No está permitida su reproducción,
            reventa o distribución sin autorización previa.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-gold">6. Publicidad</h2>
          <p className="mt-2">
            El sitio puede mostrar anuncios de terceros (por ejemplo, Google AdSense) para
            financiar el contenido gratuito. Estos anuncios pueden usar cookies propias y de
            terceros; más detalle en nuestra{" "}
            <a href="/privacidad" className="text-gold underline">Política de privacidad</a>.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-gold">7. Modificaciones</h2>
          <p className="mt-2">
            Podemos actualizar estos términos en cualquier momento; los cambios importantes se
            anunciarán en el sitio o por email a las personas suscriptas.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-gold">8. Contacto</h2>
          <p className="mt-2">
            Para consultas sobre estos términos, escribinos desde la página de{" "}
            <a href="/contacto" className="text-gold underline">Contacto</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
