import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LicenseKeyForm } from "@/components/LicenseKeyForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Membresía" };

export default async function MembershipPage() {
  const session = await getServerSession(authOptions);
  const isMember = Boolean((session?.user as { isMember?: boolean } | undefined)?.isMember);
  const gumroadUrl = process.env.GUMROAD_MEMBERSHIP_URL;

  return (
    <section className="mx-auto max-w-2xl px-5 py-16 text-center">
      <p className="font-ui text-xs uppercase tracking-widest2 text-gold-dim">Hazte miembro</p>
      <h1 className="mt-3 font-display text-4xl text-gold-pale">Acceso premium a Zodiac Noir</h1>
      <p className="mx-auto mt-4 max-w-lg font-body text-lg text-gold-pale/80">
        Los miembros acceden a artículos en profundidad, lecturas extendidas de tránsitos y
        contenido que no publicamos en el sitio abierto.
      </p>

      {isMember ? (
        <div className="mx-auto mt-10 max-w-md rounded-2xl border border-green-700/50 bg-green-900/10 p-6">
          <p className="font-display text-xl text-gold-pale">✓ Ya sos miembro</p>
          <p className="mt-2 font-body text-base text-gold-pale/75">
            Tenés acceso a todo el contenido premium del sitio.
          </p>
        </div>
      ) : (
        <>
          {!session && (
            <p className="mt-8 font-body text-base text-gold-dim">
              Primero{" "}
              <Link href="/ingresar?callbackUrl=/membresia" className="text-gold underline hover:text-gold-bright">
                iniciá sesión con Google
              </Link>{" "}
              para poder activar tu membresía.
            </p>
          )}

          {gumroadUrl && (
            <a
              href={gumroadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring mt-8 inline-block rounded-full bg-gold px-8 py-3.5 font-ui text-sm font-medium uppercase tracking-wide text-noir-bg transition hover:bg-gold-bright"
            >
              Hazte miembro en Gumroad
            </a>
          )}

          {session && (
            <div className="mt-10 flex justify-center">
              <LicenseKeyForm />
            </div>
          )}

          <p className="mx-auto mt-6 max-w-md font-ui text-xs text-gold-dim">
            Después de suscribirte en Gumroad vas a recibir un email con tu clave de licencia.
            Pegala acá arriba para activar el acceso en el sitio.
          </p>
        </>
      )}
    </section>
  );
}
