import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.carmakler.cz";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/makler/dashboard",
          "/login",
          "/registrace",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
