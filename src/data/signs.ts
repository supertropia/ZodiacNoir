// Efemérides astrológicas. TODAS las horas están en UTC (Tiempo Universal Coordinado).
// Para convertir a hora de Argentina hay que restar 3 horas (UTC−3).
//
// Cada evento guarda el momento exacto en `utc` (formato ISO 8601 terminado en "Z"). La fecha que se
// muestra en la web sale de ese mismo valor, así que fecha y hora nunca pueden contradecirse.
//
// Fuentes y verificación (octubre de 2026): posiciones y momentos calculados con Swiss Ephemeris;
// eclipses y fases lunares contrastados con el catálogo de eclipses de la NASA
// (eclipse.gsfc.nasa.gov); estaciones de Quirón de Cafe Astrology (cafeastrology.com), convertidas
// a UTC. Precisión: de 1 a 2 minutos en las horas.

export type CosmicEvent = {
  utc: string; // momento exacto en UTC, ISO 8601 con "Z" (ej. "2026-10-16T02:40:00Z")
  type: "eclipse-solar" | "eclipse-lunar" | "luna-nueva" | "luna-llena" | "retrogrado-inicio" | "retrogrado-fin" | "estacion" | "aspecto";
  title: string;
  sign?: string;
  description: string;
};

export const cosmicEvents: CosmicEvent[] = [
  {
    utc: "2026-08-12T17:45:00Z",
    type: "eclipse-solar",
    title: "Eclipse solar total en Leo",
    sign: "Leo",
    description:
      "Luna nueva y eclipse solar total en Leo. Un nuevo capítulo alrededor de la identidad, la creatividad y el reconocimiento.",
  },
  {
    utc: "2026-08-28T04:12:00Z",
    type: "eclipse-lunar",
    title: "Eclipse lunar en Piscis",
    sign: "Piscis",
    description:
      "Luna llena con eclipse lunar en Piscis. Cierre emocional, sueños y asuntos inconclusos que piden ser soltados.",
  },
  {
    utc: "2026-08-03T20:10:00Z",
    type: "retrogrado-inicio",
    title: "Quirón inicia retrogradación",
    sign: "Tauro",
    description: "Quirón retrógrado invita a revisar heridas y procesos de sanación en curso.",
  },
  {
    utc: "2026-07-26T19:56:00Z",
    type: "retrogrado-inicio",
    title: "Saturno retrógrado en Aries",
    sign: "Aries",
    description: "Saturno retrograda hasta el 10 de diciembre: revisión de estructuras, compromisos y disciplina personal.",
  },
  {
    utc: "2026-09-11T03:27:00Z",
    type: "luna-nueva",
    title: "Luna nueva en Virgo",
    sign: "Virgo",
    description: "Intenciones ligadas al orden, la salud y el servicio cotidiano.",
  },
  {
    utc: "2026-09-10T18:27:00Z",
    type: "retrogrado-inicio",
    title: "Urano retrógrado en Géminis",
    sign: "Géminis",
    description: "Urano retrograda hasta febrero de 2027: giros mentales y revisión de ideas abandonadas.",
  },
  {
    utc: "2026-09-23T00:05:00Z",
    type: "estacion",
    title: "Equinoccio de septiembre",
    description: "Equilibrio de luz y sombra; punto de inflexión estacional para el hemisferio norte.",
  },
  {
    utc: "2026-09-26T16:49:00Z",
    type: "luna-llena",
    title: "Luna llena en Aries",
    sign: "Aries",
    description: "Impulsos de acción e independencia llegan a su punto máximo.",
  },
  {
    utc: "2026-10-10T15:50:00Z",
    type: "luna-nueva",
    title: "Luna nueva en Libra",
    sign: "Libra",
    description: "Intenciones de vínculo, equilibrio y justicia en las relaciones.",
  },
  {
    utc: "2026-10-03T07:15:00Z",
    type: "retrogrado-inicio",
    title: "Venus retrógrada",
    sign: "Escorpio",
    description: "Venus retrograda hasta el 14 de noviembre: revisión de vínculos afectivos, valores y finanzas.",
  },
  {
    utc: "2026-10-16T02:40:00Z",
    type: "retrogrado-fin",
    title: "Plutón retoma movimiento directo",
    sign: "Acuario",
    description: "Plutón concluye su retrogradación anual en Acuario, liberando procesos de transformación colectiva.",
  },
  {
    utc: "2026-10-24T07:12:00Z",
    type: "retrogrado-inicio",
    title: "Mercurio retrógrado en Escorpio",
    sign: "Escorpio",
    description: "Mercurio retrograda hasta el 13 de noviembre: comunicación, secretos y procesos emocionales profundos piden revisión.",
  },
  {
    utc: "2026-10-26T04:11:00Z",
    type: "luna-llena",
    title: "Luna llena en Tauro",
    sign: "Tauro",
    description: "Cosecha en torno a la estabilidad material y el placer sensorial.",
  },
  {
    utc: "2026-11-09T07:02:00Z",
    type: "luna-nueva",
    title: "Luna nueva en Escorpio",
    sign: "Escorpio",
    description: "Intenciones de transformación profunda, intimidad y desapego.",
  },
  {
    utc: "2026-11-13T15:53:00Z",
    type: "retrogrado-fin",
    title: "Mercurio retoma movimiento directo",
    sign: "Escorpio",
    description: "Fin de la retrogradación mercurial; buen momento para retomar acuerdos y conversaciones pendientes.",
  },
  {
    utc: "2026-11-14T00:27:00Z",
    type: "retrogrado-fin",
    title: "Venus retoma movimiento directo",
    sign: "Libra",
    description: "Cierre del ciclo introspectivo en el amor y las finanzas personales.",
  },
  {
    utc: "2026-11-24T14:53:00Z",
    type: "luna-llena",
    title: "Luna llena en Géminis",
    sign: "Géminis",
    description: "Ideas y conversaciones postergadas alcanzan claridad.",
  },
  {
    utc: "2026-12-09T00:51:00Z",
    type: "luna-nueva",
    title: "Luna nueva en Sagitario",
    sign: "Sagitario",
    description: "Intenciones de expansión, aprendizaje y sentido de propósito.",
  },
  {
    utc: "2026-12-10T23:31:00Z",
    type: "retrogrado-fin",
    title: "Saturno retoma movimiento directo",
    sign: "Aries",
    description: "Cierre del ciclo de revisión estructural que comenzó en julio.",
  },
  {
    utc: "2026-12-12T22:17:00Z",
    type: "retrogrado-fin",
    title: "Neptuno retoma movimiento directo",
    sign: "Aries",
    description: "Los sueños y proyectos revisados desde julio comienzan a tomar forma concreta.",
  },
  {
    utc: "2026-12-13T00:56:00Z",
    type: "retrogrado-inicio",
    title: "Júpiter inicia retrogradación en Leo",
    sign: "Leo",
    description: "Revisión de la expansión personal, la confianza y los proyectos de reconocimiento iniciados este año.",
  },
  {
    utc: "2026-12-21T20:50:00Z",
    type: "estacion",
    title: "Solsticio de diciembre",
    description: "La noche más larga del año; umbral simbólico de recogimiento antes del renacer solar.",
  },
  {
    utc: "2026-12-24T01:28:00Z",
    type: "luna-llena",
    title: "Superluna llena en Cáncer",
    sign: "Cáncer",
    description: "Cierre del año lunar con foco en el hogar, la familia y la memoria emocional.",
  },
  {
    utc: "2026-08-31T22:17:00Z",
    type: "aspecto",
    title: "Trígono Júpiter–Saturno",
    description: "Equilibrio entre expansión y disciplina: buen momento para consolidar proyectos en marcha.",
  },
  {
    utc: "2027-01-06T11:00:00Z",
    type: "retrogrado-fin",
    title: "Quirón retoma movimiento directo",
    sign: "Aries",
    description: "Quirón concluye su retrogradación en Aries: los procesos de sanación revisados encuentran una forma más concreta de avanzar.",
  },
  {
    utc: "2027-01-07T20:24:00Z",
    type: "luna-nueva",
    title: "Luna nueva en Capricornio",
    sign: "Capricornio",
    description: "Intenciones de estructura, disciplina y metas a largo plazo para abrir el año.",
  },
  {
    utc: "2027-01-10T12:59:00Z",
    type: "retrogrado-inicio",
    title: "Marte retrógrado en Virgo",
    sign: "Virgo",
    description: "Marte retrograda hasta el 1 de abril, retrocediendo hasta Leo: revisión de rutinas, trabajo y esfuerzo mal dirigido.",
  },
  {
    utc: "2027-01-22T12:17:00Z",
    type: "luna-llena",
    title: "Superluna llena en Leo",
    sign: "Leo",
    description: "Pico de creatividad, romance y reconocimiento; primera superluna del año.",
  },
  {
    utc: "2027-02-06T15:59:00Z",
    type: "eclipse-solar",
    title: "Eclipse solar anular en Acuario",
    sign: "Acuario",
    description: "Luna nueva con eclipse solar anular en Acuario: un comienzo que reordena comunidad, tecnología e independencia.",
  },
  {
    utc: "2027-02-08T12:29:00Z",
    type: "retrogrado-fin",
    title: "Urano retoma movimiento directo",
    sign: "Géminis",
    description: "Urano concluye su retrogradación en Géminis: los giros mentales y las ideas revisadas desde septiembre vuelven a avanzar.",
  },
  {
    utc: "2027-02-09T17:36:00Z",
    type: "retrogrado-inicio",
    title: "Mercurio retrógrado en Piscis",
    sign: "Piscis",
    description: "Mercurio retrograda hasta el 3 de marzo, retrocediendo hasta Acuario: comunicación más intuitiva pero también más confusa.",
  },
  {
    utc: "2027-02-20T23:12:00Z",
    type: "eclipse-lunar",
    title: "Eclipse lunar en Virgo",
    sign: "Virgo",
    description: "Luna llena con eclipse lunar penumbral en Virgo, opuesta al Sol en Piscis: cierre en torno al trabajo, la salud y los detalles.",
  },
  {
    utc: "2027-03-03T12:32:00Z",
    type: "retrogrado-fin",
    title: "Mercurio retoma movimiento directo",
    sign: "Acuario",
    description: "Fin de la retrogradación mercurial en Acuario; buen momento para retomar acuerdos e ideas postergadas.",
  },
  {
    utc: "2027-03-08T09:29:00Z",
    type: "luna-nueva",
    title: "Luna nueva en Piscis",
    sign: "Piscis",
    description: "Intenciones ligadas al descanso, la imaginación y lo espiritual.",
  },
  {
    utc: "2027-03-20T20:24:00Z",
    type: "estacion",
    title: "Equinoccio de marzo",
    description: "Equilibrio de luz y sombra; comienzo simbólico de un nuevo ciclo para el hemisferio norte.",
  },
  {
    utc: "2027-03-22T10:43:00Z",
    type: "luna-llena",
    title: "Luna llena en Libra",
    sign: "Libra",
    description: "Pico en torno a los vínculos y el equilibrio; favorece resolución y justicia en las relaciones.",
  },
  {
    utc: "2027-04-01T14:08:00Z",
    type: "retrogrado-fin",
    title: "Marte retoma movimiento directo",
    sign: "Leo",
    description: "Marte concluye su retrogradación en Leo: la acción vuelve a fluir hacia adelante, con más confianza que antes.",
  },
  {
    utc: "2027-04-06T23:51:00Z",
    type: "luna-nueva",
    title: "Luna nueva en Aries",
    sign: "Aries",
    description: "Impulso de coraje e iniciativa para empezar algo que se venía postergando.",
  },
  {
    utc: "2027-04-13T02:11:00Z",
    type: "retrogrado-fin",
    title: "Júpiter retoma movimiento directo",
    sign: "Leo",
    description: "Júpiter concluye en Leo la retrogradación iniciada en diciembre de 2026: la expansión y la confianza vuelven a tomar impulso.",
  },
  {
    utc: "2027-04-20T22:27:00Z",
    type: "luna-llena",
    title: "Luna llena en Escorpio",
    sign: "Escorpio",
    description: "Pico emocional intenso en torno a la confianza y el cambio; favorece la honestidad y el desapego.",
  },
  {
    utc: "2027-05-06T10:58:00Z",
    type: "luna-nueva",
    title: "Luna nueva en Tauro",
    sign: "Tauro",
    description: "Intenciones prácticas sobre dinero, comodidad y lo que realmente valoramos.",
  },
  {
    utc: "2027-05-08T12:54:00Z",
    type: "retrogrado-inicio",
    title: "Plutón retrógrado en Acuario",
    sign: "Acuario",
    description: "Plutón inicia su retrogradación anual en Acuario, profundizando procesos colectivos de transformación en curso.",
  },
  {
    utc: "2027-05-20T10:59:00Z",
    type: "luna-llena",
    title: "Luna llena en Escorpio",
    sign: "Escorpio",
    description: "Segunda luna llena en Escorpio del ciclo; cosecha en torno a la confianza y los vínculos profundos.",
  },
  {
    utc: "2027-06-04T19:40:00Z",
    type: "luna-nueva",
    title: "Luna nueva en Géminis",
    sign: "Géminis",
    description: "Curiosidad renovada; buen momento para nuevas conversaciones o un aprendizaje breve.",
  },
  {
    utc: "2027-06-10T18:15:00Z",
    type: "retrogrado-inicio",
    title: "Mercurio retrógrado en Cáncer",
    sign: "Cáncer",
    description: "Mercurio retrograda hasta el 4 de julio, retrocediendo hasta Géminis: la comunicación se vuelve más emocional y subjetiva.",
  },
  {
    utc: "2027-06-19T00:44:00Z",
    type: "luna-llena",
    title: "Luna llena en Sagitario",
    sign: "Sagitario",
    description: "Pico de sentido y mirada amplia; favorece viajes, aprendizaje y conclusiones honestas.",
  },
  {
    utc: "2027-06-21T14:10:00Z",
    type: "estacion",
    title: "Solsticio de junio",
    description: "El día más largo del año en el hemisferio norte; punto máximo de luz antes del giro hacia el descenso.",
  },
  {
    utc: "2027-07-04T19:39:00Z",
    type: "retrogrado-fin",
    title: "Mercurio retoma movimiento directo",
    sign: "Géminis",
    description: "Fin de la retrogradación mercurial en Géminis, coincidiendo con la luna nueva del mes.",
  },
  {
    utc: "2027-07-04T03:02:00Z",
    type: "luna-nueva",
    title: "Luna nueva en Cáncer",
    sign: "Cáncer",
    description: "Intenciones tiernas en torno al hogar, la familia y las necesidades emocionales.",
  },
  {
    utc: "2027-07-09T22:41:00Z",
    type: "retrogrado-inicio",
    title: "Neptuno retrógrado en Aries",
    sign: "Aries",
    description: "Neptuno retrograda hasta diciembre en Aries: revisión de sueños, ideales y hacia dónde apunta realmente la voluntad.",
  },
  {
    utc: "2027-07-18T16:03:00Z",
    type: "eclipse-lunar",
    title: "Eclipse lunar en Capricornio",
    sign: "Capricornio",
    description: "Luna llena con eclipse lunar penumbral en Capricornio: cierre en torno a metas, trabajo y responsabilidades sostenidas en el tiempo.",
  },
  {
    utc: "2027-08-02T10:06:00Z",
    type: "eclipse-solar",
    title: "Eclipse solar total en Leo — \"el eclipse del siglo\"",
    sign: "Leo",
    description: "Eclipse solar total en Leo con una de las totalidades más largas del siglo (más de 6 minutos): un reinicio profundo en identidad, liderazgo y autoexpresión.",
  },
  {
    utc: "2027-08-08T02:55:00Z",
    type: "retrogrado-inicio",
    title: "Quirón retrógrado en Tauro",
    sign: "Tauro",
    description: "Quirón inicia su retrogradación anual en Tauro, volviendo a poner el cuerpo y los recursos propios en el centro de la sanación.",
  },
  {
    utc: "2027-08-09T18:05:00Z",
    type: "retrogrado-inicio",
    title: "Saturno retrógrado en Aries",
    sign: "Aries",
    description: "Saturno retrograda hasta el 24 de diciembre en Aries: revisión de estructuras, compromisos e iniciativa personal.",
  },
  {
    utc: "2027-08-17T07:13:00Z",
    type: "eclipse-lunar",
    title: "Eclipse lunar en Acuario",
    sign: "Acuario",
    description: "Luna llena con eclipse lunar penumbral en Acuario, opuesta al Sol en Leo: cierra la temporada de eclipses de 2027.",
  },
  {
    utc: "2027-08-31T17:41:00Z",
    type: "luna-nueva",
    title: "Luna nueva en Virgo",
    sign: "Virgo",
    description: "Reinicio ordenado en torno a la salud, los hábitos y la rutina diaria.",
  },
  {
    utc: "2027-09-15T23:03:00Z",
    type: "luna-llena",
    title: "Luna llena en Piscis",
    sign: "Piscis",
    description: "Pico sensible y onírico; favorece el descanso, el arte y soltar lo que ya cumplió su ciclo.",
  },
  {
    utc: "2027-09-15T09:09:00Z",
    type: "retrogrado-inicio",
    title: "Urano retrógrado en Géminis",
    sign: "Géminis",
    description: "Urano inicia una nueva retrogradación en Géminis que se extiende hasta 2028: giros mentales y revisión de ideas.",
  },
  {
    utc: "2027-09-23T06:01:00Z",
    type: "estacion",
    title: "Equinoccio de septiembre",
    description: "Equilibrio de luz y sombra; punto de inflexión estacional para el hemisferio norte.",
  },
  {
    utc: "2027-09-30T02:36:00Z",
    type: "luna-nueva",
    title: "Luna nueva en Libra",
    sign: "Libra",
    description: "Intenciones de vínculo, equilibrio y belleza en las relaciones.",
  },
  {
    utc: "2027-10-07T14:37:00Z",
    type: "retrogrado-inicio",
    title: "Mercurio retrógrado en Escorpio",
    sign: "Escorpio",
    description: "Mercurio retrograda hasta el 28 de octubre, retrocediendo hasta Libra: comunicación y vínculos piden una revisión honesta.",
  },
  {
    utc: "2027-10-15T13:46:00Z",
    type: "luna-llena",
    title: "Luna llena en Aries",
    sign: "Aries",
    description: "Pico de energía inquieta y necesidad de actuar; favorece soltar la frustración acumulada.",
  },
  {
    utc: "2027-10-18T03:52:00Z",
    type: "retrogrado-fin",
    title: "Plutón retoma movimiento directo",
    sign: "Acuario",
    description: "Plutón concluye su retrogradación anual en Acuario, liberando procesos de transformación colectiva.",
  },
  {
    utc: "2027-10-28T14:10:00Z",
    type: "retrogrado-fin",
    title: "Mercurio retoma movimiento directo",
    sign: "Libra",
    description: "Fin de la retrogradación mercurial en Libra; buen momento para retomar acuerdos y conversaciones pendientes.",
  },
  {
    utc: "2027-10-29T13:36:00Z",
    type: "luna-nueva",
    title: "Luna nueva en Escorpio",
    sign: "Escorpio",
    description: "Reinicio profundo y privado en torno a la intimidad, la confianza y el desapego.",
  },
  {
    utc: "2027-11-14T03:25:00Z",
    type: "luna-llena",
    title: "Luna llena en Tauro",
    sign: "Tauro",
    description: "Cosecha en torno a la estabilidad material y el placer sensorial.",
  },
  {
    utc: "2027-11-28T03:24:00Z",
    type: "luna-nueva",
    title: "Luna nueva en Sagitario",
    sign: "Sagitario",
    description: "Intenciones de expansión, aprendizaje y sentido de propósito.",
  },
  {
    utc: "2027-12-13T16:08:00Z",
    type: "luna-llena",
    title: "Luna llena en Géminis",
    sign: "Géminis",
    description: "Pico de actividad mental; ideas y conversaciones postergadas alcanzan claridad.",
  },
  {
    utc: "2027-12-15T09:06:00Z",
    type: "retrogrado-fin",
    title: "Neptuno retoma movimiento directo",
    sign: "Aries",
    description: "Neptuno concluye su retrogradación en Aries; los sueños revisados desde julio empiezan a tomar forma concreta.",
  },
  {
    utc: "2027-12-22T02:42:00Z",
    type: "estacion",
    title: "Solsticio de diciembre",
    description: "La noche más larga del año; umbral simbólico de recogimiento antes del renacer solar.",
  },
  {
    utc: "2027-12-24T02:47:00Z",
    type: "retrogrado-fin",
    title: "Saturno retoma movimiento directo",
    sign: "Aries",
    description: "Cierre del ciclo de revisión estructural que comenzó en agosto.",
  },
  {
    utc: "2027-12-27T20:12:00Z",
    type: "luna-nueva",
    title: "Luna nueva en Capricornio",
    sign: "Capricornio",
    description: "Reinicio serio en torno a metas, trabajo y estructura para cerrar el año.",
  },
];

/** Fecha del evento (AAAA-MM-DD) en UTC. */
export function eventDateUtc(event: CosmicEvent): string {
  return event.utc.slice(0, 10);
}

/** Momento del evento como número (milisegundos). */
export function eventTime(event: CosmicEvent): number {
  return new Date(event.utc).getTime();
}

/** Todos los eventos, del más próximo al más lejano en el tiempo. */
export function sortedEvents(): CosmicEvent[] {
  return [...cosmicEvents].sort((a, b) => eventTime(a) - eventTime(b));
}

/** Próximo evento (el primero cuyo momento exacto todavía no pasó). */
export function nextEvent(from: Date = new Date()): CosmicEvent | null {
  return sortedEvents().find((e) => eventTime(e) >= from.getTime()) ?? null;
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MESES_LARGO = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** Fecha en UTC, formato corto: "16 oct 2026". */
export function formatEventDateShort(event: CosmicEvent): string {
  const [y, m, d] = eventDateUtc(event).split("-").map(Number);
  return `${String(d).padStart(2, "0")} ${MESES[m - 1]} ${y}`;
}

/** Fecha en UTC, formato largo: "16 de octubre de 2026". */
export function formatEventDateLong(event: CosmicEvent): string {
  const [y, m, d] = eventDateUtc(event).split("-").map(Number);
  return `${d} de ${MESES_LARGO[m - 1]} de ${y}`;
}

/** Hora en UTC: "02:40 UTC". */
export function formatEventTime(event: CosmicEvent): string {
  return `${event.utc.slice(11, 16)} UTC`;
}
