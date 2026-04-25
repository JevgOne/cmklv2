// Skill tag definitions — safe to import from client components (no Prisma)

export const SKILL_TAGS = {
  BROKER: [
    { tag: "PROFESSIONAL", emoji: "💪", label: "Profesionální" },
    { tag: "FAST", emoji: "⚡", label: "Rychlý" },
    { tag: "FAIR", emoji: "🤝", label: "Férový" },
    { tag: "COMMUNICATIVE", emoji: "📱", label: "Komunikativní" },
    { tag: "PRECISE", emoji: "🎯", label: "Přesný" },
    { tag: "FRIENDLY", emoji: "😊", label: "Přátelský" },
  ],
  SUPPLIER: [
    { tag: "QUALITY_PARTS", emoji: "✅", label: "Kvalitní díly" },
    { tag: "FAST_SHIPPING", emoji: "🚀", label: "Rychlé odeslání" },
    { tag: "ACCURATE_DESC", emoji: "📋", label: "Přesný popis" },
    { tag: "GOOD_PACKAGING", emoji: "📦", label: "Pečlivé balení" },
  ],
  DEALER: [
    { tag: "RELIABLE", emoji: "🤝", label: "Spolehlivý" },
    { tag: "TRANSPARENT", emoji: "🔍", label: "Transparentní" },
    { tag: "GOOD_DEALS", emoji: "💎", label: "Kvalitní dealy" },
    { tag: "FAST_CLOSING", emoji: "⚡", label: "Rychlé uzavření" },
  ],
  SELLER: [
    { tag: "HONEST", emoji: "✅", label: "Přesné info" },
    { tag: "RESPONSIVE", emoji: "📱", label: "Rychlé odpovědi" },
    { tag: "FAIR_PRICE", emoji: "💰", label: "Férová cena" },
    { tag: "GOOD_PHOTOS", emoji: "📸", label: "Kvalitní fotky" },
  ],
} as const;

export type SkillTagContext = keyof typeof SKILL_TAGS;

// Minimum display threshold
export const MIN_TAG_DISPLAY_COUNT = 3;
