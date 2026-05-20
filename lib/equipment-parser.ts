/**
 * Extract vehicle equipment features from Czech listing titles.
 * Pure keyword matching — no external API calls.
 */

interface EquipmentTag {
  label: string;
  type: "transmission" | "fuel" | "feature" | "condition" | "negative";
}

const EQUIPMENT_KEYWORDS: Record<string, EquipmentTag> = {
  // Převodovka
  "automat": { label: "Automat", type: "transmission" },
  "automatická": { label: "Automat", type: "transmission" },
  "manuál": { label: "Manuál", type: "transmission" },
  "dsg": { label: "DSG", type: "transmission" },
  // Palivo
  "benzín": { label: "Benzín", type: "fuel" },
  "nafta": { label: "Diesel", type: "fuel" },
  "diesel": { label: "Diesel", type: "fuel" },
  "hybrid": { label: "Hybrid", type: "fuel" },
  "elektro": { label: "Elektro", type: "fuel" },
  "cng": { label: "CNG", type: "fuel" },
  "lpg": { label: "LPG", type: "fuel" },
  // Výbava
  "4x4": { label: "4x4", type: "feature" },
  "awd": { label: "AWD", type: "feature" },
  "klima": { label: "Klimatizace", type: "feature" },
  "tempomat": { label: "Tempomat", type: "feature" },
  "navi": { label: "Navigace", type: "feature" },
  "xenon": { label: "Xenon", type: "feature" },
  "led": { label: "LED", type: "feature" },
  "kůže": { label: "Kůže", type: "feature" },
  "panorama": { label: "Panorama", type: "feature" },
  "tažné": { label: "Tažné", type: "feature" },
  "park": { label: "Parkovací senzory", type: "feature" },
  "kamera": { label: "Kamera", type: "feature" },
  "vyhřívan": { label: "Vyhřívaná sedadla", type: "feature" },
  "serviska": { label: "Servisní knížka", type: "feature" },
  "servisní": { label: "Servisní knížka", type: "feature" },
  "1. majitel": { label: "1. majitel", type: "condition" },
  "garáž": { label: "Garážováno", type: "condition" },
  // Stav
  "havarovan": { label: "Havarované", type: "negative" },
  "neboura": { label: "Nebourané", type: "condition" },
  "zánovní": { label: "Zánovní", type: "condition" },
};

export function extractEquipment(title: string | null): EquipmentTag[] {
  if (!title) return [];
  const lower = title.toLowerCase();
  const seen = new Set<string>();
  const tags: EquipmentTag[] = [];

  for (const [keyword, tag] of Object.entries(EQUIPMENT_KEYWORDS)) {
    if (lower.includes(keyword) && !seen.has(tag.label)) {
      seen.add(tag.label);
      tags.push(tag);
    }
  }

  return tags;
}

export type { EquipmentTag };
