// Badge definitions — safe to import from client components (no Prisma)

export const BADGE_CATALOG = {
  BROKER: [
    { badge: "FAST_RESPONDER", emoji: "⚡", label: "Rychlá odpověď", desc: "Průměrná odpověď do 1 hodiny" },
    { badge: "TOP_SELLER", emoji: "🏆", label: "Top prodejce", desc: "5+ prodejů za měsíc" },
    { badge: "PHOTO_EXPERT", emoji: "📸", label: "Foto expert", desc: "Průměrně 20+ fotek na vozidlo" },
    { badge: "VETERAN", emoji: "🏅", label: "Veterán", desc: "12+ měsíců na platformě" },
    { badge: "PERFECT_RECORD", emoji: "✨", label: "Bezchybný", desc: "10+ schválení bez zamítnutí" },
    { badge: "RESPONSE_KING", emoji: "💬", label: "Komunikátor", desc: "95%+ odpovědnost" },
  ],
  SUPPLIER: [
    { badge: "ZERO_DEFECT", emoji: "✅", label: "Bez reklamací", desc: "0 reklamací za 90 dní" },
    { badge: "EXPRESS_SHIPPER", emoji: "🚀", label: "Express", desc: "Odeslání do 24h" },
    { badge: "TOP_RATED", emoji: "⭐", label: "Nejlépe hodnocený", desc: "Hodnocení 4.5+" },
    { badge: "BIG_CATALOG", emoji: "📦", label: "Velký sklad", desc: "200+ aktivních dílů" },
    { badge: "RELIABLE", emoji: "🏅", label: "Spolehlivý", desc: "50+ dokončených objednávek" },
  ],
  DEALER: [
    { badge: "PROVEN_DEALER", emoji: "🏆", label: "Ověřený dealer", desc: "5+ dokončených dealů" },
    { badge: "HIGH_ROI", emoji: "📈", label: "Vysoké ROI", desc: "Průměrné ROI 20%+" },
    { badge: "ACCURATE_ESTIMATOR", emoji: "🎯", label: "Přesný odhad", desc: "90%+ přesnost odhadů" },
    { badge: "FAST_FLIPPER", emoji: "⚡", label: "Rychlý flip", desc: "Uzavření do 60 dní" },
  ],
  INVESTOR: [
    { badge: "ACTIVE_INVESTOR", emoji: "💰", label: "Aktivní investor", desc: "5+ investic" },
    { badge: "BIG_PORTFOLIO", emoji: "🏦", label: "Velké portfolio", desc: "Investice 2M+ Kč" },
    { badge: "RELIABLE_PAYER", emoji: "✅", label: "Spolehlivý plátce", desc: "100% potvrzených plateb" },
  ],
  SELLER: [
    { badge: "QUICK_RESPONDER", emoji: "⚡", label: "Rychlá odpověď", desc: "Odpověď do 2h" },
    { badge: "EXPERIENCED_SELLER", emoji: "🏅", label: "Zkušený prodejce", desc: "5+ prodaných inzerátů" },
    { badge: "CLEAN_RECORD", emoji: "✅", label: "Čistý záznam", desc: "0 nahlášených inzerátů" },
    { badge: "PHOTO_PRO", emoji: "📸", label: "Foto profík", desc: "15+ fotek na inzerát" },
  ],
} as const;

export type BadgeContext = keyof typeof BADGE_CATALOG;
