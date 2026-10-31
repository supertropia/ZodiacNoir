import { prisma, safeQuery } from "@/lib/prisma";
import { parseOptionalUrl } from "@/lib/media";
import {
  ANNOUNCEMENT_LIMITS,
  DEFAULT_ANNOUNCEMENT_CONTENT,
  type HomeAnnouncement,
  type HomeAnnouncementContent,
} from "@/lib/announcement-shared";

// La novedad se guarda como un solo texto JSON en la tabla de ajustes del sitio (SiteSetting),
// igual que el interruptor de las lecturas. Por eso no hace falta tocar la base de datos para usarla.
const KEY = "home_announcement";

type Result = { ok: true } | { ok: false; error: string };
type TextField = { ok: true; value: string } | { ok: false; error: string };

function asText(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function parseStored(raw: string | null | undefined): HomeAnnouncement {
  const base: HomeAnnouncement = { ...DEFAULT_ANNOUNCEMENT_CONTENT, enabled: false };
  if (!raw) return base;
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    return {
      enabled: data.enabled === true,
      eyebrow: asText(data.eyebrow, base.eyebrow),
      pill: asText(data.pill, base.pill),
      title: asText(data.title, base.title),
      text: asText(data.text, base.text),
      imageUrl: asText(data.imageUrl, base.imageUrl),
      videoUrl: asText(data.videoUrl, base.videoUrl),
      amazonUrl: asText(data.amazonUrl, base.amazonUrl),
      productSlug: asText(data.productSlug, base.productSlug),
      primaryLabel: asText(data.primaryLabel, base.primaryLabel),
      secondaryLabel: asText(data.secondaryLabel, base.secondaryLabel),
    };
  } catch {
    return base;
  }
}

async function store(value: HomeAnnouncement): Promise<void> {
  const json = JSON.stringify(value);
  await prisma.siteSetting.upsert({
    where: { key: KEY },
    update: { value: json },
    create: { key: KEY, value: json },
  });
}

/** Lo que ve el panel: siempre devuelve la novedad (oculta o visible), con textos de ejemplo la primera vez. */
export async function getHomeAnnouncement(): Promise<HomeAnnouncement> {
  try {
    const row = await safeQuery(() => prisma.siteSetting.findUnique({ where: { key: KEY } }));
    return parseStored(row?.value);
  } catch {
    return { ...DEFAULT_ANNOUNCEMENT_CONTENT, enabled: false };
  }
}

/**
 * Lo que ve el público: la novedad solo si está activada y completa (título y enlace de Amazon).
 * Ante cualquier duda, o si la base falla, devuelve null y la portada queda como siempre.
 */
export async function getPublicHomeAnnouncement(): Promise<HomeAnnouncement | null> {
  const current = await getHomeAnnouncement();
  const amazon = parseOptionalUrl(current.amazonUrl);
  if (!current.enabled || !current.title.trim() || !amazon.ok || !amazon.url) return null;

  // Si el producto elegido ya no existe o está oculto, «Ver por dentro» vuelve a abrir el video (o no se muestra).
  if (current.productSlug) {
    const product = await safeQuery(() =>
      prisma.product.findFirst({ where: { slug: current.productSlug, published: true }, select: { id: true } })
    );
    if (!product) return { ...current, productSlug: "" };
  }
  return current;
}

function readText(value: unknown, max: number, label: string): TextField {
  const text = typeof value === "string" ? value.trim() : "";
  if (text.length > max) return { ok: false, error: `${label} es demasiado largo (máximo ${max} caracteres).` };
  return { ok: true, value: text };
}

/** Guarda los textos, la imagen, el video y el enlace. No cambia si la novedad está visible u oculta. */
export async function saveHomeAnnouncementContent(input: unknown): Promise<Result> {
  if (!input || typeof input !== "object") return { ok: false, error: "No llegaron datos para guardar." };
  const raw = input as Record<string, unknown>;
  const limits = ANNOUNCEMENT_LIMITS;

  const eyebrow = readText(raw.eyebrow, limits.eyebrow, "La palabra sobre el título");
  if (!eyebrow.ok) return eyebrow;
  const pill = readText(raw.pill, limits.pill, "El aviso corto de arriba");
  if (!pill.ok) return pill;
  const title = readText(raw.title, limits.title, "El título");
  if (!title.ok) return title;
  const text = readText(raw.text, limits.text, "El texto");
  if (!text.ok) return text;
  const primary = readText(raw.primaryLabel, limits.label, "El texto del botón principal");
  if (!primary.ok) return primary;
  const secondary = readText(raw.secondaryLabel, limits.label, "El texto del botón «Ver por dentro»");
  if (!secondary.ok) return secondary;

  if (!title.value) return { ok: false, error: "Escribe el título de la novedad." };

  const image = parseOptionalUrl(raw.imageUrl);
  if (!image.ok) return { ok: false, error: "La dirección de la imagen no es válida." };
  const video = parseOptionalUrl(raw.videoUrl);
  if (!video.ok) return { ok: false, error: "La dirección del video no es válida." };
  const amazon = parseOptionalUrl(raw.amazonUrl);
  if (!amazon.ok) return { ok: false, error: "El enlace de Amazon no es válido. Debe empezar con https://" };

  const productSlug = typeof raw.productSlug === "string" ? raw.productSlug.trim() : "";
  if (productSlug) {
    const product = await safeQuery(() =>
      prisma.product.findFirst({ where: { slug: productSlug, published: true }, select: { id: true } })
    );
    if (!product) {
      return { ok: false, error: "El producto elegido ya no está publicado en la tienda. Elige otro o déjalo sin elegir." };
    }
  }

  const current = await getHomeAnnouncement();
  if (current.enabled && !amazon.url) {
    return {
      ok: false,
      error: "No puedes dejar vacío el enlace de Amazon mientras la novedad está visible. Ocúltala primero.",
    };
  }

  const content: HomeAnnouncementContent = {
    eyebrow: eyebrow.value || DEFAULT_ANNOUNCEMENT_CONTENT.eyebrow,
    pill: pill.value,
    title: title.value,
    text: text.value,
    imageUrl: image.url ?? "",
    videoUrl: video.url ?? "",
    amazonUrl: amazon.url ?? "",
    productSlug,
    primaryLabel: primary.value || DEFAULT_ANNOUNCEMENT_CONTENT.primaryLabel,
    secondaryLabel: secondary.value || DEFAULT_ANNOUNCEMENT_CONTENT.secondaryLabel,
  };
  await store({ ...content, enabled: current.enabled });
  return { ok: true };
}

/** Muestra u oculta la novedad en la portada. Para mostrarla tienen que estar guardados el título y el enlace de Amazon. */
export async function setHomeAnnouncementEnabled(enabled: boolean): Promise<Result> {
  const current = await getHomeAnnouncement();
  if (enabled && (!current.title.trim() || !current.amazonUrl.trim())) {
    return { ok: false, error: "Antes de mostrarla, guarda el título y el enlace de Amazon." };
  }
  await store({ ...current, enabled });
  return { ok: true };
}
