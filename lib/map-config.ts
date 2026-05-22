/** Mapy.cz tile layer URL template. */
export const MAPYCZ_TILES =
  "https://mapserver.mapy.cz/turist-m/{z}-{x}-{y}";

/** Mapy.cz tile attribution. */
export const MAPYCZ_ATTRIBUTION =
  '&copy; <a href="https://mapy.cz" target="_blank" rel="noopener">Mapy.cz</a>';

/** Center of Czech Republic (approx). */
export const CZ_CENTER: [number, number] = [49.8, 15.5];

/** Default zoom for whole Czech Republic. */
export const CZ_ZOOM = 7;

/** Map marker data passed to the map component. */
export interface MapMarker {
  id: string;
  slug: string;
  lat: number;
  lng: number;
  name: string;
  city: string;
  rating: number;
  reviewCount: number;
  phone?: string;
  categories: string[];
  type: "stk" | "servis";
}
