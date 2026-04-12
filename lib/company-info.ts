/**
 * Centralni kontaktni a firemni udaje CarMakler.
 * Meni se na JEDNOM miste — vsude jinde importovat.
 *
 * Firemni udaje CAR makler, s.r.o.
 */

export const companyInfo = {
  name: "CarMakler",
  legalName: "CAR makléř, s.r.o.",
  ico: "21957151",
  dic: "CZ21957151",

  address: {
    street: "Školská 660/3",
    city: "Praha",
    zip: "110 00",
    country: "CZ",
    /** Plna adresa pro zobrazeni */
    full: "Školská 660/3, 110 00 Praha",
  },

  contact: {
    /** Zobrazovany format telefonu */
    phone: "733 179 199",
    /** Format pro href="tel:" */
    phoneHref: "tel:+420733179199",
    /** Zobrazovany format telefonu pro JSON-LD (s pomlckami) */
    phoneJsonLd: "+420-733-179-199",
    email: "info@carmakler.cz",
    emailHref: "mailto:info@carmakler.cz",
  },

  hours: "Po-Pa 8:00-18:00",
  hoursSpec: {
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    opens: "08:00",
    closes: "18:00",
  },

  web: {
    url: "https://carmakler.cz",
    logo: "https://carmakler.cz/brand/logo.svg",
  },

  social: {
    facebook: "https://facebook.com/carmakler",
    instagram: "https://instagram.com/carmakler",
    youtube: "https://youtube.com/@carmakler",
  },

  /**
   * Pobocky.
   * POZNAMKA: Odebrat fiktivni pobocky Brno a Ostrava.
   * Pridat realne pobocky az budou existovat.
   */
  branches: [
    {
      city: "Praha",
      type: "Centrala" as const,
      address: "Školská 660/3, 110 00 Praha",
      phone: "733 179 199",
      hours: "Po-Pa 8:00-18:00",
    },
  ],
} as const;

/**
 * Vrátí true pokud hodnota obsahuje placeholder marker `[DOPLNIT`.
 * Footery a další UI pouzivaji pro skryti neuplnych dat pred launchem.
 *
 * Pokrývá všechny current patterns: `[DOPLNIT]`, `[DOPLNIT TELEFON]`,
 * `[DOPLNIT ULICE A CISLO]`, `[DOPLNIT PSC]`, apod.
 */
export function isPlaceholder(value: string | undefined | null): boolean {
  if (!value) return true;
  return value.includes("[DOPLNIT");
}
