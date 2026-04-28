import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://carmakler.cz";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/makler/",
          "/partner/",
          "/parts/",
          "/muj-ucet/",
          "/marketplace/dashboard",
          "/marketplace/investor",
          "/marketplace/dealer",
          "/login",
          "/prihlaseni",
          "/registrace",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
