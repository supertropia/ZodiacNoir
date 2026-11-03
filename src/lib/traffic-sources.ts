// Fuentes de tráfico y links con seguimiento. Este archivo no toca la base de datos, así que lo usan
// tanto el servidor (para clasificar las visitas) como el panel (para armar los links que copias).
//
// Para agregar una fuente nueva más adelante, súmala a la lista TRAFFIC_SOURCES de abajo.

export type TrafficSource = {
  /** Identificador que se guarda en la base de datos. */
  key: string;
  /** Nombre que ves en el panel. */
  label: string;
  /** Valor de utm_source que lleva el link con seguimiento. Vacío si no se puede compartir con link. */
  utm: string;
  /** Valor de utm_medium del link. */
  medium: string;
  /** Otros nombres que puedes haber escrito en utm_source (por ejemplo "ig" para Instagram). */
  aliases: string[];
  /** Sitios desde los que llega la gente cuando el link no tiene utm_source. */
  hosts: string[];
  /** ¿Aparece en el generador de links? */
  shareable: boolean;
};

export const TRAFFIC_SOURCES: TrafficSource[] = [
  { key: "youtube", label: "YouTube", utm: "youtube", medium: "social", aliases: ["yt", "youtube.com"], hosts: ["youtube.com", "youtu.be"], shareable: true },
  { key: "instagram", label: "Instagram", utm: "instagram", medium: "social", aliases: ["ig", "instagram.com"], hosts: ["instagram.com"], shareable: true },
  { key: "facebook", label: "Facebook", utm: "facebook", medium: "social", aliases: ["fb", "facebook.com"], hosts: ["facebook.com", "fb.com", "fb.me"], shareable: true },
  { key: "tiktok", label: "TikTok", utm: "tiktok", medium: "social", aliases: ["tt", "tiktok.com"], hosts: ["tiktok.com"], shareable: true },
  { key: "x", label: "X (Twitter)", utm: "x", medium: "social", aliases: ["twitter", "tw", "x.com"], hosts: ["twitter.com", "x.com", "t.co"], shareable: true },
  { key: "threads", label: "Threads", utm: "threads", medium: "social", aliases: ["threads.net"], hosts: ["threads.net"], shareable: true },
  { key: "whatsapp", label: "WhatsApp", utm: "whatsapp", medium: "social", aliases: ["wa", "whatsapp.com"], hosts: ["whatsapp.com", "wa.me"], shareable: true },
  { key: "telegram", label: "Telegram", utm: "telegram", medium: "social", aliases: ["tg"], hosts: ["t.me", "telegram.org"], shareable: true },
  { key: "pinterest", label: "Pinterest", utm: "pinterest", medium: "social", aliases: ["pin"], hosts: ["pinterest.com", "pin.it"], shareable: true },
  { key: "reddit", label: "Reddit", utm: "reddit", medium: "social", aliases: [], hosts: ["reddit.com"], shareable: true },
  { key: "linkedin", label: "LinkedIn", utm: "linkedin", medium: "social", aliases: ["li"], hosts: ["linkedin.com", "lnkd.in"], shareable: true },
  { key: "newsletter", label: "Newsletter y correo", utm: "newsletter", medium: "email", aliases: ["email", "mail", "correo"], hosts: ["mail.google.com", "outlook.live.com", "outlook.office.com", "mail.yahoo.com"], shareable: true },
  { key: "busqueda", label: "Buscadores (Google, Bing…)", utm: "", medium: "", aliases: ["google", "bing", "organic"], hosts: ["bing.com", "duckduckgo.com", "yahoo.com", "ecosia.org", "search.brave.com", "yandex.com"], shareable: false },
  { key: "directo", label: "Directo (sin fuente)", utm: "", medium: "", aliases: ["direct", "directo"], hosts: [], shareable: false },
  { key: "otros", label: "Otros sitios", utm: "", medium: "", aliases: [], hosts: [], shareable: false },
];

export const SOURCE_LABELS: Record<string, string> = Object.fromEntries(TRAFFIC_SOURCES.map((s) => [s.key, s.label]));

export function sourceLabel(key: string): string {
  return SOURCE_LABELS[key] ?? key;
}

export function isSourceKey(value: unknown): value is string {
  return typeof value === "string" && value in SOURCE_LABELS;
}

export const SHAREABLE_SOURCES = TRAFFIC_SOURCES.filter((s) => s.shareable);

function cleanHost(host: string): string {
  return host.trim().toLowerCase().replace(/^www\./, "").replace(/^(m|l|lm|mobile)\./, "");
}

function matchesHost(host: string, candidate: string): boolean {
  return host === candidate || host.endsWith(`.${candidate}`);
}

function isGoogleSearchHost(host: string): boolean {
  return /^(.+\.)?google\.[a-z]{2,3}(\.[a-z]{2})?$/.test(host);
}

/**
 * Decide la fuente de una visita. Manda el utm_source del link (si lo tiene); si no, el sitio del que llegó
 * la persona (referrer); si no hay ninguno, es una visita directa.
 */
export function classifyTraffic(input: { utmSource?: string | null; referrerHost?: string | null }): string {
  const utm = (input.utmSource ?? "").trim().toLowerCase();
  if (utm) {
    const hit = TRAFFIC_SOURCES.find((s) => s.key === utm || s.utm === utm || s.aliases.includes(utm));
    return hit ? hit.key : "otros";
  }

  const host = cleanHost(input.referrerHost ?? "");
  if (!host) return "directo";

  // El correo se revisa antes que Google, porque mail.google.com también es un sitio de Google.
  const mail = TRAFFIC_SOURCES.find((s) => s.key === "newsletter");
  if (mail && mail.hosts.some((h) => matchesHost(host, h))) return "newsletter";
  if (isGoogleSearchHost(host)) return "busqueda";

  const hit = TRAFFIC_SOURCES.find((s) => s.hosts.some((h) => matchesHost(host, h)));
  return hit ? hit.key : "otros";
}

/** Deja el nombre de campaña en minúsculas, sin tildes ni espacios (máximo 40 caracteres). */
export function sanitizeCampaign(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/** Parámetros de seguimiento que se conservan cuando una dirección redirige a otra. */
export const TRACKING_PARAMS = ["utm_source", "utm_medium", "utm_campaign"] as const;

/** Arma el link con seguimiento: dirección + utm_source + utm_medium (+ utm_campaign). */
export function buildTrackedUrl(origin: string, path: string, sourceKey: string, campaign = ""): string {
  const base = origin.replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const source = TRAFFIC_SOURCES.find((s) => s.key === sourceKey && s.shareable);
  if (!source) return `${base}${cleanPath}`;
  const params = new URLSearchParams({ utm_source: source.utm, utm_medium: source.medium });
  const name = sanitizeCampaign(campaign);
  if (name) params.set("utm_campaign", name);
  const joiner = cleanPath.includes("?") ? "&" : "?";
  return `${base}${cleanPath}${joiner}${params.toString()}`;
}
