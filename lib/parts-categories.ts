import type { PartCategory, PartCondition } from "@/types/parts";

export const PART_CATEGORIES: { value: PartCategory; label: string }[] = [
  { value: "ENGINE", label: "Motor" },
  { value: "TRANSMISSION", label: "Převodovka" },
  { value: "BRAKES", label: "Brzdy" },
  { value: "SUSPENSION", label: "Podvozek" },
  { value: "BODY", label: "Karoserie" },
  { value: "ELECTRICAL", label: "Elektro" },
  { value: "INTERIOR", label: "Interiér" },
  { value: "WHEELS", label: "Kola a pneumatiky" },
  { value: "EXHAUST", label: "Výfuk" },
  { value: "COOLING", label: "Chlazení" },
  { value: "FUEL", label: "Palivový systém" },
  { value: "OTHER", label: "Ostatní" },
];

export const PART_CONDITIONS: { value: PartCondition; label: string }[] = [
  { value: "NEW", label: "Nový" },
  { value: "USED_GOOD", label: "Použitý — velmi dobrý" },
  { value: "USED_FAIR", label: "Použitý — dobrý" },
  { value: "USED_POOR", label: "Použitý — s vadou" },
  { value: "REFURBISHED", label: "Repasovaný" },
];

export function getCategoryLabel(value: PartCategory): string {
  return PART_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function getConditionLabel(value: PartCondition): string {
  return PART_CONDITIONS.find((c) => c.value === value)?.label ?? value;
}
