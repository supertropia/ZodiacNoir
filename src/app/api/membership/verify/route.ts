import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyGumroadLicense } from "@/lib/gumroad";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Iniciá sesión para verificar tu membresía." }, { status: 401 });
  }

  try {
    const { licenseKey } = await req.json();
    if (!licenseKey || typeof licenseKey !== "string") {
      return NextResponse.json({ error: "Ingresá tu clave de licencia." }, { status: 400 });
    }

    const result = await verifyGumroadLicense(licenseKey);

    if (!result.valid) {
      return NextResponse.json(
        {
          error: result.cancelled
            ? "Esta membresía fue cancelada o no está activa."
            : result.error || "Clave de licencia inválida.",
        },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        isMember: true,
        membershipLicenseKey: licenseKey.trim(),
        membershipVerifiedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error verificando membresía:", error);
    return NextResponse.json({ error: "Ocurrió un error al verificar la membresía." }, { status: 500 });
  }
}
