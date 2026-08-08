import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EventForm } from "@/components/admin/EventForm";

export const dynamic = "force-dynamic";

function toDateTimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default async function EditEventPage({ params }: { params: { id: string } }) {
  const event = await prisma.cosmicEvent.findUnique({ where: { id: params.id } });
  if (!event) notFound();

  return (
    <div>
      <h1 className="mb-8 font-display text-3xl text-gold-pale">Editar evento</h1>
      <EventForm
        initial={{
          id: event.id,
          title: event.title,
          subtitle: event.subtitle ?? "",
          description: event.description ?? "",
          eventDate: toDateTimeLocal(new Date(event.eventDate)),
          articleSlug: event.articleSlug ?? "",
          guideUrl: event.guideUrl ?? "",
          active: event.active,
        }}
      />
    </div>
  );
}
