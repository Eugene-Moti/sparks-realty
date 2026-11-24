"use server";

import {
  countProperties,
  getCardsByIds,
  getCompareData,
  getMapPoints,
  searchProperties,
} from "@/lib/queries/search";
import { type FixedFilters, toFilters } from "@/lib/search/filters";
import { LISTING_TYPES, loadSearchParams, type SearchParamsState, serializeSearch } from "@/lib/search/params";

/**
 * Re-parse untrusted client state through the same nuqs parsers the page uses,
 * so server actions only ever see valid, normalised filters.
 */
function sanitize(state: Partial<SearchParamsState>, fixed: FixedFilters) {
  const qs = serializeSearch(state as SearchParamsState);
  const parsed = loadSearchParams(new URLSearchParams(qs.replace(/^\?/, "")));
  const safeFixed: FixedFilters = {
    listing: fixed.listing && LISTING_TYPES.includes(fixed.listing) ? fixed.listing : undefined,
    area: typeof fixed.area === "string" && /^[a-z0-9-]{1,60}$/.test(fixed.area) ? fixed.area : undefined,
  };
  return toFilters(parsed, safeFixed);
}

export async function loadMoreAction(state: Partial<SearchParamsState>, fixed: FixedFilters, page: number) {
  const p = Number.isInteger(page) && page > 1 && page < 200 ? page : 2;
  return searchProperties(sanitize(state, fixed), p);
}

export async function countAction(state: Partial<SearchParamsState>, fixed: FixedFilters) {
  return countProperties(sanitize(state, fixed));
}

export async function mapPointsAction(state: Partial<SearchParamsState>, fixed: FixedFilters) {
  return getMapPoints(sanitize(state, fixed));
}

export async function cardsByIdsAction(ids: unknown) {
  return getCardsByIds(Array.isArray(ids) ? ids.filter((x): x is string => typeof x === "string") : []);
}

export async function compareAction(ids: unknown) {
  return getCompareData(Array.isArray(ids) ? ids.filter((x): x is string => typeof x === "string") : []);
}
