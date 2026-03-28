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
      url: "https://www.carmakler.cz",
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
      url: "https://www.carmakler.cz",
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
