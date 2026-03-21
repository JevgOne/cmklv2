import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { AuthProvider } from "@/components/providers/AuthProvider";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: {
    default: "CarMakléř | Prodej aut přes certifikované makléře",
    template: "%s | CarMakléř",
  },
  description:
    "Prodejte nebo kupte auto bezpečně přes síť ověřených makléřů. CarMakléř - váš spolehlivý partner pro prodej vozidel.",
  keywords: [
    "prodej aut",
    "auto makléř",
    "ojeté vozy",
    "autobazar",
    "prodej auta",
  ],
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
      </body>
    </html>
  );
}
