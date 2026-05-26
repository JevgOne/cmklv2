import { PARTS_BRANDS } from "./seo-data";

interface CrossLink {
  label: string;
  href: string;
}

/**
 * Bridge links from vehicle landing pages to matching parts pages.
 * Returns parts link only if brand exists in PARTS_BRANDS.
 */
export function getVehicleToPartsBridge(options: {
  brandSlug?: string;
  brandName?: string;
  modelSlug?: string;
  modelName?: string;
}): CrossLink[] {
  const links: CrossLink[] = [];
  if (!options.brandSlug) return links;

  const partsBrand = PARTS_BRANDS.find((b) => b.slug === options.brandSlug);
  if (!partsBrand) return links;

  if (options.modelSlug && options.modelName) {
    links.push({
      label: `Díly pro ${partsBrand.name} ${options.modelName}`,
      href: `/dily/znacka/${options.brandSlug}/${options.modelSlug}`,
    });
  }
  links.push({
    label: `Všechny díly ${partsBrand.name}`,
    href: `/dily/znacka/${options.brandSlug}`,
  });

  return links;
}

/**
 * Bridge links from parts pages to matching vehicle landing pages.
 */
export function getPartsToVehicleBridge(options: {
  brandSlug: string;
  brandName: string;
  modelSlug?: string;
  modelName?: string;
}): CrossLink[] {
  const links: CrossLink[] = [];

  if (options.modelSlug && options.modelName) {
    links.push({
      label: `Ojetá ${options.brandName} ${options.modelName}`,
      href: `/nabidka/${options.brandSlug}/${options.modelSlug}`,
    });
  }
  links.push({
    label: `Ojeté vozy ${options.brandName}`,
    href: `/nabidka/${options.brandSlug}`,
  });

  return links;
}

/** Static service links for vehicle pages. */
export const SERVICE_CROSS_LINKS: CrossLink[] = [
  { label: "Prověrka vozidla", href: "/sluzby/proverka" },
  { label: "Financování", href: "/sluzby/financovani" },
  { label: "Pojištění vozidla", href: "/sluzby/pojisteni" },
];

/**
 * Bridge links from vehicle detail page to services in the same city.
 */
export function getVehicleToServicesBridge(city: string): CrossLink[] {
  const slug = city.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-");
  return [
    { label: `Autoservisy v ${city}`, href: `/autoservisy/mesto/${slug}` },
    { label: `STK stanice v ${city}`, href: `/stk/mesto/${slug}` },
  ];
}

/**
 * Bridge links from service/STK detail pages to vehicles in the same city.
 */
export function getServiceToVehicleBridge(city: string): CrossLink[] {
  const slug = city.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-");
  return [
    { label: `Ojetá vozidla ${city}`, href: `/nabidka/${slug}` },
  ];
}

/**
 * Bridge links from part detail page to compatible vehicles.
 */
export function getPartToVehicleBridge(options: {
  brandSlug?: string;
  brandName?: string;
  modelSlug?: string;
  modelName?: string;
}): CrossLink[] {
  const links: CrossLink[] = [];
  if (!options.brandSlug || !options.brandName) return links;

  if (options.modelSlug && options.modelName) {
    links.push({
      label: `Ojetá ${options.brandName} ${options.modelName}`,
      href: `/nabidka/${options.brandSlug}/${options.modelSlug}`,
    });
  }
  links.push({
    label: `Ojeté vozy ${options.brandName}`,
    href: `/nabidka/${options.brandSlug}`,
  });

  return links;
}
