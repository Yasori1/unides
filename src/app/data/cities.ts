import citiesJson from './cities.json';

export interface TurkeyCity {
  plaka: string;
  il: string;
}

/** Türkiye illeri (plaka sırasına göre). Kaynak: data/cities.json */
export const TURKEY_CITIES: TurkeyCity[] = citiesJson as TurkeyCity[];

/** Sadece il adları, Türkçe alfabeye göre A–Z sıralı. Dropdown vb. için kullanın. */
export const CITY_NAMES: string[] = [...TURKEY_CITIES.map((c) => c.il)].sort((a, b) =>
  a.localeCompare(b, 'tr')
);
