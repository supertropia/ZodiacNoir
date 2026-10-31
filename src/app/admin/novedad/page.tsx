import { HomeAnnouncementAdmin } from "@/components/admin/HomeAnnouncementAdmin";
import { getHomeAnnouncement } from "@/lib/announcements";
import { prisma, safeQuery } from "@/lib/prisma";
import { getNovedadStats } from "@/lib/novedad-clicks";

export const metadata = { title: "Novedad de la portada · Panel" };
export const dynamic = "force-dynamic";

export default async function AdminAnnouncementPage() {
  const { enabled, ...content } = await getHomeAnnouncement();
  const stats = await getNovedadStats();
  const products = await safeQuery(() =>
    prisma.product.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      select: { slug: true, title: true },
    })
  );

  return (
    <div>
      <h1 className="font-display text-3xl text-gold-pale">Novedad de la portada</h1>
      <p className="mb-8 mt-2 max-w-2xl font-body text-lg text-gold-pale/85">
        Un aviso destacado en la portada del sitio, por ejemplo para anunciar las agendas en Amazon. Lo muestras o lo ocultas
        cuando quieras con el botón de abajo, sin tocar nada más.
      </p>
      <HomeAnnouncementAdmin enabled={enabled} initial={content} products={products} stats={stats} />
    </div>
  );
}
