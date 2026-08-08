export type Sign = {
  slug: string;
  name: string;
  glyph: string;
  dates: string;
  element: "Fuego" | "Tierra" | "Aire" | "Agua";
  modality: "Cardinal" | "Fijo" | "Mutable";
  ruler: string;
  keyword: string;
  summary: string;
};

export const signs: Sign[] = [
  { slug: "aries", name: "Aries", glyph: "♈", dates: "21 mar – 19 abr", element: "Fuego", modality: "Cardinal", ruler: "Marte", keyword: "Iniciar", summary: "Impulso, coraje y la energía del comienzo puro." },
  { slug: "tauro", name: "Tauro", glyph: "♉", dates: "20 abr – 20 may", element: "Tierra", modality: "Fijo", ruler: "Venus", keyword: "Sostener", summary: "Placer, estabilidad y una relación honesta con el cuerpo." },
  { slug: "geminis", name: "Géminis", glyph: "♊", dates: "21 may – 20 jun", element: "Aire", modality: "Mutable", ruler: "Mercurio", keyword: "Conectar", summary: "Curiosidad, palabra y la mente que teje vínculos." },
  { slug: "cancer", name: "Cáncer", glyph: "♋", dates: "21 jun – 22 jul", element: "Agua", modality: "Cardinal", ruler: "Luna", keyword: "Proteger", summary: "Memoria, hogar y la marea emocional que nutre." },
  { slug: "leo", name: "Leo", glyph: "♌", dates: "23 jul – 22 ago", element: "Fuego", modality: "Fijo", ruler: "Sol", keyword: "Brillar", summary: "Creatividad, orgullo sano y el deseo de ser visto." },
  { slug: "virgo", name: "Virgo", glyph: "♍", dates: "23 ago – 22 sep", element: "Tierra", modality: "Mutable", ruler: "Mercurio", keyword: "Refinar", summary: "Servicio, discernimiento y el detalle que ordena el caos." },
  { slug: "libra", name: "Libra", glyph: "♎", dates: "23 sep – 22 oct", element: "Aire", modality: "Cardinal", ruler: "Venus", keyword: "Equilibrar", summary: "Belleza, justicia y el arte del vínculo recíproco." },
  { slug: "escorpio", name: "Escorpio", glyph: "♏", dates: "23 oct – 21 nov", element: "Agua", modality: "Fijo", ruler: "Plutón", keyword: "Transformar", summary: "Intensidad, verdad oculta y la capacidad de renacer." },
  { slug: "sagitario", name: "Sagitario", glyph: "♐", dates: "22 nov – 21 dic", element: "Fuego", modality: "Mutable", ruler: "Júpiter", keyword: "Expandir", summary: "Sentido, viaje y la fe en un horizonte más amplio." },
  { slug: "capricornio", name: "Capricornio", glyph: "♑", dates: "22 dic – 19 ene", element: "Tierra", modality: "Cardinal", ruler: "Saturno", keyword: "Construir", summary: "Disciplina, tiempo largo y la autoridad que se gana." },
  { slug: "acuario", name: "Acuario", glyph: "♒", dates: "20 ene – 18 feb", element: "Aire", modality: "Fijo", ruler: "Urano", keyword: "Innovar", summary: "Comunidad, ruptura y una mirada hacia el futuro." },
  { slug: "piscis", name: "Piscis", glyph: "♓", dates: "19 feb – 20 mar", element: "Agua", modality: "Mutable", ruler: "Neptuno", keyword: "Disolver", summary: "Intuición, arte y la disolución de los límites del yo." },
];

export function getSign(slug: string) {
  return signs.find((s) => s.slug === slug);
}
