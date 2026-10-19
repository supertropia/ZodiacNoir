import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { prisma } from "./prisma";
import { validateEmail } from "./email-validation";
import { sendLoginEmail } from "./auth-email";

// El enlace de ingreso por correo vence a los 15 minutos.
const MAGIC_LINK_MAX_AGE = 15 * 60;
// Mínimo entre un pedido de enlace y el siguiente para el mismo correo (evita que alguien
// use el formulario para llenarle la casilla a otra persona).
const MAGIC_LINK_COOLDOWN = 60;

function loginErrorUrl(code: string): string {
  const base = process.env.NEXTAUTH_URL || "https://zodiacnoirweb.com";
  return `${base}/ingresar?error=${code}`;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      // Google verifica los correos, así que es seguro unir la cuenta de Google con una
      // cuenta creada antes por correo (misma persona, mismo email).
      allowDangerousEmailAccountLinking: true,
    }),
    EmailProvider({
      from: process.env.AUTH_EMAIL_FROM || process.env.NEWSLETTER_FROM,
      maxAge: MAGIC_LINK_MAX_AGE,
      async sendVerificationRequest({ identifier, url }) {
        await sendLoginEmail(identifier, url);
      },
    }),
  ],
  session: {
    strategy: "database",
  },
  pages: {
    signIn: "/ingresar",
    error: "/ingresar",
  },
  callbacks: {
    async signIn({ user, account, email }) {
      // Google no necesita controles extra.
      if (account?.provider !== "email") return true;

      // Este callback se ejecuta dos veces con el ingreso por correo: al PEDIR el enlace y
      // al USARLO. Los controles van solo al pedirlo.
      if (!email?.verificationRequest) return true;

      const check = await validateEmail(user.email);
      if (!check.ok) return loginErrorUrl(check.reason);

      // Espera mínima entre pedidos para el mismo correo.
      const recent = await prisma.verificationToken.findFirst({
        where: {
          identifier: check.email,
          expires: { gt: new Date(Date.now() + (MAGIC_LINK_MAX_AGE - MAGIC_LINK_COOLDOWN) * 1000) },
        },
      });
      if (recent) return loginErrorUrl("EmailEnvioReciente");

      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        (session.user as { id?: string }).id = user.id;
      }
      return session;
    },
  },
};
