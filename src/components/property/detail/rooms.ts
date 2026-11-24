/** Gallery filter groups. Staff type free-text room labels; these buckets catch the usual words. */
export const ROOM_GROUPS = ["Living", "Kitchen", "Bedrooms", "Bathrooms", "Exterior", "Views"] as const;
export type RoomGroup = (typeof ROOM_GROUPS)[number];

const RULES: [RegExp, RoomGroup][] = [
  [/bed|master|nursery|guest\s?room/i, "Bedrooms"],
  [/bath|ensuite|en-suite|shower|toilet|powder/i, "Bathrooms"],
  [/kitchen|pantry|laundry|scullery/i, "Kitchen"],
  [/view|balcony|terrace|rooftop|skyline/i, "Views"],
  [/exterior|outside|facade|front|garden|pool|compound|yard|parking|gate|lawn|aerial/i, "Exterior"],
  [/living|lounge|dining|family|sitting|study|office|hall|entrance|foyer/i, "Living"],
];

export function roomGroup(label: string | null): RoomGroup | null {
  if (!label) return null;
  for (const [re, group] of RULES) if (re.test(label)) return group;
  return null;
}
