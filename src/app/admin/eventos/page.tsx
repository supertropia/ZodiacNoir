import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DeleteEventButton } from "@/components/admin/DeleteEventButton";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const events = await prisma.cosmicEvent.findMany({ orderBy: { eventDate: "asc" } });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl text-gold-pale">Eventos y cuenta regresiva</h1>
        <Link
          href="/admin/eventos/nuevo"
          className="focus-ring rounded-full bg-gold px-5 py-2.5 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright"
        >
          + Nuevo evento
        </Link>
      </div>

      <p className="mb-8 max-w-2xl font-body text-base text-gold-dim">
        El evento activo más próximo se muestra automáticamente en la portada del sitio y en los
        artículos de la categoría "Efemérides".
      </p>

      {events.length === 0 && <p className="font-body text-lg text-gold-dim">Todavía no creaste ningún evento.</p>}

      <div className="space-y-3">
        {events.map((ev) => (
          <div
            key={ev.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gold/15 bg-noir-surface/40 p-5"
          >
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 font-ui text-xs uppercase tracking-wide ${
                    ev.active ? "bg-green-800/40 text-green-300" : "bg-gold/15 text-gold-dim"
                  }`}
                >
                  {ev.active ? "Activo" : "Inactivo"}
                </span>
                <span className="font-ui text-xs text-gold-dim">
                  {new Date(ev.eventDate).toLocaleString("es-AR")}
                </span>
              </div>
              <h3 className="font-display text-lg text-gold-pale">{ev.title}</h3>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/admin/eventos/${ev.id}`}
                className="focus-ring rounded-full border border-gold/40 px-4 py-2 font-ui text-xs uppercase tracking-wide text-gold transition hover:border-gold hover:bg-gold/10"
              >
                Editar
              </Link>
              <DeleteEventButton id={ev.id} title={ev.title} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
