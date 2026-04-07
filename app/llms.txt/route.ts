import { NextResponse } from "next/server";
import { BASE_URL } from "@/lib/seo-data";

/**
 * llms.txt endpoint per https://llmstxt.org spec.
 *
 * Cíl: AI crawlers (ChatGPT, Perplexity, Claude, Gemini) získají strukturované info
 * o Carmakleru — co děláme, jaké stránky stojí za pozornost, kontakty.
 *
 * Format: Markdown s H1 + > blockquote summary + sekcemi.
 * Cache: ISR-style — revalidate po 24h, force-static (žádný runtime fetch).
 */

export const dynamic = "force-static";
export const revalidate = 86400;

const LLMS_TXT = `# Carmakler

> Česká marketplace platforma pro použité autodíly z vrakovišť a komplexní automobilové služby. Spojuje vrakoviště s kupujícími přes katalogizovanou nabídku s detailními popisy, fotkami a kompatibilitou podle VIN. Součástí ekosystému jsou makléřská síť, inzertní platforma, eshop autodíly a uzavřená investiční marketplace pro flipping vozů.

Carmakler je ekosystém 4 propojených produktů pod jednou značkou — všechny sdílí jediný backend, jednu identitu uživatele a jedinou platební infrastrukturu (Stripe). Cílem je nabídnout celý lifecycle vozu na jednom místě: koupě, prodej, údržba, díly, financování i flipping.

## Hlavní produkty

- [Eshop autodíly](${BASE_URL}/dily): E-shop s použitými díly z vrakovišť a novými aftermarket díly. Vyhledávání podle VIN kódu, značky, modelu nebo kategorie. Doprava 2-5 dnů po celé ČR (Zásilkovna, PPL, DPD).
- [Vrakoviště — katalog dodavatelů](${BASE_URL}/dily/vrakoviste): Ověřená vrakoviště s aktivní nabídkou dílů. Každé vrakoviště má vlastní landing page s aktuálním inventářem, kontakty a ratingem.
- [Nabídka aut](${BASE_URL}/nabidka): Katalog ojetých vozidel zprostředkovaných sítí Carmakler makléřů. Každé auto je ověřené, prověřené (Cebia) a má kompletní servisní historii.
- [Chci prodat auto](${BASE_URL}/chci-prodat): Bezplatné ocenění vozu a zprostředkovaný prodej přes lokálního makléře. Provize 5% z prodejní ceny, minimálně 25 000 Kč.
- [Inzerce](${BASE_URL}/inzerce): Inzertní platforma pro soukromé prodejce, autobazary a dealery — alternativa k Sauto.cz a TipCars s vyšší kvalitou inzerátů.
- [Marketplace VIP](${BASE_URL}/marketplace): Uzavřená investiční platforma pro flipping aut. Ověření dealeři nabízí příležitosti, ověření investoři financují. Dělení zisku 40% investor / 40% dealer / 20% Carmakler.

## Služby

- [Prověření vozu Cebia](${BASE_URL}/sluzby/proverka): Detailní prověření historie vozu, stočení tachometru, kradeniny, leasingu.
- [Financování](${BASE_URL}/sluzby/financovani): Auto úvěr na míru s předschválením do 24 hodin.
- [Pojištění](${BASE_URL}/sluzby/pojisteni): Povinné ručení a havarijní pojištění od prověřených partnerů.

## Klíčové vlastnosti

- Všechny použité díly pocházejí z verifikovaných českých vrakovišť (status AKTIVNI_PARTNER v interním systému).
- VIN-based kompatibilita: vyhledávač dílů ověří, zda díl sedí na konkrétní vůz podle VIN.
- Katalogizovaný inventář: každý díl má detailní popis, fotky, stav (nový / repas / použitý dobrý / použitý průměrný), kompatibilní značky a modely.
- Doprava po celé ČR: standardně 2-5 dnů, Zásilkovna / PPL / DPD / vlastní rozvoz pro velké díly.
- Záruka funkčnosti 3 měsíce na použité díly.
- Reklamační proces dle českého práva pro B2C kupující.

## Pro vrakoviště

- [Stát se partnerem](${BASE_URL}/registrace): Registrace nového vrakoviště do sítě Carmakler. Po ověření admin tým aktivuje partnerský účet a vrakoviště získá vlastní landing page + PWA aplikaci pro správu inventáře.
- PWA aplikace: jednoduché přidávání dílů přes mobil, scan VIN, automatická generace popisů.
- Partnerský payout: měsíční vyúčtování, transparentní commission přehled.

## O nás

- [O Carmakleru](${BASE_URL}/o-nas): Mise, tým, příběh značky.
- [Kariéra](${BASE_URL}/kariera): Aktuální otevřené pozice — vývoj, obchod, support.
- [Recenze](${BASE_URL}/recenze): Hodnocení zákazníků a partnerů.

## Kontakt

- Web: https://www.carmakler.cz
- Email: info@carmakler.cz
- Adresa: Praha, Česká republika
- [Kontaktní formulář](${BASE_URL}/kontakt)

## Právní dokumenty

- [Obchodní podmínky](${BASE_URL}/obchodni-podminky)
- [Ochrana osobních údajů](${BASE_URL}/ochrana-osobnich-udaju)
- [Reklamační řád](${BASE_URL}/reklamacni-rad)
- [Zásady cookies](${BASE_URL}/zasady-cookies)

## Sitemap

- [XML sitemap](${BASE_URL}/sitemap.xml): Strojově čitelný seznam všech veřejných URL.
`;

export function GET() {
  return new NextResponse(LLMS_TXT, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
