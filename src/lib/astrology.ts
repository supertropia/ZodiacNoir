import { Origin, Horoscope } from "circular-natal-horoscope-js";

export const SIGN_ES: Record<string, string> = {
  aries: "Aries",
  taurus: "Tauro",
  gemini: "Géminis",
  cancer: "Cáncer",
  leo: "Leo",
  virgo: "Virgo",
  libra: "Libra",
  scorpio: "Escorpio",
  sagittarius: "Sagitario",
  capricorn: "Capricornio",
  aquarius: "Acuario",
  pisces: "Piscis",
};

export const PLANET_ES: Record<string, string> = {
  sun: "Sol",
  moon: "Luna",
  mercury: "Mercurio",
  venus: "Venus",
  mars: "Marte",
  jupiter: "Júpiter",
  saturn: "Saturno",
  uranus: "Urano",
  neptune: "Neptuno",
  pluto: "Plutón",
  chiron: "Quirón",
  sirius: "Sirio",
};

const HOUSE_ES = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

export type PlanetPosition = {
  key: string;
  name: string;
  sign: string;
  degreeInSign: number;
  house: number;
  retrograde: boolean;
};

export type NatalChartResult = {
  sun: PlanetPosition;
  moon: PlanetPosition;
  ascendant: { sign: string; degreeInSign: number };
  midheaven: { sign: string; degreeInSign: number };
  planets: PlanetPosition[];
  houseSystem: string;
};

function degreeInSign(ecliptic: number): number {
  return Math.round((ecliptic % 30) * 10) / 10;
}

function buildHoroscope(input: {
  year: number;
  month: number; // 1-12 (humano)
  day: number;
  hour: number;
  minute: number;
  latitude: number;
  longitude: number;
}) {
  const origin = new Origin({
    year: input.year,
    month: input.month - 1, // la librería usa 0-indexado
    date: input.day,
    hour: input.hour,
    minute: input.minute,
    latitude: input.latitude,
    longitude: input.longitude,
  });

  return new Horoscope({
    origin,
    houseSystem: "placidus",
    zodiac: "tropical",
    aspectPoints: ["bodies", "angles"],
    aspectWithPoints: ["bodies", "angles"],
    aspectTypes: ["major"],
    customOrbs: {},
    language: "en",
  });
}

function mapBody(body: any): PlanetPosition {
  const key = body.key;
  return {
    key,
    name: PLANET_ES[key] ?? body.label,
    sign: SIGN_ES[body.Sign.key] ?? body.Sign.label,
    degreeInSign: degreeInSign(body.ChartPosition.Ecliptic.DecimalDegrees),
    house: body.House?.id ?? 0,
    retrograde: Boolean(body.isRetrograde),
  };
}

/** Calcula la carta natal completa a partir de fecha, hora y coordenadas de nacimiento. */
export function calculateNatalChart(input: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  latitude: number;
  longitude: number;
}): NatalChartResult {
  const h = buildHoroscope(input);

  const planets = h.CelestialBodies.all
    .filter((b: any) => PLANET_ES[b.key])
    .map(mapBody);

  const sun = planets.find((p) => p.key === "sun")!;
  const moon = planets.find((p) => p.key === "moon")!;

  return {
    sun,
    moon,
    ascendant: {
      sign: SIGN_ES[h.Angles.ascendant.Sign.key] ?? h.Angles.ascendant.Sign.label,
      degreeInSign: degreeInSign(h.Angles.ascendant.ChartPosition.Ecliptic.DecimalDegrees),
    },
    midheaven: {
      sign: SIGN_ES[h.Angles.midheaven.Sign.key] ?? h.Angles.midheaven.Sign.label,
      degreeInSign: degreeInSign(h.Angles.midheaven.ChartPosition.Ecliptic.DecimalDegrees),
    },
    planets,
    houseSystem: "Placidus",
  };
}

/** Tránsitos de hoy: posiciones planetarias actuales (el signo no depende del lugar de observación). */
export function calculateDailyTransits(date: Date = new Date()) {
  const h = buildHoroscope({
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
    latitude: 51.4769, // Greenwich — el signo no depende de la ubicación, solo la casa
    longitude: 0,
  });

  return h.CelestialBodies.all.filter((b: any) => PLANET_ES[b.key]).map(mapBody);
}

export function romanHouse(n: number): string {
  return HOUSE_ES[n - 1] ?? String(n);
}
