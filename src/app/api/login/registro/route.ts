import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateEmail } from "@/lib/email-validation";
import { validateName } from "@/lib/name-validation";

export const dynamic = "force-dynamic";

// Paso previo al envío del enlace de ingreso. Valida los datos EN EL SERVIDOR (lo que
// escribe el navegador nunca se da por bueno) y, si la persona está creando su cuenta,
// guarda su nombre. Después el navegador pide el enlace con signIn("email").
//
// Crear la fila del usuario acá NO da acceso a nada: la cuenta solo se abre cuando la
// persona toca el enlace que le llega a su correo, que prueba que ese correo es suyo.

const MAX_BODY_BYTES = 2000;

function fail(code: string, status = 400) {
  return NextResponse.json({ ok: false, code }, { status });
}

export async function POST(req: Request) {
  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) return fail("Datos");

    let body: Record<string, unknown>;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return fail("Datos");
      body = parsed as Record<string, unknown>;
    } catch {
      return fail("Datos");
    }

    // Campo trampa para robots: si viene completo, fingimos que salió bien sin hacer nada.
    if (typeof body.website === "string" && body.website.length > 0) {
      return NextResponse.json({ ok: true });
    }

    const mode = body.modo === "registro" ? "registro" : "ingreso";

    const emailCheck = await validateEmail(body.email);
    if (!emailCheck.ok) return fail(emailCheck.reason);
    const email = emailCheck.email;

    const existing = await prisma.user.findUnique({ where: { email } });

    if (mode === "ingreso") {
      if (!existing) return fail("NoCuenta", 404);
      return NextResponse.json({ ok: true });
    }

    // Registro: el nombre es obligatorio y se valida.
    const nameCheck = validateName(body.name);
    if (!nameCheck.ok) return fail(nameCheck.code);

    if (!existing) {
      await prisma.user.create({ data: { email, name: nameCheck.name } });
    } else if (!existing.name) {
      // Nunca pisamos un nombre que ya existe (por ejemplo, el que vino de Google).
      await prisma.user.update({ where: { id: existing.id }, data: { name: nameCheck.name } });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error en /api/login/registro:", error);
    return fail("Servidor", 500);
  }
}
