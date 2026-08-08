import { prisma } from "./prisma";

export async function getNextActiveEvent() {
  return prisma.cosmicEvent.findFirst({
    where: { active: true, eventDate: { gte: new Date() } },
    orderBy: { eventDate: "asc" },
  });
}
