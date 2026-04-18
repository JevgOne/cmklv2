import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";
import { withSentryConfig } from "@sentry/nextjs";
import withBundleAnalyzer from "@next/bundle-analyzer";

const withAnalyze = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

// Content Security Policy
const isDev = process.env.NODE_ENV === "development";

const cspDirectives = [
  // Základní politika
  "default-src 'self'",

  // Skripty: self + inline (Next.js hydrace) + unsafe-eval jen v dev
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""} https://plausible.io https://widget.packeta.com https://js.stripe.com`.trim(),

  // Styly: self + inline (Tailwind CSS injection, framer-motion)
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://widget.packeta.com",

  // Obrázky: self + Cloudinary + data: URIs (base64 previews) + blob:
  "img-src 'self' data: blob: https://files.carmakler.cz https://res.cloudinary.com https://placehold.co https://images.unsplash.com https://*.sentry.io https://widget.packeta.com",

  // Fonty: self + Google Fonts (design system fallback)
  "font-src 'self' https://fonts.gstatic.com",

  // API/fetch: self + Sentry + Plausible + Stripe + Packeta
  "connect-src 'self' https://*.sentry.io https://plausible.io https://api.stripe.com https://widget.packeta.com",

  // Iframes: Stripe Checkout + Packeta widget
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://widget.packeta.com",

  // Service Worker (Serwist PWA)
  "worker-src 'self'",

  // Media: self
  "media-src 'self'",

  // Žádné pluginy
  "object-src 'none'",

  // Prevence base tag hijack
  "base-uri 'self'",

  // Prevence form action hijack
  "form-action 'self'",

  // Prevence iframe embedding (ekvivalent X-Frame-Options: DENY)
  "frame-ancestors 'none'",

  // CSP violation reporting
  "report-uri /api/csp-report",
].join("; ");

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "files.carmakler.cz",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async redirects() {
    return [
      // www.carmakler.cz → carmakler.cz (301 permanent)
      // Bare domain je canonical (user pokyn 2026-04-07).
      // Dual-layer redirect: DNS-level + Next.js fallback pro safety.
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "www.carmakler.cz",
          },
        ],
        destination: "https://carmakler.cz/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Permissions-Policy", value: "camera=(), microphone=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy-Report-Only",
            value: cspDirectives,
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(withAnalyze(withSerwist(nextConfig)), {
  // Sentry webpack plugin options
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Tichy rezim: nevyhazovat chyby pokud Sentry neni nakonfigurovano
  silent: !process.env.SENTRY_AUTH_TOKEN,

  // Upload source maps (jen v produkci s auth tokenem)
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },

  // Automaticka instrumentace
  autoInstrumentServerFunctions: true,
  autoInstrumentMiddleware: true,
  autoInstrumentAppDirectory: true,
});
