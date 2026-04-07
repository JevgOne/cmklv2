import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Analytics } from "@/components/web/Analytics";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://carmakler.cz";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "CarMakléř | Prodej aut přes certifikované makléře",
    template: "%s | CarMakléř",
  },
  description:
    "Prodejte nebo kupte auto bezpečně přes síť ověřených makléřů. CarMakléř — váš spolehlivý partner pro prodej vozidel.",
  keywords: [
    "prodej aut",
    "auto makléř",
    "ojeté vozy",
    "autobazar",
    "prodej auta",
    "prodej auta přes makléře",
    "ojeté auto",
    "autobazar online",
  ],
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "cs_CZ",
    siteName: "CarMakléř",
    title: "CarMakléř | Prodej aut přes certifikované makléře",
    description:
      "Prodejte nebo kupte auto bezpečně přes síť ověřených makléřů. Rychle, transparentně a bez starostí.",
    url: BASE_URL,
    images: [
      {
        url: "/brand/og-image.png",
        width: 1200,
        height: 630,
        alt: "CarMakléř — prodej aut přes certifikované makléře",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CarMakléř | Prodej aut přes certifikované makléře",
    description:
      "Prodejte nebo kupte auto bezpečně přes síť ověřených makléřů.",
    images: ["/brand/og-image.png"],
  },
  icons: {
    icon: "/brand/favicon.ico",
    apple: "/brand/apple-touch-icon.png",
  },
  // POZN: `alternates.canonical` SE NEEXPORTUJE v root layoutu — způsobovalo
  // bug #127 (všechny child stránky dědily homepage URL místo svého). Každá
  // indexovaná stránka MUSÍ exportovat vlastní `alternates: pageCanonical("/path")`
  // přes helper z `lib/canonical.ts`. `metadataBase` zachováme — používá se pro
  // resolve relative URLs v openGraph.images apod.
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <body className={`${outfit.variable} font-sans antialiased overflow-x-hidden`}>
        <AuthProvider>{children}</AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
