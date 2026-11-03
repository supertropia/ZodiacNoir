import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/require-admin";
import { isLikelyBot } from "@/lib/views";
import { classifyTraffic, sanitizeCampaign } from "@/lib/traffic-sources";
import { normalizeTrackedPath, recordPageView } from "@/lib/site-traffic";

export const dynamic = "force-dynamic";

/**
 * Registra una visita de cualquier página del sitio. La llama el navegador de la visitante
 * (componente SiteTracker). No cuenta: tus propias visitas como administradora, robots, el panel
 * de administración ni direcciones inventadas. Nunca devuelve un error a la visitante: si algo
 * falla, simplemente no se cuenta.
 */
export async function POST(req: Request) {
  try {
    if (isLikelyBot(req.headers.get("user-agent"))) {
      return NextResponse.json({ counted: false });
    }

    const body = (await req.json().catch(() => null)) as {
      path?: unknown;
      utm?: unknown;
      campaign?: unknown;
      ref?: unknown;
      entry?: unknown;
    } | null;
    if (!body) return NextResponse.json({ counted: false });

    if (await requireAdminSession()) {
      return NextResponse.json({ counted: false });
    }

    const path = await normalizeTrackedPath(body.path);
    if (!path) return NextResponse.json({ counted: false });

    const source = classifyTraffic({
      utmSource: typeof body.utm === "string" ? body.utm.slice(0, 60) : "",
      referrerHost: typeof body.ref === "string" ? body.ref.slice(0, 120) : "",
    });
    const campaign = sanitizeCampaign(body.campaign);

    await recordPageView({ path, source, campaign, entry: body.entry === true });
    return NextResponse.json({ counted: true });
  } catch (error) {
    console.error("Error registrando visita del sitio:", error);
    return NextResponse.json({ counted: false });
  }
}
