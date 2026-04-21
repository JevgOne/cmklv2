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
