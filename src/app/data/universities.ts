import universitiesByCityJson from './universities-by-city.json';

export type UniversitiesByCityMap = Record<string, string[]>;

/** Şehre göre üniversiteler. Kaynak: data/universities-by-city.json */
export const UNIVERSITIES_BY_CITY: UniversitiesByCityMap =
  universitiesByCityJson as UniversitiesByCityMap;

export function getUniversitiesByCity(city: string | null | undefined): string[] {
  if (!city) return [];
  return UNIVERSITIES_BY_CITY[city] ?? [];
}
