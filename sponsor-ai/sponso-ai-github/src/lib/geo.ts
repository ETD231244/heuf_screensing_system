export const HELA_DISTRICTS = [
  "Tari-Pori",
  "Komo-Hulia",
  "Koroba-Lake Kopiago",
  "Magarima",
] as const;

export type HelaDistrict = (typeof HELA_DISTRICTS)[number];

export const DISTRICT_LLGS: Record<HelaDistrict, readonly string[]> = {
  "Tari-Pori": ["Tari Urban", "Tagali", "Hayapuga", "Tebi"],
  "Komo-Hulia": ["Komo Rural", "Hulia"],
  "Koroba-Lake Kopiago": ["Koroba", "North Koroba", "Lake Kopiago", "Awi"],
  Magarima: ["Magarima Rural", "Lower Wage", "Upper Wage"],
};

export function llgsForDistrict(districtName?: string | null) {
  if (!districtName) return [];
  return DISTRICT_LLGS[districtName as HelaDistrict] ?? [];
}
