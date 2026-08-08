import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { isAdminEmail } from "./admin";

/** Devuelve la sesión si el usuario es admin, o null si no tiene permiso. */
export async function requireAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminEmail(session.user?.email)) return null;
  return session;
}
