/**
 * Profile completeness calculator.
 *
 * Deterministicky vypocet % kompletnosti profilu (broker / partner / advertiser).
 * Sdilene mezi dashboard (banner) a wizard (progress indicator).
 *
 * Vahy nastaveny tak, aby soucet byl 100 — UI muze pouzit primo `percent`.
 */

export interface ProfileCompletenessInput {
  avatar: string | null;
  coverPhoto: string | null;
  bio: string | null;
  city: string | null;
  motto: string | null;
  yearsExperience: number | null;
  website: string | null;
  /** JSON array string — uklada se do User.specializations */
  specializations: string | null;
  /** Pole stringu — uklada se do User.services (Json) */
  services: string[] | null;
  /** Pole stringu — uklada se do User.languageSkills (Json) */
  languageSkills: string[] | null;
  socialLinks: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
  } | null;
}

export interface CompletenessCheck {
  key: string;
  label: string;
  weight: number;
  pass: boolean;
}

export interface CompletenessResult {
  percent: number;
  missing: Array<Pick<CompletenessCheck, "key" | "label" | "weight">>;
  checks: CompletenessCheck[];
}

function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Vypocet kompletnosti — vraci percent (0-100), seznam chybejicich poli + full checks.
 * Soucet waitu = 100.
 */
export function calculateProfileCompleteness(
  u: ProfileCompletenessInput,
): CompletenessResult {
  const specs = parseJsonArray(u.specializations);
  const socials = u.socialLinks ?? {};

  const checks: CompletenessCheck[] = [
    {
      key: "avatar",
      label: "Profilová fotka",
      weight: 15,
      pass: !!u.avatar,
    },
    {
      key: "coverPhoto",
      label: "Cover fotka",
      weight: 10,
      pass: !!u.coverPhoto,
    },
    {
      key: "bio",
      label: "Bio (min. 50 znaků)",
      weight: 10,
      pass: (u.bio?.length ?? 0) >= 50,
    },
    {
      key: "city",
      label: "Město",
      weight: 5,
      pass: !!u.city && u.city.trim().length > 0,
    },
    {
      key: "motto",
      label: "Motto",
      weight: 5,
      pass: !!u.motto && u.motto.trim().length > 0,
    },
    {
      key: "yearsExperience",
      label: "Roky zkušeností",
      weight: 5,
      pass: typeof u.yearsExperience === "number" && u.yearsExperience >= 0,
    },
    {
      key: "website",
      label: "Webová stránka",
      weight: 5,
      pass: !!u.website && u.website.trim().length > 0,
    },
    {
      key: "specializations",
      label: "Typy vozidel",
      weight: 15,
      pass: specs.length > 0,
    },
    {
      key: "services",
      label: "Služby",
      weight: 15,
      pass: (u.services?.length ?? 0) > 0,
    },
    {
      key: "languageSkills",
      label: "Jazyky",
      weight: 5,
      pass: (u.languageSkills?.length ?? 0) > 0,
    },
    {
      key: "socialLinks",
      label: "Sociální sítě",
      weight: 10,
      pass: !!(socials.instagram || socials.facebook || socials.youtube),
    },
  ];

  const total = checks.reduce((s, c) => s + c.weight, 0);
  const earned = checks.filter((c) => c.pass).reduce((s, c) => s + c.weight, 0);
  const percent = total === 0 ? 0 : Math.round((earned / total) * 100);

  return {
    percent,
    missing: checks
      .filter((c) => !c.pass)
      .map(({ key, label, weight }) => ({ key, label, weight })),
    checks,
  };
}
