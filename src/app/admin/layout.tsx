import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/ingresar?callbackUrl=/admin");
  }
  if (!isAdminEmail(session.user?.email)) {
    redirect("/");
  }

  return (
    <div className="min-h-screen">
      <div className="border-b border-gold/15 bg-noir-surface/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link href="/admin" className="font-display text-lg tracking-widest2 text-gold-pale">
            PANEL <span className="text-gold">ZODIAC NOIR</span>
          </Link>
          <nav className="flex items-center gap-5 font-ui text-sm text-gold-pale/80">
            <Link href="/admin" className="hover:text-gold">Artículos</Link>
            <Link href="/admin/articulos/nuevo" className="hover:text-gold">Nuevo artículo</Link>
            <Link href="/admin/eventos" className="hover:text-gold">Eventos</Link>
            <Link href="/" className="hover:text-gold">Ver sitio ↗</Link>
          </nav>
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-5 py-10">{children}</div>
    </div>
  );
}
