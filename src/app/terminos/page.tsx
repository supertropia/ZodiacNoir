export const metadata = {
  title: "Términos y condiciones",
  alternates: { canonical: "/terminos" },
};

export default function TerminosPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 font-body text-gold-pale/90">
      <p className="font-ui text-xs uppercase tracking-widest2 text-gold-dim">Legal</p>
      <h1 className="mt-2 font-display text-4xl text-gold-pale">Términos y condiciones</h1>
      <p className="mt-3 font-ui text-xs text-gold-dim">Última actualización: 21 de octubre de 2026.</p>

      <div className="mt-8 space-y-6 leading-relaxed">
        <p>
          Este es un modelo general de términos y condiciones para orientarte. No reemplaza el
          asesoramiento de un abogado: revísalo con uno antes de publicarlo, especialmente si
          vendes productos pagos, lecturas o membresías.
        </p>

        <section>
          <h2 className="font-display text-xl text-gold">1. Objeto</h2>
          <p className="mt-2">
            Zodiac Noir ("el sitio", "nosotros") ofrece contenido editorial sobre astrología,
            tarot y psicología astrológica con fines de entretenimiento y autoconocimiento, así
            como lecturas astrológicas personalizadas (carta natal y revolución solar), productos
            digitales (PDFs) y membresías pagas de acceso a contenido exclusivo.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-gold">2. Naturaleza del contenido</h2>
          <p className="mt-2">
            El contenido publicado y las lecturas tienen fines de entretenimiento, autoconocimiento
            y reflexión personal. La astrología que practicamos es un lenguaje simbólico: no
            predice hechos ni garantiza resultados, y no constituye asesoramiento médico,
            psicológico, legal ni financiero. Las decisiones importantes de tu vida deben tomarse
            con el acompañamiento de profesionales calificados en cada materia.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-gold">3. Cuentas y acceso</h2>
          <p className="mt-2">
            Para acceder a ciertas funciones (comentarios, panel de administración, contenido
            exclusivo) puedes iniciar sesión con tu cuenta de Google. Eres responsable de mantener
            la confidencialidad de tu acceso. Para pedir una lectura personalizada no es necesario
            tener una cuenta.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-gold">4. Membresías y compras</h2>
          <p className="mt-2">
            Las membresías se cobran de forma recurrente (mensual o anual, según el plan elegido)
            a través de nuestro proveedor de pagos (Lemon Squeezy). Puedes cancelar tu membresía en
            cualquier momento desde el enlace de gestión que recibes por email; la cancelación
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
          <h2 className="font-display text-xl text-gold">5. Lecturas personalizadas</h2>
          <p className="mt-2">
            Las lecturas (carta natal arquetípica y revolución solar) son textos elaborados para
            una persona en particular a partir de sus datos de nacimiento, y se entregan en formato
            PDF por correo electrónico. Para pedirlas debes ser mayor de 18 años.
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong>Tus datos.</strong> Eres responsable de que la fecha, la hora y el lugar de
              nacimiento que cargas sean correctos: de ellos depende la precisión de la lectura. Si
              no conoces la hora, la lectura se realiza sin Ascendente ni casas. Si notas un error
              en tus datos antes de recibir la lectura, escríbenos desde Contacto y lo corregimos.
            </li>
            <li>
              <strong>Precio y pago.</strong> Los precios se publican en dólares estadounidenses
              (USD). El pago se realiza con Mercado Pago en pesos argentinos: al continuar,
              convertimos el precio al dólar oficial del día con un pequeño margen por la variación
              hasta la acreditación del pago. Ves el monto exacto en pesos antes de pagar y no
              cambia después. Las comisiones del medio de pago que correspondan a tu medio de pago
              son ajenas al sitio.
            </li>

            <li>
              <strong>Plazo de entrega.</strong> La lectura se entrega en un plazo de 5 a 7 días hábiles
              desde la confirmación del pago, por correo electrónico, al correo que indicaste. Revisa también la carpeta de
              correo no deseado. Si por una causa ajena se produjera una demora, te avisaremos.
            </li>
            <li>
              <strong>Cancelaciones y devoluciones.</strong> Por tratarse de un contenido
              confeccionado a partir de tus datos, una vez entregada la lectura no corresponde la
              devolución del pago, salvo error nuestro o lo que exija la ley aplicable. Si necesitas
              cancelar el pedido antes de que te enviemos la lectura, si no la recibes dentro del
              plazo o si hay un problema con ella, escríbenos desde Contacto: lo resolveremos o, si
              no fuera posible, te devolveremos el pago.
            </li>
            <li>
              <strong>Uso de la lectura.</strong> Es para tu uso personal. No está permitido
              reproducirla, publicarla ni revenderla sin autorización.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl text-gold">6. Propiedad intelectual</h2>
          <p className="mt-2">
            Los textos, ilustraciones, lecturas y PDFs publicados o entregados por el sitio son
            propiedad de Zodiac Noir o de sus autores y se licencian para uso personal. No está
            permitida su reproducción, reventa o distribución sin autorización previa.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-gold">7. Publicidad</h2>
          <p className="mt-2">
            El sitio puede mostrar anuncios de terceros (por ejemplo, Google AdSense) para
            financiar el contenido gratuito. Estos anuncios pueden usar cookies propias y de
            terceros; más detalle en nuestra{" "}
            <a href="/privacidad" className="text-gold underline">Política de privacidad</a>.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-gold">8. Modificaciones</h2>
          <p className="mt-2">
            Podemos actualizar estos términos en cualquier momento; los cambios importantes se
            anunciarán en el sitio o por email a las personas suscriptas.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-gold">9. Contacto</h2>
          <p className="mt-2">
            Para consultas sobre estos términos, escríbenos desde la página de{" "}
            <a href="/contacto" className="text-gold underline">Contacto</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
