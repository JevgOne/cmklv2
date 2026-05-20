import type { Metadata } from "next";

const SITE_NAME = "CarMakléř";
const DEFAULT_DESCRIPTION =
  "Prodej aut přes ověřené makléře, autodíly z vrakovišť, investiční příležitosti.";
const OG_IMAGE = "/og-default.png";
const BASE_URL = "https://carmakler.cz";

export function createMetadata(opts: {
  title: string;
  description?: string;
  image?: string;
  noIndex?: boolean;
  path?: string;
}): Metadata {
  const title = opts.title;
  const description = opts.description || DEFAULT_DESCRIPTION;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      siteName: SITE_NAME,
      images: [{ url: opts.image || OG_IMAGE, width: 1200, height: 630 }],
      ...(opts.path && { url: `${BASE_URL}${opts.path}` }),
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [opts.image || OG_IMAGE],
    },
    ...(opts.noIndex && { robots: { index: false, follow: false } }),
  };
}
