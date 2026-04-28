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

// --- Nové generátory (sitemap-jsonld-audit FÁZE 3) ---

/**
 * LocalBusiness JSON-LD — pro /kontakt a partner stránky.
 * Schema.org subtype AutomotiveBusiness.
 */
export interface LocalBusinessJsonLdData {
  name: string;
  description: string;
  url: string;
  telephone?: string;
  email?: string;
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
  };
  geo?: { latitude: number; longitude: number };
  openingHours?: string;
  image?: string;
  priceRange?: string;
}

export function generateLocalBusinessJsonLd(biz: LocalBusinessJsonLdData): string {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "AutomotiveBusiness",
    name: biz.name,
    description: biz.description,
    url: biz.url,
  };

  if (biz.telephone) jsonLd.telephone = biz.telephone;
  if (biz.email) jsonLd.email = biz.email;
  if (biz.image) jsonLd.image = biz.image;
  if (biz.priceRange) jsonLd.priceRange = biz.priceRange;
  if (biz.openingHours) jsonLd.openingHours = biz.openingHours;

  if (biz.address) {
    jsonLd.address = {
      "@type": "PostalAddress",
      addressCountry: "CZ",
      ...(biz.address.streetAddress && { streetAddress: biz.address.streetAddress }),
      ...(biz.address.addressLocality && { addressLocality: biz.address.addressLocality }),
      ...(biz.address.addressRegion && { addressRegion: biz.address.addressRegion }),
      ...(biz.address.postalCode && { postalCode: biz.address.postalCode }),
    };
  }

  if (biz.geo) {
    jsonLd.geo = {
      "@type": "GeoCoordinates",
      latitude: biz.geo.latitude,
      longitude: biz.geo.longitude,
    };
  }

  return JSON.stringify(jsonLd);
}

/**
 * AggregateRating + Review[] JSON-LD — pro /recenze.
 * Emituje Organization s aggregateRating a individuálními reviews.
 */
export interface ReviewJsonLdData {
  author: string;
  reviewBody: string;
  ratingValue: number;
  datePublished?: string;
}

export interface AggregateRatingJsonLdData {
  organizationName: string;
  ratingValue: number;
  reviewCount: number;
  bestRating?: number;
  worstRating?: number;
  reviews?: ReviewJsonLdData[];
}

export function generateAggregateRatingJsonLd(data: AggregateRatingJsonLdData): string {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: data.organizationName,
    url: "https://carmakler.cz",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: data.ratingValue,
      reviewCount: data.reviewCount,
      bestRating: data.bestRating ?? 5,
      worstRating: data.worstRating ?? 1,
    },
  };

  if (data.reviews && data.reviews.length > 0) {
    jsonLd.review = data.reviews.map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.author },
      reviewBody: r.reviewBody,
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.ratingValue,
        bestRating: data.bestRating ?? 5,
      },
      ...(r.datePublished && { datePublished: r.datePublished }),
    }));
  }

  return JSON.stringify(jsonLd);
}

/**
 * JobPosting JSON-LD — pro /kariera.
 * Generuje jednu pracovní pozici pro Google for Jobs.
 */
export interface JobPostingJsonLdData {
  title: string;
  description: string;
  location: string;
  streetAddress?: string;
  postalCode?: string;
  addressRegion?: string;
  employmentType?: string;
  baseSalary?: { minValue: number; maxValue: number; currency?: string };
  datePosted?: string;
  validThrough?: string;
}

export function generateJobPostingJsonLd(job: JobPostingJsonLdData): string {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    hiringOrganization: {
      "@type": "Organization",
      name: "Carmakler",
      sameAs: "https://carmakler.cz",
      logo: "https://carmakler.cz/brand/logo-color.png",
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.location,
        addressRegion: job.addressRegion ?? (job.location === "Celá ČR" ? "Česká republika" : job.location),
        streetAddress: job.streetAddress ?? job.location,
        postalCode: job.postalCode ?? "",
        addressCountry: "CZ",
      },
    },
    datePosted: job.datePosted ?? new Date().toISOString().slice(0, 10),
    validThrough: job.validThrough ?? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  };

  if (job.employmentType) jsonLd.employmentType = job.employmentType;

  if (job.baseSalary) {
    jsonLd.baseSalary = {
      "@type": "MonetaryAmount",
      currency: job.baseSalary.currency ?? "CZK",
      value: {
        "@type": "QuantitativeValue",
        minValue: job.baseSalary.minValue,
        maxValue: job.baseSalary.maxValue,
        unitText: "MONTH",
      },
    };
  }

  return JSON.stringify(jsonLd);
}

/**
 * Person JSON-LD — pro /profil/[slug] (broker profile pages).
 */
export interface PersonJsonLdData {
  name: string;
  url: string;
  image?: string;
  jobTitle?: string;
  worksFor?: string;
  address?: string;
  description?: string;
}

export function generatePersonJsonLd(person: PersonJsonLdData): string {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: person.name,
    url: person.url,
    worksFor: {
      "@type": "Organization",
      name: person.worksFor ?? "Carmakler",
      url: "https://carmakler.cz",
    },
  };

  if (person.image) jsonLd.image = person.image;
  if (person.jobTitle) jsonLd.jobTitle = person.jobTitle;
  if (person.description) jsonLd.description = person.description;
  if (person.address) {
    jsonLd.address = {
      "@type": "PostalAddress",
      addressLocality: person.address,
      addressCountry: "CZ",
    };
  }

  return JSON.stringify(jsonLd);
}
