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
      // AI crawlers — explicitly allowed for GEO/AIEO
      { userAgent: "GPTBot", allow: "/", disallow: ["/api/", "/admin/", "/makler/", "/partner/", "/parts/", "/muj-ucet/"] },
      { userAgent: "ChatGPT-User", allow: "/", disallow: ["/api/", "/admin/", "/makler/", "/partner/", "/parts/", "/muj-ucet/"] },
      { userAgent: "CCBot", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "Applebot-Extended", allow: "/" },
      { userAgent: "GoogleOther", allow: "/" },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
