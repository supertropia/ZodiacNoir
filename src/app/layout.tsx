import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Cinzel, Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CopyProtection } from "@/components/CopyProtection";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";

const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel", weight: ["400", "600", "700"] });
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});
const jost = Jost({ subsets: ["latin"], variable: "--font-jost", weight: ["400", "500", "600"] });

// Sin esto, los navegadores de celular asumen que el sitio está pensado para
// escritorio (~980px de ancho) y lo "achican a la fuerza" para que entre en
// la pantalla, obligando al usuario a pellizcar/zoomear para leer cómodo.
// Con esto, el celular renderiza la página a su ancho real desde el vamos.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://zodiacnoirweb.com"),
  title: {
    default: "Zodiac Noir — Astrología revelada",
    template: "%s · Zodiac Noir",
  },
  description:
    "Astrología, tarot y psicología astrológica escritos por personas para personas: lunaciones, eclipses, aspectos planetarios y guías de los doce signos.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Zodiac Noir",
    description: "Revelando lo invisible. Astrología, tarot y efemérides con criterio editorial.",
    type: "website",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Solo la cuenta de administración puede copiar texto y sacar capturas; el resto (miembros incluidos) no.
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase() ?? null;
  const allowCopy = email === "zodiac.noir1@gmail.com" || isAdminEmail(email);

  return (
    <html lang="es" data-theme="day" data-fontsize="md" className={`${cinzel.variable} ${cormorant.variable} ${jost.variable}`}>
      <body className="bg-velvet min-h-screen font-body">
        <CopyProtection allowCopy={allowCopy} />
        {process.env.NEXT_PUBLIC_ADSENSE_CLIENT && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
        <Providers>
          <Header />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
