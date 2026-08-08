export type GeocodeResult = {
  latitude: number;
  longitude: number;
  displayName: string;
};

/**
 * Geocodifica un lugar de nacimiento usando Nominatim (OpenStreetMap), que es gratuito
 * y no requiere API key. Se debe respetar su política de uso: máximo ~1 solicitud por
 * segundo y un User-Agent identificable (ver https://operations.osmfoundation.org/policies/nominatim/).
 */
export async function geocodePlace(query: string): Promise<GeocodeResult | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": "ZodiacNoir/1.0 (contacto: hola@zodiacnoir.com)",
      "Accept-Language": "es",
    },
  });

  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;

  const first = data[0];
  return {
    latitude: parseFloat(first.lat),
    longitude: parseFloat(first.lon),
    displayName: first.display_name,
  };
}
