import { NextResponse } from "next/server";
import { geocodePlace } from "@/lib/geocode";
import { calculateNatalChart } from "@/lib/astrology";

export async function POST(req: Request) {
  try {
    const { birthDate, birthTime, birthPlace } = await req.json();

    if (!birthDate || !birthTime || !birthPlace) {
      return NextResponse.json({ error: "Completá fecha, hora y lugar de nacimiento." }, { status: 400 });
    }

    const [year, month, day] = birthDate.split("-").map(Number);
    const [hour, minute] = birthTime.split(":").map(Number);

    if (!year || !month || !day || Number.isNaN(hour) || Number.isNaN(minute)) {
      return NextResponse.json({ error: "Fecha u hora inválida." }, { status: 400 });
    }

    const location = await geocodePlace(birthPlace);
    if (!location) {
      return NextResponse.json(
        { error: "No pudimos encontrar ese lugar. Probá con una ciudad y país más específicos, ej. 'Rosario, Argentina'." },
        { status: 404 }
      );
    }

    const chart = calculateNatalChart({
      year,
      month,
      day,
      hour,
      minute,
      latitude: location.latitude,
      longitude: location.longitude,
    });

    return NextResponse.json({
      chart,
      location: { displayName: location.displayName, latitude: location.latitude, longitude: location.longitude },
    });
  } catch (error) {
    console.error("Error calculando carta natal:", error);
    return NextResponse.json({ error: "No pudimos calcular la carta. Intentá de nuevo." }, { status: 500 });
  }
}
