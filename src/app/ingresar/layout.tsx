import type { Metadata } from "next";

// Esta página está bloqueada para buscadores en robots.ts (es transaccional,
// dispara el login de Google, sin contenido de valor editorial). Aun así, le
// damos su propio "canonical" apuntando a sí misma para no heredar por
// accidente el de la home (que es lo que pasaba antes, al no declarar nada acá).
export const metadata: Metadata = {
  title: "Ingresar · Zodiac Noir",
  alternates: { canonical: "/ingresar" },
  robots: { index: false, follow: false },
};

export default function IngresarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
