/**
 * URL search params for /properties, /buy, /rent, /short-stays and /areas/[slug].
 * Shared by the server (createLoader) and the client (useQueryStates).
 * Import from "nuqs/server" so this file carries no "use client" directive.
 */
import {
  createLoader,
  createSerializer,
  type inferParserType,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

export const LISTING_TYPES = ["sale", "rent", "short_stay"] as const;
export const PROPERTY_TYPES = [
  "apartment",
  "maisonette",
  "townhouse",
  "villa",
  "bungalow",
  "penthouse",
  "studio",
  "duplex",
  "land",
  "commercial",
  "office",
] as const;
export const FURNISHINGS = ["unfurnished", "semi_furnished", "furnished"] as const;
export const SORTS = ["newest", "price_asc", "price_desc", "popular"] as const;
export const VIEWS = ["grid", "list", "map"] as const;

export type SortKey = (typeof SORTS)[number];
export type ViewKey = (typeof VIEWS)[number];

export const searchParsers = {
  listing: parseAsStringLiteral(LISTING_TYPES),
  area: parseAsArrayOf(parseAsString).withDefault([]),
  type: parseAsArrayOf(parseAsStringLiteral(PROPERTY_TYPES)).withDefault([]),
  minPrice: parseAsInteger,
  maxPrice: parseAsInteger,
  beds: parseAsInteger,
  baths: parseAsInteger,
  furnishing: parseAsArrayOf(parseAsStringLiteral(FURNISHINGS)).withDefault([]),
  amenities: parseAsArrayOf(parseAsString).withDefault([]),
  available: parseAsString,
  q: parseAsString,
  checkIn: parseAsString,
  checkOut: parseAsString,
  guests: parseAsInteger,
  sort: parseAsStringLiteral(SORTS).withDefault("newest"),
  view: parseAsStringLiteral(VIEWS).withDefault("grid"),
};

export type SearchParamsState = inferParserType<typeof searchParsers>;

export const loadSearchParams = createLoader(searchParsers);
export const serializeSearch = createSerializer(searchParsers);

/** Params that change the result set (everything except view). */
export const FILTER_KEYS = [
  "listing",
  "area",
  "type",
  "minPrice",
  "maxPrice",
  "beds",
  "baths",
  "furnishing",
  "amenities",
  "available",
  "q",
  "checkIn",
  "checkOut",
  "guests",
] as const satisfies readonly (keyof SearchParamsState)[];

export const emptySearchState: SearchParamsState = {
  listing: null,
  area: [],
  type: [],
  minPrice: null,
  maxPrice: null,
  beds: null,
  baths: null,
  furnishing: [],
  amenities: [],
  available: null,
  q: null,
  checkIn: null,
  checkOut: null,
  guests: null,
  sort: "newest",
  view: "grid",
};
