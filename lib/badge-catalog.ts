/**
 * Badge catalog — shared between server and client.
 * No Prisma import — safe for "use client" components.
 */
export const BADGE_CATALOG: Record<string, { name: string; icon: string; description: string }> = {
  FIRST_SALE:     { name: "První prodej",           icon: "🎯", description: "Uskutečnil(a) první prodej" },
  FIVE_SALES:     { name: "5 prodejů",              icon: "⭐", description: "5 úspěšných prodejů" },
  TEN_SALES:      { name: "10 prodejů",             icon: "🏅", description: "10 úspěšných prodejů" },
  FIFTY_SALES:    { name: "50 prodejů",             icon: "🏆", description: "50 úspěšných prodejů" },
  PHOTO_PRO:      { name: "Foto profesionál",       icon: "📸", description: "10+ fotek na jedné položce" },
  FAST_RESPONDER: { name: "Rychlá reakce",          icon: "⚡", description: "Odpovídá do 1 hodiny" },
  TOP_RATED:      { name: "Nejlépe hodnocený",      icon: "🌟", description: "Hodnocení 4.5+ (min 5 recenzí)" },
  VERIFIED:       { name: "Ověřený",                icon: "✅", description: "Dokončený onboarding" },
  POPULAR:        { name: "Populární",              icon: "🔥", description: "50+ lajků celkem" },
  COMMUNITY:      { name: "Aktivní komunita",       icon: "💬", description: "20+ napsaných komentářů" },
  EARLY_ADOPTER:  { name: "Průkopník",              icon: "🌱", description: "Mezi prvními uživateli" },
};
