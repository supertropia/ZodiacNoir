// Carga los artículos de muestra en la base de datos.
// Ejecutar con: npx prisma db seed
// (o directamente: node prisma/seed.cjs)

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const articles = [
  {
    slug: "eclipse-solar-total-leo-agosto-2026",
    title: "Eclipse solar total en Leo: qué significa el 12 de agosto",
    excerpt:
      "El primer eclipse solar total en más de dos años cae en Leo. Repasamos qué mueve en cada signo y cómo trabajar con esta energía sin dramatismo.",
    category: "efemerides",
    sign: "Leo",
    authorName: "Zodiac Noir",
    authorRole: "Equipo editorial",
    readingTimeMin: 6,
    published: true,
    publishedAt: new Date("2026-07-30"),
    content: [
      "El 12 de agosto de 2026 la Luna nueva coincide con un eclipse solar total en el signo de Leo, visible como totalidad en el Ártico, Groenlandia, Islandia y el norte de España. Astrológicamente, los eclipses en el eje Leo–Acuario suelen marcar el inicio o cierre de ciclos de dos a tres años relacionados con la identidad, la creatividad y el lugar que ocupamos frente a un grupo.",
      "A diferencia de una luna nueva común, un eclipse solar tiende a traer noticias o decisiones que no estaban del todo bajo nuestro control: una oportunidad que aparece antes de lo previsto, un reconocimiento inesperado, o la necesidad de soltar una versión de nosotros mismos que ya cumplió su función.",
      "En la práctica, sugerimos no forzar decisiones irreversibles en la semana exacta del eclipse (entre el 5 y el 19 de agosto aproximadamente) y, en cambio, observar qué información nueva aparece. Leo rige el corazón, el juego y la autoexpresión: la pregunta útil es '¿dónde dejé de brillar por miedo a exponerme?'",
      "Si tenés planetas personales (Sol, Luna, Ascendente, Mercurio, Venus o Marte) entre los 15° y 25° de Leo, Acuario, Tauro o Escorpio, es probable que sientas este eclipse con más intensidad en tu carta natal.",
    ].join("\n\n"),
  },
  {
    slug: "mercurio-retrogrado-escorpio-octubre-noviembre-2026",
    title: "Mercurio retrógrado en Escorpio: guía sin pánico (24 oct – 13 nov)",
    excerpt:
      "La tercera y última retrogradación de Mercurio en 2026 ocurre en Escorpio. Qué revisar, qué evitar firmar y por qué no es momento de forzar respuestas.",
    category: "efemerides",
    sign: "Escorpio",
    authorName: "Zodiac Noir",
    authorRole: "Equipo editorial",
    readingTimeMin: 5,
    published: true,
    publishedAt: new Date("2026-08-01"),
    content: [
      "Mercurio inicia su retrogradación el 24 de octubre a 20°58' de Escorpio y retoma movimiento directo el 13 de noviembre a 5°02' del mismo signo, cerrando su sombra posterior recién el 29 de noviembre.",
      "Escorpio es un signo de agua fijo: gobierna lo que no se dice a la ligera —dinero compartido, intimidad, poder, duelos pendientes—. Durante este ciclo es común que resurjan conversaciones o personas del pasado vinculadas a estos temas, no para repetir el conflicto sino para cerrarlo con información que antes faltaba.",
      "Recomendación práctica: revisá contratos y transferencias importantes con una lectura extra antes de firmar, y si una conversación se siente cargada, preguntate si realmente necesita resolverse esta semana o si conviene esperar al 14 de noviembre.",
      "No todo mercurio retrógrado es caótico. Muchas personas reportan mayor intuición y capacidad de investigación durante este tránsito: es un buen momento para terapia, escritura personal o revisar finanzas compartidas con calma.",
    ].join("\n\n"),
  },
  {
    slug: "luna-la-carta-del-tarot-que-mas-incomoda",
    title: "La Luna en el tarot: la carta que incomoda porque no miente",
    excerpt:
      "De todo el Arcano Mayor, La Luna es la carta que menos certezas ofrece. Por qué eso es, precisamente, su mayor honestidad.",
    category: "tarot",
    sign: null,
    authorName: "Zodiac Noir",
    authorRole: "Equipo editorial",
    readingTimeMin: 5,
    published: true,
    publishedAt: new Date("2026-08-02"),
    content: [
      "Cuando La Luna aparece en una tirada, la reacción más común es la incomodidad. A diferencia de El Sol o La Estrella, no promete claridad: dos torres, un camino que se pierde en la distancia, un cangrejo saliendo del agua y dos animales aullando bajo una luna con rostro humano.",
      "En mi lectura, La Luna no habla de mentira sino de información incompleta. Señala una zona donde todavía no tenés todos los datos para decidir, y donde el instinto —no el análisis— es la herramienta más confiable por ahora.",
      "Una forma útil de trabajar esta carta cuando sale en una consulta: en lugar de preguntar '¿qué significa?', preguntar '¿qué es lo que todavía no puedo ver con claridad en esta situación?'. La respuesta suele ser más honesta que cualquier interpretación de manual.",
      "La Luna también es la carta de los sueños recurrentes y la memoria del cuerpo. Si aparece junto a cartas de la corte, muchas veces indica que una persona concreta está actuando desde un lugar de miedo o desde información que no está compartiendo del todo.",
    ].join("\n\n"),
  },
  {
    slug: "escorpio-el-signo-del-renacimiento",
    title: "Escorpio: el signo que necesita morir un poco para seguir viviendo",
    excerpt:
      "Más allá del estereotipo de la intensidad, Escorpio es el signo de la transformación real: la que exige soltar una versión propia para sostener otra.",
    category: "signos",
    sign: "Escorpio",
    authorName: "Zodiac Noir",
    authorRole: "Equipo editorial",
    readingTimeMin: 4,
    published: true,
    publishedAt: new Date("2026-08-03"),
    content: [
      "Escorpio suele reducirse a los clichés de la pasión y los celos, pero su símbolo más antiguo no es el escorpión sino el ave fénix: la capacidad de reducirse a cenizas y volver a levantarse con otra forma.",
      "Regido tradicionalmente por Marte y en astrología moderna también por Plutón, es un signo de agua fijo: siente con la misma profundidad que Cáncer o Piscis, pero sostiene esa intensidad en el tiempo en lugar de dejarla fluir.",
      "En consulta, las personas con Sol, Luna o Ascendente en Escorpio suelen describir períodos de la vida marcados por 'antes y después': una pérdida, una mudanza radical, una ruptura que a la larga resultó necesaria. No buscan el drama; el drama los busca a ellos porque su proceso de cambio rara vez es silencioso.",
      "La lección de Escorpio para cualquier carta natal es que hay cosas que solo se resuelven soltando, no controlando. Es el signo que enseña que la transformación real duele antes de aliviar.",
    ].join("\n\n"),
  },
  {
    slug: "saturno-retrogrado-aries-disciplina",
    title: "Saturno retrógrado en Aries: la disciplina que no se impone, se elige",
    excerpt:
      "Entre julio y diciembre de 2026, Saturno revisa sus propias reglas en el signo del impulso. Una lectura sobre estructura sin rigidez.",
    category: "efemerides",
    sign: "Aries",
    authorName: "Zodiac Noir",
    authorRole: "Equipo editorial",
    readingTimeMin: 5,
    published: true,
    publishedAt: new Date("2026-08-04"),
    content: [
      "Saturno estacionó retrógrado el 26 de julio de 2026 en 14°45' de Aries y retomará movimiento directo el 10 de diciembre, en el mismo grado. Es un tránsito largo — casi cinco meses — que invita a revisar en qué áreas la disciplina se volvió rigidez, y en cuáles, en cambio, hace falta más estructura.",
      "Aries es el signo del impulso puro; Saturno, el planeta de los límites y el tiempo. Su combinación no es cómoda: durante este período muchas personas sienten que su iniciativa choca con obstáculos concretos —burocracia, demoras, la necesidad de pedir permiso donde antes actuaban solas.",
      "La lectura más útil no es 'todo se frena', sino 'todo lo que se construya ahora tiene que sostenerse con método, no solo con entusiasmo'. Los proyectos iniciados con bases sólidas durante este tránsito tienden a durar; los que se apoyan solo en impulso, no.",
      "Diciembre marca el cierre de este ciclo de revisión: es un buen momento para evaluar qué estructuras nuevas vale la pena mantener y cuáles fueron solo un aprendizaje temporal.",
    ].join("\n\n"),
  },
];

async function main() {
  for (const article of articles) {
    await prisma.article.upsert({
      where: { slug: article.slug },
      update: article,
      create: article,
    });
    console.log(`✓ ${article.slug}`);
  }

  // Los planes de membresía y los productos (PDFs) ahora se cargan desde el panel:
  // /admin/planes y /admin/productos. Este seed ya no los precarga para evitar
  // duplicados con IDs de variante inventados.
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
