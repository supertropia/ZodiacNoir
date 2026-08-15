export type CosmicEvent = {
  date: string; // ISO date
  type: "eclipse-solar" | "eclipse-lunar" | "luna-nueva" | "luna-llena" | "retrogrado-inicio" | "retrogrado-fin" | "estacion" | "aspecto";
  title: string;
  sign?: string;
  description: string;
};

// Fuente: efemérides públicas (posiciones geocéntricas aproximadas, hora del Pacífico salvo indicación).
// Verificar horas exactas para tu zona horaria antes de publicar.
export const cosmicEvents: CosmicEvent[] = [
  {
    date: "2026-08-12",
    type: "eclipse-solar",
    title: "Eclipse solar total en Leo",
    sign: "Leo",
    description:
      "Luna nueva y eclipse solar total en Leo. Un nuevo capítulo alrededor de la identidad, la creatividad y el reconocimiento.",
  },
  {
    date: "2026-08-27",
    type: "eclipse-lunar",
    title: "Eclipse lunar en Piscis",
    sign: "Piscis",
    description:
      "Luna llena con eclipse lunar en Piscis. Cierre emocional, sueños y asuntos inconclusos que piden ser soltados.",
  },
  {
    date: "2026-08-03",
    type: "estacion",
    title: "Quirón inicia retrogradación",
    sign: "Aries",
    description: "Quirón retrógrado invita a revisar heridas y procesos de sanación en curso.",
  },
  {
    date: "2026-07-26",
    type: "retrogrado-inicio",
    title: "Saturno retrógrado en Aries",
    sign: "Aries",
    description: "Saturno retrograda hasta el 10 de diciembre: revisión de estructuras, compromisos y disciplina personal.",
  },
  {
    date: "2026-09-10",
    type: "luna-nueva",
    title: "Luna nueva en Virgo",
    sign: "Virgo",
    description: "Intenciones ligadas al orden, la salud y el servicio cotidiano.",
  },
  {
    date: "2026-09-10",
    type: "retrogrado-inicio",
    title: "Urano retrógrado en Géminis",
    sign: "Géminis",
    description: "Urano retrograda hasta febrero de 2027: giros mentales y revisión de ideas abandonadas.",
  },
  {
    date: "2026-09-22",
    type: "estacion",
    title: "Equinoccio de septiembre",
    description: "Equilibrio de luz y sombra; punto de inflexión estacional para el hemisferio norte.",
  },
  {
    date: "2026-09-26",
    type: "luna-llena",
    title: "Luna llena en Aries",
    sign: "Aries",
    description: "Impulsos de acción e independencia llegan a su punto máximo.",
  },
  {
    date: "2026-10-10",
    type: "luna-nueva",
    title: "Luna nueva en Libra",
    sign: "Libra",
    description: "Intenciones de vínculo, equilibrio y justicia en las relaciones.",
  },
  {
    date: "2026-10-03",
    type: "retrogrado-inicio",
    title: "Venus retrógrada",
    sign: "Libra",
    description: "Venus retrograda hasta el 14 de noviembre: revisión de vínculos afectivos, valores y finanzas.",
  },
  {
    date: "2026-10-16",
    type: "retrogrado-fin",
    title: "Plutón retoma movimiento directo",
    sign: "Acuario",
    description: "Plutón concluye su retrogradación anual en Acuario, liberando procesos de transformación colectiva.",
  },
  {
    date: "2026-10-24",
    type: "retrogrado-inicio",
    title: "Mercurio retrógrado en Escorpio",
    sign: "Escorpio",
    description: "Mercurio retrograda hasta el 13 de noviembre: comunicación, secretos y procesos emocionales profundos piden revisión.",
  },
  {
    date: "2026-10-25",
    type: "luna-llena",
    title: "Luna llena en Tauro",
    sign: "Tauro",
    description: "Cosecha en torno a la estabilidad material y el placer sensorial.",
  },
  {
    date: "2026-11-08",
    type: "luna-nueva",
    title: "Luna nueva en Escorpio",
    sign: "Escorpio",
    description: "Intenciones de transformación profunda, intimidad y desapego.",
  },
  {
    date: "2026-11-13",
    type: "retrogrado-fin",
    title: "Mercurio retoma movimiento directo",
    sign: "Escorpio",
    description: "Fin de la retrogradación mercurial; buen momento para retomar acuerdos y conversaciones pendientes.",
  },
  {
    date: "2026-11-14",
    type: "retrogrado-fin",
    title: "Venus retoma movimiento directo",
    sign: "Libra",
    description: "Cierre del ciclo introspectivo en el amor y las finanzas personales.",
  },
  {
    date: "2026-11-24",
    type: "luna-llena",
    title: "Luna llena en Géminis",
    sign: "Géminis",
    description: "Ideas y conversaciones postergadas alcanzan claridad.",
  },
  {
    date: "2026-12-08",
    type: "luna-nueva",
    title: "Luna nueva en Sagitario",
    sign: "Sagitario",
    description: "Intenciones de expansión, aprendizaje y sentido de propósito.",
  },
  {
    date: "2026-12-10",
    type: "retrogrado-fin",
    title: "Saturno retoma movimiento directo",
    sign: "Aries",
    description: "Cierre del ciclo de revisión estructural que comenzó en julio.",
  },
  {
    date: "2026-12-12",
    type: "retrogrado-fin",
    title: "Neptuno retoma movimiento directo",
    sign: "Aries",
    description: "Los sueños y proyectos revisados desde julio comienzan a tomar forma concreta.",
  },
  {
    date: "2026-12-13",
    type: "retrogrado-inicio",
    title: "Júpiter inicia retrogradación en Leo",
    sign: "Leo",
    description: "Revisión de la expansión personal, la confianza y los proyectos de reconocimiento iniciados este año.",
  },
  {
    date: "2026-12-21",
    type: "estacion",
    title: "Solsticio de diciembre",
    description: "La noche más larga del año; umbral simbólico de recogimiento antes del renacer solar.",
  },
  {
    date: "2026-12-23",
    type: "luna-llena",
    title: "Superluna llena en Cáncer",
    sign: "Cáncer",
    description: "Cierre del año lunar con foco en el hogar, la familia y la memoria emocional.",
  },
  {
    date: "2026-08-27",
    type: "aspecto",
    title: "Trígono Marte–Júpiter",
    description: "Aspecto armónico entre Marte y Júpiter: impulso, confianza y buena energía para iniciar proyectos.",
  },
  {
    date: "2026-08-31",
    type: "aspecto",
    title: "Trígono Júpiter–Saturno",
    description: "Equilibrio entre expansión y disciplina: buen momento para consolidar proyectos en marcha.",
  },
  {
    date: "2026-10-15",
    type: "aspecto",
    title: "Trígono Sol–Saturno",
    description: "Aspecto de estructura y compromiso: favorece acuerdos, planes a largo plazo y decisiones firmes.",
  },
];

// Nota sobre "aspecto": fechas de aspectos planetarios recopiladas de calendarios astrológicos
// públicos (orbe aproximado ±1 día). Verificar con una efeméride precisa (por ejemplo Swiss
// Ephemeris o Astro.com) antes de publicar, ya que distintas fuentes varían levemente.

export function nextEvent(from: Date = new Date()): CosmicEvent | null {
  const upcoming = cosmicEvents
    .filter((e) => new Date(e.date) >= from)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return upcoming[0] ?? null;
}
