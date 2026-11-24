/**
 * Well-known places near each area, shown under the map on listing pages.
 * A static list (no third-party lookups, no tracking). Staff/devs can edit
 * freely; areas without an entry simply hide the list. No distances are shown
 * because listing locations are deliberately approximate.
 */

export type NearbyCategory = "school" | "health" | "shopping";

export type NearbyPlace = { name: string; category: NearbyCategory };

export const nearbyCategoryLabels: Record<NearbyCategory, string> = {
  school: "Schools",
  health: "Hospitals",
  shopping: "Shopping",
};

export const NEARBY_PLACES: Record<string, NearbyPlace[]> = {
  kileleshwa: [
    { name: "Kenton College Preparatory School", category: "school" },
    { name: "Kileleshwa Primary School", category: "school" },
    { name: "The Nairobi Hospital", category: "health" },
    { name: "Lavington Mall", category: "shopping" },
    { name: "Yaya Centre", category: "shopping" },
  ],
  westlands: [
    { name: "Aga Khan Academy", category: "school" },
    { name: "Aga Khan University Hospital", category: "health" },
    { name: "MP Shah Hospital", category: "health" },
    { name: "Sarit Centre", category: "shopping" },
    { name: "Westgate Shopping Mall", category: "shopping" },
  ],
  kilimani: [
    { name: "Kilimani Primary School", category: "school" },
    { name: "The Nairobi Hospital", category: "health" },
    { name: "Coptic Hospital", category: "health" },
    { name: "Yaya Centre", category: "shopping" },
    { name: "Prestige Plaza", category: "shopping" },
  ],
  lavington: [
    { name: "Strathmore School", category: "school" },
    { name: "The Nairobi Hospital", category: "health" },
    { name: "Lavington Mall", category: "shopping" },
    { name: "Valley Arcade", category: "shopping" },
  ],
  riverside: [
    { name: "Aga Khan University Hospital", category: "health" },
    { name: "Riverside Square", category: "shopping" },
    { name: "Sarit Centre", category: "shopping" },
    { name: "Westgate Shopping Mall", category: "shopping" },
  ],
  karen: [
    { name: "Hillcrest School", category: "school" },
    { name: "Banda School", category: "school" },
    { name: "Brookhouse School", category: "school" },
    { name: "The Karen Hospital", category: "health" },
    { name: "The Hub Karen", category: "shopping" },
    { name: "Waterfront Karen", category: "shopping" },
  ],
  parklands: [
    { name: "Aga Khan Academy", category: "school" },
    { name: "Aga Khan University Hospital", category: "health" },
    { name: "MP Shah Hospital", category: "health" },
    { name: "Sarit Centre", category: "shopping" },
  ],
  "upper-hill": [
    { name: "The Nairobi Hospital", category: "health" },
    { name: "Kenyatta National Hospital", category: "health" },
    { name: "Yaya Centre", category: "shopping" },
  ],
  runda: [
    { name: "Rosslyn Academy", category: "school" },
    { name: "Two Rivers Mall", category: "shopping" },
    { name: "Village Market", category: "shopping" },
  ],
  "spring-valley": [
    { name: "Aga Khan University Hospital", category: "health" },
    { name: "Westgate Shopping Mall", category: "shopping" },
    { name: "Sarit Centre", category: "shopping" },
  ],
};
