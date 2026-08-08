// Controla quién puede acceder al panel de administración.
// Configurar la variable de entorno ADMIN_EMAILS con una lista separada por comas,
// por ejemplo: ADMIN_EMAILS="vos@gmail.com,otra-persona@gmail.com"

export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}
