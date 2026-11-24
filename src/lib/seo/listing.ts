import { absoluteUrl, siteConfig } from "@/config/site";
import { formatPrice } from "@/lib/format";
import { listingTypeLabels, listingTypeRoutes, propertyTypeLabels } from "@/lib/labels";
import type { PropertyDetail } from "@/lib/queries/property-detail";
import { amenityLabel } from "@/lib/search/filters";

const SCHEMA_TYPE: Partial<Record<PropertyDetail["propertyType"], string>> = {
  apartment: "Apartment",
  penthouse: "Apartment",
  studio: "Apartment",
  duplex: "Apartment",
  maisonette: "House",
  townhouse: "House",
  villa: "SingleFamilyResidence",
  bungalow: "SingleFamilyResidence",
};

export const listingSectionLabel: Record<PropertyDetail["listingType"], string> = {
  sale: "Buy",
  rent: "Rent",
  short_stay: "Short stays",
};

/** "4 bed maisonette for sale in Kileleshwa · KES 38,000,000" */
export function listingDescription(p: PropertyDetail): string {
  if (p.seoDescription) return p.seoDescription;
  const price = formatPrice({ priceKes: p.priceKes, period: p.pricePeriod, priceOnRequest: p.priceOnRequest }).primary;
  const lead = [
    p.bedrooms ? `${p.bedrooms} bed` : null,
    propertyTypeLabels[p.propertyType].toLowerCase(),
    listingTypeLabels[p.listingType].toLowerCase(),
    p.area ? `in ${p.area.name}, Nairobi` : "in Nairobi",
  ]
    .filter(Boolean)
    .join(" ");
  const summary = p.summary ? ` ${p.summary}` : "";
  const text = `${lead.charAt(0).toUpperCase()}${lead.slice(1)} · ${price}.${summary}`;
  return text.length > 300 ? `${text.slice(0, 297)}…` : text;
}

/** RealEstateListing (a WebPage) about a Residence, with an Offer, plus breadcrumbs. */
export function listingJsonLd(p: PropertyDetail) {
  const url = absoluteUrl(p.href);
  const agentId = `${absoluteUrl("/")}#agent`;
  const availability =
    p.status === "sold" || p.status === "let" ? "https://schema.org/SoldOut" : "https://schema.org/InStock";

  const residence = {
    "@type": SCHEMA_TYPE[p.propertyType] ?? "Residence",
    name: p.title,
    address: {
      "@type": "PostalAddress",
      ...(p.address ? { streetAddress: p.address } : {}),
      addressLocality: p.area?.name ?? "Nairobi",
      addressRegion: "Nairobi",
      addressCountry: "KE",
    },
    ...(p.location
      ? { geo: { "@type": "GeoCoordinates", latitude: Number(p.location.lat.toFixed(3)), longitude: Number(p.location.lng.toFixed(3)) } }
      : {}),
    ...(p.bedrooms !== null ? { numberOfBedrooms: p.bedrooms } : {}),
    ...(p.bathrooms !== null ? { numberOfBathroomsTotal: p.bathrooms } : {}),
    ...(p.floorArea ? { floorSize: { "@type": "QuantitativeValue", value: p.floorArea, unitCode: "MTK" } } : {}),
    ...(p.yearBuilt ? { yearBuilt: p.yearBuilt } : {}),
    ...(p.amenities.length
      ? { amenityFeature: p.amenities.map((a) => ({ "@type": "LocationFeatureSpecification", name: amenityLabel(a), value: true })) }
      : {}),
  };

  const offer =
    p.priceKes !== null && !p.priceOnRequest
      ? {
          "@type": "Offer",
          price: p.priceKes,
          priceCurrency: "KES",
          availability,
          businessFunction: p.listingType === "sale" ? "https://purl.org/goodrelations/v1#Sell" : "https://purl.org/goodrelations/v1#LeaseOut",
          ...(p.pricePeriod === "month" || p.pricePeriod === "night"
            ? {
                priceSpecification: {
                  "@type": "UnitPriceSpecification",
                  price: p.priceKes,
                  priceCurrency: "KES",
                  unitCode: p.pricePeriod === "month" ? "MON" : "DAY",
                },
              }
            : {}),
          seller: { "@id": agentId },
        }
      : null;

  const crumbs = [
    { name: "Home", url: absoluteUrl("/") },
    { name: listingSectionLabel[p.listingType], url: absoluteUrl(listingTypeRoutes[p.listingType]) },
    ...(p.area ? [{ name: p.area.name, url: absoluteUrl(`/areas/${p.area.slug}`) }] : []),
    { name: p.title, url },
  ];

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "RealEstateListing",
        "@id": `${url}#listing`,
        url,
        name: p.title,
        description: listingDescription(p),
        ...(p.publishedAt ? { datePosted: p.publishedAt } : {}),
        dateModified: p.updatedAt,
        image: p.images.slice(0, 8).map((i) => i.src),
        mainEntity: residence,
        ...(offer ? { offers: offer } : {}),
        provider: { "@type": "RealEstateAgent", "@id": agentId, name: siteConfig.name, telephone: siteConfig.contact.phone.e164 },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: c.url })),
      },
    ],
  };
}
