export const metadata = {
  title: "Política de privacidad",
  alternates: { canonical: "/privacidad" },
};

export default function PrivacidadPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 font-body text-gold-pale/90">
      <p className="font-ui text-xs uppercase tracking-widest2 text-gold-dim">Legal</p>
      <h1 className="mt-2 font-display text-4xl text-gold-pale">Política de privacidad</h1>
      <p className="mt-3 font-ui text-xs text-gold-dim">Última actualización: completá la fecha al publicar.</p>

      <div className="mt-8 space-y-6 leading-relaxed">
        <p>
          Este es un modelo general para orientarte y cumplir con los requisitos básicos de Google
          AdSense y normativas de privacidad habituales (como GDPR/CCPA). Te recomendamos que un
          abogado lo revise antes de publicarlo, sobre todo si tenés visitantes en la Unión Europea.
        </p>

        <section>
          <h2 className="font-display text-xl text-gold">1. Datos que recopilamos</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Email, si te suscribís al boletín o iniciás sesión con Google.</li>
            <li>Datos de pago, procesados directamente por Lemon Squeezy (nosotros no
              almacenamos números de tarjeta).</li>
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
          <h2 className="font-display text-xl text-gold">3. Publicidad y cookies (Google AdSense)</h2>
          <p className="mt-2">
            Este sitio muestra anuncios a través de Google AdSense. Google, como proveedor
            externo, usa cookies para publicar anuncios en base a tus visitas anteriores a este u
            otros sitios. Podés inhabilitar la publicidad personalizada visitando{" "}
            <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-gold underline">
              adssettings.google.com
            </a>
            . También podés inhabilitar el uso de cookies de terceros para publicidad
            personalizada visitando{" "}
            <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className="text-gold underline">
              www.aboutads.info/choices
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-gold">4. Con quién compartimos datos</h2>
          <p className="mt-2">
            Compartimos datos estrictamente necesarios con: Google (autenticación y publicidad),
            Lemon Squeezy (procesamiento de pagos), Resend (envío de emails) y el proveedor de
            base de datos y hosting (Vercel / Neon / Supabase, según lo que configures). No
            vendemos tus datos personales a terceros.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-gold">5. Tus derechos</h2>
          <p className="mt-2">
            Podés pedir en cualquier momento que eliminemos tu email de nuestra base de
            suscriptores (hay un enlace de baja en cada boletín) o que te informemos qué datos
            tenemos sobre vos, escribiendo desde la página de{" "}
            <a href="/contacto" className="text-gold underline">Contacto</a>.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-gold">6. Menores de edad</h2>
          <p className="mt-2">
            El sitio no está dirigido a menores de 18 años y no recopilamos deliberadamente datos
            de menores.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-gold">7. Contacto</h2>
          <p className="mt-2">
            Para consultas sobre privacidad, escribinos desde la página de{" "}
            <a href="/contacto" className="text-gold underline">Contacto</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
