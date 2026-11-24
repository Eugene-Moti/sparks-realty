import type { Furnishing, ListingStatus, ListingType, PropertyType } from "@/types/db";

export const listingTypeLabels: Record<ListingType, string> = {
  sale: "For sale",
  rent: "To rent",
  short_stay: "Short stay",
};

/** Public entry route per listing type. */
export const listingTypeRoutes: Record<ListingType, string> = {
  sale: "/buy",
  rent: "/rent",
  short_stay: "/short-stays",
};

export const propertyTypeLabels: Record<PropertyType, string> = {
  apartment: "Apartment",
  maisonette: "Maisonette",
  townhouse: "Townhouse",
  villa: "Villa",
  bungalow: "Bungalow",
  penthouse: "Penthouse",
  studio: "Studio",
  duplex: "Duplex",
  land: "Land",
  commercial: "Commercial",
  office: "Office",
};

export const propertyTypeOptions = (Object.keys(propertyTypeLabels) as PropertyType[]).map((value) => ({
  value,
  label: propertyTypeLabels[value],
}));

/** Ribbon text for statuses that are visible but no longer available. */
export const statusRibbons: Partial<Record<ListingStatus, string>> = {
  under_offer: "Under offer",
  sold: "Sold",
  let: "Let",
};

export const furnishingLabels: Record<Furnishing, string> = {
  unfurnished: "Unfurnished",
  semi_furnished: "Semi-furnished",
  furnished: "Furnished",
};

/** Detail page URL for a listing. */
export function listingHref(listingType: ListingType, slug: string): string {
  return listingType === "short_stay" ? `/short-stays/${slug}` : `/properties/${slug}`;
}
