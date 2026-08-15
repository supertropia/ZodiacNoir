import { NextResponse } from "next/server";

// Google AdSense exige un archivo ads.txt en la raíz del dominio con tu Publisher ID.
// Configurá NEXT_PUBLIC_ADSENSE_CLIENT="ca-pub-XXXXXXXXXXXXXXXX" en tus variables de entorno.
export async function GET() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const pubId = client?.replace("ca-pub-", "");
  const body = pubId
    ? `google.com, pub-${pubId}, DIRECT, f08c47fec0942fa0`
    : "# Configurá NEXT_PUBLIC_ADSENSE_CLIENT para generar este archivo automáticamente.";

  return new NextResponse(body, { headers: { "Content-Type": "text/plain" } });
}
