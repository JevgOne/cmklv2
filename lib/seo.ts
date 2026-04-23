// SEO helper functions — JSON-LD structured data generators

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function generateBreadcrumbJsonLd(items: BreadcrumbItem[]): string {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
  return JSON.stringify(jsonLd);
}

export interface FaqItem {
  question: string;
  answer: string;
}

export function generateFaqJsonLd(items: FaqItem[]): string {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
  return JSON.stringify(jsonLd);
}

export function generateItemListJsonLd(urls: string[]): string {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: urls.map((url, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url,
    })),
  };
  return JSON.stringify(jsonLd);
}

/**
 * Parts ItemList — top dílů per brand / model / model+rok landing page.
 * Per #87b plán §9.2-9.3. Obsahuje jen `name + url` (bez offers/price);
 * full Product schema je na detail page.
 */
export function generatePartsItemListJsonLd(
  listName: string,
  items: { name: string; url: string }[]
): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: listName,
    numberOfItems: items.length,
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: item.url,
      name: item.name,
    })),
  });
}

/**
 * FAQPage JSON-LD generator (alias of generateFaqJsonLd s explicitnějším názvem).
 * Per #87b plán §9.4 — universal FAQs na parts landing pages.
 */
export function generateFaqPageJsonLd(faqs: { question: string; answer: string }[]): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  });
}

export interface VehicleJsonLdData {
  name: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  price: number;
  url: string;
  image?: string;
  description?: string;
}

export function generateVehicleJsonLd(vehicle: VehicleJsonLdData): string {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: vehicle.name,
    brand: { "@type": "Brand", name: vehicle.brand },
    model: vehicle.model,
    vehicleModelDate: String(vehicle.year),
    mileageFromOdometer: {
      "@type": "QuantitativeValue",
      value: vehicle.mileage,
      unitCode: "KMT",
    },
    fuelType: vehicle.fuelType,
    vehicleTransmission: vehicle.transmission,
    offers: {
      "@type": "Offer",
      price: vehicle.price,
      priceCurrency: "CZK",
      availability: "https://schema.org/InStock",
      url: vehicle.url,
    },
    ...(vehicle.image && { image: vehicle.image }),
    ...(vehicle.description && { description: vehicle.description }),
  };
  return JSON.stringify(jsonLd);
}

export interface ServiceJsonLdData {
  name: string;
  description: string;
  url: string;
  provider?: string;
  areaServed?: string;
}

export function generateServiceJsonLd(service: ServiceJsonLdData): string {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    description: service.description,
    url: service.url,
    provider: {
      "@type": "Organization",
      name: service.provider || "CarMakler",
      url: "https://carmakler.cz",
    },
    ...(service.areaServed && { areaServed: service.areaServed }),
  };
  return JSON.stringify(jsonLd);
}

export function generateArticleJsonLd(article: {
  headline: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified: string;
  author?: string;
}): string {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.headline,
    description: article.description,
    url: article.url,
    datePublished: article.datePublished,
    dateModified: article.dateModified,
    author: {
      "@type": "Organization",
      name: article.author || "CarMakler",
    },
    publisher: {
      "@type": "Organization",
      name: "CarMakler",
      url: "https://carmakler.cz",
    },
  };
  return JSON.stringify(jsonLd);
}

export function generateHowToJsonLd(howTo: {
  name: string;
  description: string;
  steps: { name: string; text: string }[];
}): string {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: howTo.name,
    description: howTo.description,
    step: howTo.steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
  };
  return JSON.stringify(jsonLd);
}

export function generateWebApplicationJsonLd(app: {
  name: string;
  description: string;
  url: string;
  applicationCategory: string;
}): string {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: app.name,
    description: app.description,
    url: app.url,
    applicationCategory: app.applicationCategory,
    operatingSystem: "All",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "CZK",
    },
  };
  return JSON.stringify(jsonLd);
}

// --- GEO / AIEO optimized JSON-LD generators ---

export interface WebPageJsonLdData {
  name: string;
  description: string;
  url: string;
  about?: { name: string; type: string; url?: string }[];
  mentions?: { name: string; type: string; url?: string }[];
  speakableCssSelectors?: string[];
  dateModified?: string;
}

export function generateWebPageJsonLd(page: WebPageJsonLdData): string {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.name,
    description: page.description,
    url: page.url,
    publisher: {
      "@type": "Organization",
      name: "CarMakler",
      url: "https://carmakler.cz",
    },
  };

  if (page.dateModified) {
    jsonLd.dateModified = page.dateModified;
  }

  if (page.about && page.about.length > 0) {
    jsonLd.about = page.about.map((entity) => ({
      "@type": entity.type,
      name: entity.name,
      ...(entity.url && { url: entity.url }),
    }));
  }

  if (page.mentions && page.mentions.length > 0) {
    jsonLd.mentions = page.mentions.map((entity) => ({
      "@type": entity.type,
      name: entity.name,
      ...(entity.url && { url: entity.url }),
    }));
  }

  if (page.speakableCssSelectors && page.speakableCssSelectors.length > 0) {
    jsonLd.speakable = {
      "@type": "SpeakableSpecification",
      cssSelector: page.speakableCssSelectors,
    };
  }

  return JSON.stringify(jsonLd);
}

export function generateBrandItemListJsonLd(brand: {
  name: string;
  url: string;
  models: { name: string; url: string }[];
}): string {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Ojeté vozy ${brand.name}`,
    url: brand.url,
    numberOfItems: brand.models.length,
    itemListElement: brand.models.map((model, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: `${brand.name} ${model.name}`,
      url: model.url,
    })),
  };
  return JSON.stringify(jsonLd);
}

export function generateAggregateOfferJsonLd(vehicle: {
  name: string;
  brand: string;
  model: string;
  lowPrice: number;
  highPrice: number;
  offerCount: number;
  url: string;
}): string {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: vehicle.name,
    brand: { "@type": "Brand", name: vehicle.brand },
    model: vehicle.model,
    offers: {
      "@type": "AggregateOffer",
      lowPrice: vehicle.lowPrice,
      highPrice: vehicle.highPrice,
      priceCurrency: "CZK",
      offerCount: vehicle.offerCount,
      url: vehicle.url,
    },
  };
  return JSON.stringify(jsonLd);
}

// --- #87a SEO MVP foundation: Organization, WebSite, Product, Store ---

/**
 * Carmakler Organization JSON-LD — single source of truth.
 * Reusable napříč všemi landing pages.
 */
export function generateOrganizationJsonLd(): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Carmakler",
    url: "https://carmakler.cz",
    logo: "https://carmakler.cz/brand/logo-color.png",
    description:
      "Česká marketplace platforma pro použité autodíly z vrakovišť. Spojuje vrakoviště s kupujícími přes katalogizovanou nabídku s detailními popisy, fotkami a kompatibilitou podle VIN.",
    foundingDate: "2025",
    sameAs: [
      "https://www.facebook.com/carmakler",
      "https://www.linkedin.com/company/carmakler",
    ],
    address: {
      "@type": "PostalAddress",
      addressCountry: "CZ",
      addressLocality: "Praha",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "info@carmakler.cz",
      availableLanguage: ["Czech", "English"],
    },
  });
}

/**
 * WebSite JSON-LD s SearchAction (Sitelinks searchbox).
 * Pouze pro homepage / root layout.
 */
export function generateWebSiteJsonLd(): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Carmakler",
    url: "https://carmakler.cz",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://carmakler.cz/dily/katalog?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  });
}

export interface PartProductJsonLdData {
  name: string;
  description: string;
  image: string;
  brand: string;
  sku: string;
  url: string;
  price: number;
  inStock: boolean;
  /** "NEW" | "USED" | "REFURBISHED" — Carmakler Part.partType / Part.condition derivative */
  condition: string;
}

/**
 * Part Product JSON-LD per detail card.
 * Single source of truth — reusable v PartCard, vrakoviste landing, /dily/[slug] detail.
 */
export function generatePartProductJsonLd(part: PartProductJsonLdData): string {
  const conditionUrl =
    part.condition === "NEW"
      ? "https://schema.org/NewCondition"
      : part.condition === "REFURBISHED"
        ? "https://schema.org/RefurbishedCondition"
        : "https://schema.org/UsedCondition";

  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    name: part.name,
    description: part.description,
    image: part.image,
    sku: part.sku,
    brand: { "@type": "Brand", name: part.brand },
    offers: {
      "@type": "Offer",
      url: part.url,
      priceCurrency: "CZK",
      price: part.price,
      itemCondition: conditionUrl,
      availability: part.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "Carmakler",
      },
    },
  });
}

export interface StoreJsonLdData {
  name: string;
  description: string;
  url: string;
  logo?: string;
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
  };
  telephone?: string;
  email?: string;
  geo?: { latitude: number; longitude: number };
  openingHours?: string; // schema.org/openingHours format ("Mo-Fr 08:00-17:00")
  aggregateRating?: { ratingValue: number; reviewCount: number };
}

/**
 * Store (vrakoviště) JSON-LD pro per-vrakoviste landing page.
 * Type: AutoPartsStore (schema.org subtype of Store).
 */
export function generateStoreJsonLd(store: StoreJsonLdData): string {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "AutoPartsStore",
    name: store.name,
    description: store.description,
    url: store.url,
  };

  if (store.logo) jsonLd.logo = store.logo;
  if (store.telephone) jsonLd.telephone = store.telephone;
  if (store.email) jsonLd.email = store.email;
  if (store.openingHours) jsonLd.openingHours = store.openingHours;

  if (store.address) {
    jsonLd.address = {
      "@type": "PostalAddress",
      addressCountry: "CZ",
      ...(store.address.streetAddress && { streetAddress: store.address.streetAddress }),
      ...(store.address.addressLocality && { addressLocality: store.address.addressLocality }),
      ...(store.address.addressRegion && { addressRegion: store.address.addressRegion }),
      ...(store.address.postalCode && { postalCode: store.address.postalCode }),
    };
  }

  if (store.geo) {
    jsonLd.geo = {
      "@type": "GeoCoordinates",
      latitude: store.geo.latitude,
      longitude: store.geo.longitude,
    };
  }

  if (store.aggregateRating) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: store.aggregateRating.ratingValue,
      reviewCount: store.aggregateRating.reviewCount,
    };
  }

  return JSON.stringify(jsonLd);
}
