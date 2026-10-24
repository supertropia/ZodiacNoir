// Catálogo de las lecturas personalizadas de Zodiac Noir.
// Es el único lugar donde se definen los precios y los textos de cada lectura: la página
// /lecturas, la portada, los correos y el panel de administración leen de acá.
//
// Los precios se fijan en dólares (USD). Mercado Pago cobra en pesos, así que el monto en ARS
// se calcula en el momento de la compra (ver src/lib/exchange-rate.ts).

/** Plazo mínimo prometido, en horas, desde que se confirma el pago. */
export const READING_DELIVERY_MIN_HOURS = 48;

/**
 * Plazo máximo prometido, en horas, desde que se confirma el pago. Es el que se usa como fecha
 * límite de entrega (deliverBy) de cada pedido y el que marca el atraso en el panel.
 */
export const READING_DELIVERY_HOURS = 72;

/** Cómo se escribe el plazo en los textos del sitio y de los correos. */
export const READING_DELIVERY_WINDOW = `${READING_DELIVERY_MIN_HOURS} a ${READING_DELIVERY_HOURS} horas`;

export type ReadingServiceKey = "carta-natal" | "revolucion-solar";

export type ReadingService = {
  key: ReadingServiceKey;
  name: string;
  /** Texto corto sobre el nombre, en la tarjeta. */
  eyebrow: string;
  priceUsd: number;
  /** Una o dos frases que explican qué es. */
  summary: string;
  /** Qué incluye. Cada línea es un punto de la lista. */
  includes: string[];
  /** Para quién es. */
  idealFor: string;
  /** Texto del botón de la tarjeta. */
  cta: string;
};

export const READING_SERVICES: ReadingService[] = [
  {
    key: "carta-natal",
    name: "Carta natal arquetípica",
    eyebrow: "Tu mapa interior",
    priceUsd: 35,
    summary:
      "Una lectura en profundidad de tu carta de nacimiento desde la astrología humanista y la psicología junguiana: quién eres, qué te mueve y qué te pide integrar.",
    includes: [
      "Tu carta natal ilustrada, con planetas, signos, casas y aspectos principales",
      "Sol, Luna y Ascendente: los tres pilares de tu identidad, leídos como arquetipos",
      "Elementos y modalidades: tu temperamento y cómo recuperas energía",
      "Las casas como escenarios de vida: vocación, vínculos, hogar y recursos",
      "Sombra e integración: Quirón, Plutón y los Nodos lunares como mapa de crecimiento",
      "Un apartado dedicado al área que elijas profundizar",
      "Preguntas de reflexión para llevar la lectura a tu vida cotidiana",
    ],
    idealFor: "Para quien empieza con la astrología o quiere una mirada profunda y honesta de sí mismo.",
    cta: "Pedir mi carta natal",
  },
  {
    key: "revolucion-solar",
    name: "Revolución solar",
    eyebrow: "Tu año, de cumpleaños a cumpleaños",
    priceUsd: 65,
    summary:
      "La revolución solar es la carta del instante en que el Sol vuelve a su posición exacta de nacimiento. Es el mapa simbólico del año que comienza en tu cumpleaños.",
    includes: [
      "Tu carta de revolución solar ilustrada, calculada para el lugar donde estarás en tu cumpleaños",
      "El tema central del año: Ascendente de la revolución y casa donde cae el Sol",
      "Cómo dialoga el año con tu carta natal: planetas angulares y aspectos entre ambas cartas",
      "El clima emocional y relacional del año: la Luna y Venus de la revolución",
      "Los tránsitos clave de los próximos doce meses: eclipses, retrogradaciones y ciclos que tocan tu carta",
      "Un calendario del año con momentos de impulso, pausa y revisión",
      "Un apartado dedicado al área que elijas profundizar",
    ],
    idealFor: "Para quien quiere orientarse en su próximo año, antes o después de su cumpleaños.",
    cta: "Pedir mi revolución solar",
  },
];

export function getReadingService(key: unknown): ReadingService | undefined {
  return READING_SERVICES.find((s) => s.key === key);
}

/** Áreas que la persona puede pedir que se profundicen. */
export const READING_FOCUS_OPTIONS: { value: string; label: string }[] = [
  { value: "general", label: "Una visión general, sin un tema en particular" },
  { value: "vocacion", label: "Vocación, trabajo y propósito" },
  { value: "vinculos", label: "Vínculos y pareja" },
  { value: "sombra", label: "Sombra y crecimiento personal" },
  { value: "transicion", label: "Una etapa de cambio o de crisis" },
  { value: "hogar", label: "Hogar, familia y raíces" },
];

export function getFocusLabel(value: string): string {
  return READING_FOCUS_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export type BirthTimeMode = "exact" | "approx" | "unknown";

export const BIRTH_TIME_OPTIONS: { value: BirthTimeMode; label: string; hint: string }[] = [
  { value: "exact", label: "Exacta", hint: "La conozco por mi acta o certificado de nacimiento" },
  { value: "approx", label: "Aproximada", hint: "Sé más o menos a qué hora nací" },
  { value: "unknown", label: "No la conozco", hint: "Haremos la lectura sin Ascendente ni casas" },
];

export function getBirthTimeLabel(mode: string, time: string | null): string {
  if (mode === "unknown" || !time) return "No la conoce";
  return mode === "approx" ? `${time} (aproximada)` : `${time} (exacta)`;
}

/** Estados de un pedido, con su etiqueta para el panel de administración. */
export const READING_STATUS_LABELS: Record<string, string> = {
  pending: "Esperando el pago",
  paid: "Pagado · por entregar",
  delivered: "Entregado",
  refunded: "Devuelto",
  cancelled: "No iniciado",
};

export function formatUsd(amount: number): string {
  return `USD ${amount.toLocaleString("es-AR")}`;
}

export function formatArs(amount: number): string {
  return `ARS ${amount.toLocaleString("es-AR")}`;
}

/** Fecha y hora en horario de Argentina, por ejemplo "jueves, 22 de octubre de 2026, 08:30". */
export function formatArgentinaDateTime(date: Date): string {
  return date.toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** Fecha AAAA-MM-DD escrita como "5 de marzo de 1990", sin corrimientos por zona horaria. */
export function formatBirthDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("es-AR", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
