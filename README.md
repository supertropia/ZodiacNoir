# Zodiac Noir

Sitio de astrología, tarot y psicología astrológica. Next.js 14 (App Router) + Tailwind CSS +
Prisma + NextAuth (Google) + Resend, pensado para desplegarse en Vercel con dominio propio.

## Qué incluye

- Diseño noir/dorado a medida (sin plantillas), con tema claro/oscuro y control de tamaño de letra.
- Buscador de artículos en el propio sitio.
- Botón "Escuchar este artículo" (Web Speech API del navegador, sin costo de servidor).
- Botones para compartir en X, Facebook, WhatsApp, Pinterest y copiar enlace.
- Formulario de newsletter conectado a base de datos + envío de email de bienvenida (Resend).
- Autenticación con Google (NextAuth).
- Página de efemérides con lunaciones, eclipses y retrogradaciones reales de agosto a diciembre 2026.
- Contenido editorial de muestra con autoría, nota de metodología y fuentes (siguiendo las
  directrices de Google sobre contenido útil, fiable y centrado en las personas).

## 1. Requisitos previos

- Node.js 18.18 o superior.
- Una cuenta en [GitHub](https://github.com) y otra en [Vercel](https://vercel.com).
- Una base de datos PostgreSQL. Opciones simples:
  - [Vercel Postgres](https://vercel.com/storage/postgres) (se crea desde el propio panel de Vercel).
  - [Neon](https://neon.tech) (capa gratuita generosa).
  - [Supabase](https://supabase.com).
- Un proyecto en [Google Cloud Console](https://console.cloud.google.com) para el login con Google.
- Una cuenta en [Resend](https://resend.com) para enviar la newsletter (capa gratuita disponible).

## 2. Configuración local

```bash
npm install
cp .env.example .env
```

Completá `.env` con tus propias credenciales (ver secciones siguientes) y después:

```bash
npx prisma db push   # crea las tablas en tu base de datos
npm run dev           # http://localhost:3000
```

## 3. Google OAuth (login con Google)

1. Andá a [console.cloud.google.com](https://console.cloud.google.com) → crea un proyecto (o
   usá uno existente).
2. **APIs y servicios → Pantalla de consentimiento OAuth**: configurala como "Externa", completá
   nombre de la app ("Zodiac Noir") y tu email de contacto.
3. **APIs y servicios → Credenciales → Crear credenciales → ID de cliente de OAuth**:
   - Tipo de aplicación: *Aplicación web*.
   - Orígenes autorizados de JavaScript: `http://localhost:3000` y, más adelante, `https://tu-dominio.com`.
   - URI de redirección autorizados:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://tu-dominio.com/api/auth/callback/google`
4. Copiá el **Client ID** y el **Client Secret** a tu `.env` (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).
5. Generá `NEXTAUTH_SECRET` con: `openssl rand -base64 32`.

## 4. Base de datos

Cualquier proveedor Postgres funciona. Ejemplo con Neon:

1. Creá un proyecto en neon.tech.
2. Copiá la cadena de conexión a `DATABASE_URL` en tu `.env`.
3. Corré `npx prisma db push` para crear las tablas (`User`, `Account`, `Session`, `Subscriber`, `Article`).
4. Opcional: corré `npx prisma db seed` para cargar 5 artículos de ejemplo y tener contenido de
   partida (podés editarlos o eliminarlos desde `/admin` en cualquier momento).

## 5. Newsletter (Resend)

1. Creá una cuenta en resend.com y verificá tu dominio (o usá el dominio de pruebas que te dan).
2. Generá una API key y ponela en `RESEND_API_KEY`.
3. Ajustá `NEWSLETTER_FROM` con el remitente que quieras mostrar.
4. El envío masivo de campañas (no solo el email de bienvenida automático) se hace desde el panel
   de Resend o con un script que lea la tabla `Subscriber` — no está incluido por defecto para
   evitar envíos accidentales.

## 5bis. Panel de administración — cómo publicar artículos

El sitio incluye un panel propio en `/admin` para escribir y publicar artículos sin tocar código.

**Quién puede entrar:** completá la variable `ADMIN_EMAILS` en tus variables de entorno (local y
en Vercel) con tu email de Google separado por coma si son varios:
```
ADMIN_EMAILS="vos@gmail.com,otra-persona@gmail.com"
```
Solo esas cuentas de Google pueden acceder a `/admin`; cualquier otra persona que inicie sesión
llega al sitio normal, sin ver el panel.

**Para publicar un artículo:**
1. Iniciá sesión con Google (botón "Ingresar") con un email que esté en `ADMIN_EMAILS`.
2. Andá a `/admin` (o hacé clic en "Panel" en el menú).
3. "+ Nuevo artículo" → completá título (el slug/URL se genera solo), copete, categoría, signo
   opcional, autor y contenido.
4. El contenido se escribe en texto simple: separá cada párrafo con una línea en blanco. Se puede
   usar `**negrita**`, `*cursiva*` y `[texto](https://enlace.com)`.
5. Para imágenes: usá el botón "Subir imagen" (portada) o "+ Insertar imagen aquí" (dentro del
   texto, en el lugar donde esté el cursor).
6. "Guardar borrador" guarda sin publicar; "Publicar" lo deja visible en el sitio al instante.
7. Desde el listado de `/admin` podés editar o eliminar cualquier artículo cuando quieras.

**Subida de imágenes (gratuita):** usa [Vercel Blob](https://vercel.com/docs/storage/vercel-blob).
Para activarla:
1. En tu proyecto de Vercel: **Storage → Create Database → Blob**.
2. Conectala al proyecto — Vercel agrega automáticamente la variable `BLOB_READ_WRITE_TOKEN`.
3. Redesplegá. La capa gratuita de Blob incluye almacenamiento y transferencia suficientes para
   un blog de este tamaño.

Si todavía no activaste Blob (por ejemplo, mientras trabajás en local), el panel te va a avisar
con un mensaje claro — mientras tanto podés pegar directamente la URL de una imagen ya alojada en
otro lugar (por ejemplo, subida a Imgur o a tu propio Google Drive público) en el campo de imagen.

## 5ter. Membresías y tienda de PDFs (Lemon Squeezy)

El sitio ya incluye `/membresia` (suscripciones) y `/tienda` (PDFs de pago único), con checkout
por [Lemon Squeezy](https://lemonsqueezy.com) y sincronización automática por webhook.

**Cómo activarlo:**
1. Creá una cuenta y una tienda en Lemon Squeezy.
2. En tu tienda, creá un producto por cada plan de membresía (ej. "Plus Mensual", "Plus Anual",
   marcados como suscripción) y uno por cada PDF (pago único). Copiá el **Variant ID** de cada uno.
3. Cargá esos planes/productos desde el panel: entrá a `/admin/planes` o `/admin/productos`
   con tu cuenta de administrador y completá el formulario (nombre, precio a mostrar, el
   `Variant ID` que copiaste, y para los PDFs subís el archivo directamente ahí).
4. Completá en tu `.env` / Vercel: `LEMONSQUEEZY_STORE` (el subdominio de tu tienda) y
   `LEMONSQUEEZY_WEBHOOK_SECRET` (un valor secreto que vos definís).
5. En Lemon Squeezy: **Settings → Webhooks → Add webhook**. URL:
   `https://tu-dominio.com/api/lemonsqueezy/webhook`. Eventos a marcar: `order_created`,
   `order_refunded`, `subscription_created`, `subscription_updated`,
   `subscription_cancelled`, `subscription_expired`. Signing secret: el mismo valor que
   pusiste en `LEMONSQUEEZY_WEBHOOK_SECRET`.
6. Para los PDFs: subilos directamente desde `/admin/productos` (usa Vercel Blob, igual que
   las imágenes de artículos). Marcá "Publicado" cuando el producto esté listo para venderse.

Cómo funciona la validación: cuando alguien paga, Lemon Squeezy llama a tu webhook, que guarda
el estado en las tablas `Subscription` (membresías) o `Purchase` (PDFs) usando el email de la
compra. Las páginas `/membresia` y `/tienda` chequean esas tablas para mostrar "ya sos miembro"
o el botón de descarga en vez del botón de compra.

## 5quater. Optimización para Google AdSense

1. Sumá tu sitio en [adsense.google.com](https://adsense.google.com) y esperá la aprobación
   (para eso necesitás contenido real publicado, que es justo lo que este sitio ya tiene: `/terminos`,
   `/privacidad`, `/contacto` y artículos con autoría).
2. Copiá tu Publisher ID (formato `ca-pub-XXXXXXXXXXXXXXXX`) a la variable de entorno
   `NEXT_PUBLIC_ADSENSE_CLIENT`. Esto activa automáticamente el script de AdSense en todo el
   sitio y genera `/ads.txt` con tu ID.
3. Una vez aprobado, agregá los bloques de anuncio (`<ins class="adsbygoogle">...`) donde
   quieras mostrarlos — por ejemplo entre párrafos de un artículo largo — siguiendo las
   instrucciones que te da el panel de AdSense al crear cada bloque.
4. Las páginas de `/terminos` y `/privacidad` ya mencionan el uso de cookies publicitarias de
   Google, un requisito habitual para la aprobación.

## 6. Subir el proyecto a GitHub

```bash
git init
git add .
git commit -m "Zodiac Noir: sitio inicial"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/zodiac-noir.git
git push -u origin main
```

## 7. Desplegar en Vercel

1. En [vercel.com/new](https://vercel.com/new), importá el repositorio de GitHub.
2. En **Environment Variables**, cargá las mismas variables de tu `.env`:
   `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (poné tu dominio final),
   `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`, `NEWSLETTER_FROM`,
   `CONTACT_TO_EMAIL`, `LEMONSQUEEZY_STORE`, `LEMONSQUEEZY_WEBHOOK_SECRET`,
   `NEXT_PUBLIC_ADSENSE_CLIENT`.
3. Desplegá. Vercel corre `prisma generate` automáticamente gracias al script `postinstall`.

## 8. Conectar tu dominio propio

1. En el proyecto de Vercel: **Settings → Domains → Add** y escribí tu dominio.
2. Vercel te va a mostrar los registros DNS (generalmente un `A` o `CNAME`) para cargar en tu
   proveedor de dominio.
3. Una vez propagado (puede tardar hasta 24-48 h), actualizá:
   - `NEXTAUTH_URL` a `https://tu-dominio.com` en Vercel.
   - Los orígenes/URI de redirección en Google Cloud Console con el dominio final.
   - `metadataBase` en `src/app/layout.tsx`.

## 9. Estructura del proyecto

```
src/
  app/                 rutas (App Router)
    articulos/         listado y detalle de artículos (leídos desde la base de datos)
    signos/            listado y detalle de signos
    efemerides/         calendario de eventos (con cuenta regresiva en vivo)
    membresia/          planes de suscripción paga (Lemon Squeezy)
    tienda/              PDFs de pago único (Lemon Squeezy)
    terminos/            términos y condiciones
    privacidad/          política de privacidad (cookies / AdSense)
    contacto/            formulario de contacto
    sobre-nosotros/     editorial y método
    ingresar/           login con Google
    admin/              panel de administración (crear/editar/publicar artículos)
    api/                rutas de API (auth, newsletter, artículos, admin, contacto,
                        lemonsqueezy/webhook)
  components/
    admin/               formulario de artículo y controles del panel
  data/                signos y efemérides (contenido estático, no editorial)
  lib/                 Prisma client, NextAuth, permisos de admin, render de contenido
prisma/
  schema.prisma        modelo de datos
  seed.cjs             artículos de ejemplo para poblar la base de datos
```

## 10. Próximos pasos sugeridos

- Escribir tus propios artículos desde `/admin` (mantené la firma y el rol del autor: es lo que
  exige el criterio E-E-A-T de Google).
- Reemplazar los artículos de ejemplo (cargados con `npx prisma db seed`) editándolos o
  eliminándolos desde el panel.
- Cargar tu propio logo/isotipo en `src/components/ConstellationEye.tsx` o como imagen en `/public`.
- Añadir `sitemap.xml` y `robots.txt` cuando el dominio esté definitivo (Next.js los genera
  automáticamente si agregás `src/app/sitemap.ts` y `src/app/robots.ts`).
