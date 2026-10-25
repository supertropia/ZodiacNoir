export const metadata = {
  title: "Política de privacidad",
  alternates: { canonical: "/privacidad" },
};

export default function PrivacidadPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 font-body text-gold-pale/90">
      <p className="font-ui text-xs uppercase tracking-widest2 text-gold-dim">Legal</p>
      <h1 className="mt-2 font-display text-4xl text-gold-pale">Política de privacidad</h1>
      <p className="mt-3 font-ui text-xs text-gold-dim">Última actualización: 21 de octubre de 2026.</p>

      <div className="mt-8 space-y-6 leading-relaxed">
        <p>
          Este es un modelo general para orientarte y cumplir con los requisitos básicos de Google
          AdSense y normativas de privacidad habituales (como GDPR/CCPA). Te recomendamos que un
          abogado lo revise antes de publicarlo, sobre todo si tienes visitantes en la Unión Europea.
        </p>

        <section>
          <h2 className="font-display text-xl text-gold">1. Datos que recopilamos</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Email, si te suscribes al boletín o inicias sesión con Google.</li>
            <li>
              Si pides una lectura personalizada: tu nombre, tu correo, tu fecha, hora y lugar de
              nacimiento, el área que quieres profundizar, el texto opcional que escribas sobre ti
              y, en la revolución solar, el año y el lugar donde estarás en tu cumpleaños.
            </li>
            <li>Datos de pago, procesados directamente por Lemon Squeezy, Mercado Pago y PayPal
              (membresías, PDFs y lecturas). Nosotros no almacenamos números de tarjeta.</li>
            <li>Datos de navegación (páginas visitadas, dispositivo, ubicación aproximada) a
              través de cookies propias y de terceros, incluyendo las de Google AdSense y de
              analítica si están activas.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl text-gold">2. Cómo usamos tus datos</h2>
          <p className="mt-2">
            Usamos tu email para enviarte el boletín (si te suscribiste), confirmarte compras y
            gestionar tu membresía. Usamos datos de navegación de forma agregada para entender qué
            contenido interesa más y, junto a nuestros anunciantes, para mostrar publicidad
            relevante.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-gold">3. Datos de nacimiento y lecturas personalizadas</h2>
          <p className="mt-2">
            Los datos de tu pedido de lectura se usan únicamente para calcular y elaborar tu
            lectura, enviártela, confirmarte el pago y atender consultas o reclamos sobre el
            pedido. No los usamos para otra finalidad ni los publicamos.
          </p>
          <p className="mt-2">
            Para preparar las lecturas podemos usar herramientas de inteligencia artificial como
            apoyo, a las que se les proporcionan los datos necesarios de tu pedido. Cada lectura es
            revisada y editada por la autora antes de enviarse.
          </p>
          <p className="mt-2">
            El campo «Cuéntame sobre ti» es opcional: incluye solo lo que quieras que tengamos en
            cuenta. Conservamos los datos de tu pedido durante el tiempo necesario para entregar la
            lectura, atender consultas o reclamos y cumplir obligaciones legales y contables.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-gold">4. Publicidad y cookies (Google AdSense)</h2>
          <p className="mt-2">
            Este sitio muestra anuncios a través de Google AdSense. Google, como proveedor
            externo, usa cookies para publicar anuncios en base a tus visitas anteriores a este u
            otros sitios. Puedes inhabilitar la publicidad personalizada visitando{" "}
            <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-gold underline">
              adssettings.google.com
            </a>
            . También puedes inhabilitar el uso de cookies de terceros para publicidad
            personalizada visitando{" "}
            <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className="text-gold underline">
              www.aboutads.info/choices
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-gold">5. Con quién compartimos datos</h2>
          <p className="mt-2">
            Compartimos datos estrictamente necesarios con: Google (autenticación y publicidad),
            Lemon Squeezy, Mercado Pago y PayPal (procesamiento de pagos), Resend (envío de emails), las
            herramientas de inteligencia artificial que usamos como apoyo para preparar las
            lecturas, y el proveedor de base de datos y hosting (Vercel y Neon). No vendemos tus
            datos personales a terceros.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-gold">6. Tus derechos</h2>
          <p className="mt-2">
            Puedes pedir en cualquier momento que eliminemos tu email de nuestra base de
            suscriptores (hay un enlace de baja en cada boletín), que te informemos qué datos
            tenemos sobre ti, o que corrijamos o eliminemos los datos de un pedido, escribiendo
            desde la página de{" "}
            <a href="/contacto" className="text-gold underline">Contacto</a>.
          </p>
          <p className="mt-2">
            El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a
            los mismos en forma gratuita a intervalos no inferiores a seis meses, salvo que se
            acredite un interés legítimo al efecto, conforme lo establecido en el artículo 14,
            inciso 3, de la Ley Nº 25.326. La Agencia de Acceso a la Información Pública, en su
            carácter de Órgano de Control de la Ley Nº 25.326, tiene la atribución de atender las
            denuncias y reclamos que se interpongan con relación al incumplimiento de las normas
            sobre protección de datos personales.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-gold">7. Menores de edad</h2>
          <p className="mt-2">
            El sitio no está dirigido a menores de 18 años y no recopilamos deliberadamente datos
            de menores. Las lecturas personalizadas solo pueden pedirlas personas mayores de 18 años.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-gold">8. Contacto</h2>
          <p className="mt-2">
            Para consultas sobre privacidad, escríbenos desde la página de{" "}
            <a href="/contacto" className="text-gold underline">Contacto</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
