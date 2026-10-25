import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/ingresar?callbackUrl=/admin");
  }
  if (!isAdminEmail(session.user?.email)) {
    redirect("/");
  }

  // Lecturas pagadas que todavía no se entregaron (para el aviso en el menú).
  let pendingReadings = 0;
  try {
    pendingReadings = await prisma.readingOrder.count({ where: { status: "paid" } });
  } catch {
    pendingReadings = 0;
  }

  return (
    <div className="min-h-screen">
      <div className="border-b border-gold/15 bg-noir-surface/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link href="/admin" className="font-display text-lg tracking-widest2 text-gold-pale">
            PANEL <span className="text-gold">ZODIAC NOIR</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-5 font-ui text-sm text-gold-pale/80">
            <Link href="/admin" className="hover:text-gold">Artículos</Link>
            <Link href="/admin/lecturas" className="hover:text-gold">
              Lecturas
              {pendingReadings > 0 && (
                <span className="ml-1.5 rounded-full bg-gold px-2 py-0.5 text-xs font-medium text-noir-bg">
                  {pendingReadings}
                </span>
              )}
            </Link>
            <Link href="/admin/planes" className="hover:text-gold">Membresías</Link>
            <Link href="/admin/productos" className="hover:text-gold">Productos</Link>
            <Link href="/admin/pagos" className="hover:text-gold">Pagos</Link>
            <Link href="/" className="hover:text-gold">Ver sitio ↗</Link>
          </nav>
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-5 py-10">{children}</div>
    </div>
  );
}
