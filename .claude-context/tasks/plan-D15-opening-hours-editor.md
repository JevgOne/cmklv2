# Plan D15 — Otevírací doba editor (Partner profil)

**Datum:** 2026-04-11
**Agent:** Plánovač
**Zdroj:** plan-faze3-batch-a.md §4, codebase audit
**Effort:** ~2h
**DB migrace:** ŽÁDNÁ (pole `Partner.openingHours String?` existuje od začátku)

---

## §0 Executive summary

Nejjednodušší feature z celé fáze 3. Schema pole existuje (line 1678), GET API ho vrací (line 33), public profil `/bazar/[slug]` ho renderuje (line 128-137). Chybí jen:

1. **Editor komponent** — `OpeningHoursEditor.tsx`
2. **API PUT update** — přidat `openingHours` do update data v PUT route
3. **Profile page** — nahradit placeholder editor komponentem + propojit s form state

**JSON formát** (kompatibilní s public profilem):
```json
{"Pondělí": "08:00 - 17:00", "Úterý": "08:00 - 17:00", "Středa": "08:00 - 17:00", "Čtvrtek": "08:00 - 17:00", "Pátek": "08:00 - 17:00", "Sobota": "Zavřeno", "Neděle": "Zavřeno"}
```

---

## §1 Soubory k vytvoření

### 1.1 `components/partner/OpeningHoursEditor.tsx` (NEW, ~120 lines)

**"use client"** komponent.

```tsx
"use client";

import { useState, useCallback } from "react";

const DAYS = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota", "Neděle"] as const;

interface DaySchedule {
  open: string;   // "08:00"
  close: string;  // "17:00"
  closed: boolean;
}

interface OpeningHoursEditorProps {
  value: string | null;  // JSON string nebo null
  onChange: (json: string) => void;
}

export function OpeningHoursEditor({ value, onChange }: OpeningHoursEditorProps) {
  const [hours, setHours] = useState<Record<string, DaySchedule>>(() => parseHours(value));

  const handleChange = useCallback((day: string, field: keyof DaySchedule, val: string | boolean) => {
    setHours(prev => {
      const updated = { ...prev, [day]: { ...prev[day], [field]: val } };
      onChange(serializeHours(updated));
      return updated;
    });
  }, [onChange]);

  const copyToWeekdays = useCallback(() => {
    const monday = hours["Pondělí"];
    setHours(prev => {
      const updated = { ...prev };
      for (const day of ["Úterý", "Středa", "Čtvrtek", "Pátek"]) {
        updated[day] = { ...monday };
      }
      onChange(serializeHours(updated));
      return updated;
    });
  }, [hours, onChange]);

  return (
    <div className="space-y-3">
      {DAYS.map(day => (
        <div key={day} className="flex items-center gap-3">
          <span className="w-20 text-sm font-medium text-gray-700 shrink-0">{day}</span>
          <label className="flex items-center gap-2 shrink-0">
            <input
              type="checkbox"
              checked={!hours[day].closed}
              onChange={e => handleChange(day, "closed", !e.target.checked)}
              className="accent-orange-500 w-4 h-4"
            />
            <span className="text-xs text-gray-500">{hours[day].closed ? "Zavřeno" : "Otevřeno"}</span>
          </label>
          {!hours[day].closed && (
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={hours[day].open}
                onChange={e => handleChange(day, "open", e.target.value)}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
              />
              <span className="text-gray-400">—</span>
              <input
                type="time"
                value={hours[day].close}
                onChange={e => handleChange(day, "close", e.target.value)}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
              />
            </div>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={copyToWeekdays}
        className="text-xs text-orange-500 hover:text-orange-600 font-medium mt-1"
      >
        Kopírovat pondělí na Út–Pá
      </button>
    </div>
  );
}

function parseHours(json: string | null): Record<string, DaySchedule> {
  const defaults: Record<string, DaySchedule> = {};
  for (const day of DAYS) {
    const isWeekend = day === "Sobota" || day === "Neděle";
    defaults[day] = { open: "08:00", close: "17:00", closed: isWeekend };
  }

  if (!json) return defaults;

  try {
    const parsed = JSON.parse(json) as Record<string, string>;
    for (const day of DAYS) {
      const val = parsed[day];
      if (!val || val === "Zavřeno") {
        defaults[day] = { open: "08:00", close: "17:00", closed: true };
      } else {
        // Parsuje "08:00 - 17:00"
        const parts = val.split(/\s*[-–—]\s*/);
        defaults[day] = {
          open: parts[0]?.trim() || "08:00",
          close: parts[1]?.trim() || "17:00",
          closed: false,
        };
      }
    }
  } catch {
    // Pokud JSON parse selže, vrátí defaults
  }
  return defaults;
}

function serializeHours(hours: Record<string, DaySchedule>): string {
  const result: Record<string, string> = {};
  for (const day of DAYS) {
    const h = hours[day];
    result[day] = h.closed ? "Zavřeno" : `${h.open} - ${h.close}`;
  }
  return JSON.stringify(result);
}
```

**Klíčové principy:**
- Default: Po-Pá 08:00-17:00, So-Ne Zavřeno
- Checkbox toggle Otevřeno/Zavřeno
- `input type="time"` pro čas (nativní time picker na mobilu)
- Tlačítko "Kopírovat pondělí na Út–Pá" pro rychlé nastavení
- `onChange` se volá na každou změnu — parent drží form state
- `parseHours` je defensive (try/catch, zvládne i dash varianty)
- `serializeHours` produkuje JSON kompatibilní s `/bazar/[slug]` renderingem

---

## §2 Soubory k editaci

### 2.1 `app/api/partner/profile/route.ts` — PUT handler (line 58-67)

**Aktuální kód (line 58-67):**
```tsx
const updated = await prisma.partner.update({
  where: { id: partner.id },
  data: {
    description: body.description ?? partner.description,
    phone: body.phone ?? partner.phone,
    email: body.email ?? partner.email,
    web: body.web ?? partner.web,
    address: body.address ?? partner.address,
  },
});
```

**Změna:** Přidat `openingHours` do `data` objektu:

```diff
  data: {
    description: body.description ?? partner.description,
    phone: body.phone ?? partner.phone,
    email: body.email ?? partner.email,
    web: body.web ?? partner.web,
    address: body.address ?? partner.address,
+   openingHours: body.openingHours !== undefined ? body.openingHours : partner.openingHours,
  },
```

**Poznámka:** Používáme `!== undefined` (ne `??`) protože `openingHours` může být legitimně `null` (uživatel chce smazat). Validator `updatePartnerSchema` v `lib/validators/partner.ts:45` už akceptuje `openingHours: z.string().optional().nullable()`, takže není potřeba měnit validátor.

**DŮLEŽITÉ:** Aktuální PUT route NEPOUŽÍVÁ Zod validaci (`updatePartnerSchema`). Body se čte přímo: `const body = await request.json()`. To je existující pattern a **NEMĚNIT** ho v rámci D15 scope — to by byl jiný task.

---

### 2.2 `app/(partner)/partner/profile/page.tsx` — nahradit placeholder (lines 16-22, 123-130)

**Změna 1 — form state rozšířit (line 16-22):**

```diff
  const [form, setForm] = useState({
    description: "",
    phone: "",
    email: "",
    web: "",
    address: "",
+   openingHours: null as string | null,
  });
```

**Změna 2 — load state rozšířit (line 31-36):**

```diff
  setForm({
    description: data.description || "",
    phone: data.phone || "",
    email: data.email || "",
    web: data.web || "",
    address: data.address || "",
+   openingHours: data.openingHours || null,
  });
```

**Změna 3 — import + nahradit placeholder Card (line 123-130):**

Přidat import na začátek souboru:
```tsx
import { OpeningHoursEditor } from "@/components/partner/OpeningHoursEditor";
```

Nahradit lines 123-130:
```tsx
// STARÝ KÓD (smazat):
<Card className="p-6">
  <h3 className="text-lg font-bold text-gray-900 mb-4">
    Oteviraci doba
  </h3>
  <p className="text-sm text-gray-500">
    Editor oteviraci doby bude brzy k dispozici.
  </p>
</Card>

// NOVÝ KÓD:
<Card className="p-6">
  <h3 className="text-lg font-bold text-gray-900 mb-4">
    Otevírací doba
  </h3>
  <OpeningHoursEditor
    value={form.openingHours}
    onChange={(json) => setForm(p => ({ ...p, openingHours: json }))}
  />
</Card>
```

**Poznámka:** "Ulozit profil" button (line 117) už posílá celý `form` objekt přes `JSON.stringify(form)`. Díky přidání `openingHours` do form state se automaticky odešle v PUT requestu — **žádná další změna v handleSave() není potřeba.**

---

## §3 Acceptance criteria

- [ ] Profile page: 7 řádků (Po–Ne), checkbox Otevřeno/Zavřeno + time inputy
- [ ] Default pre nového partnera: Po–Pá 08:00-17:00, So–Ne Zavřeno
- [ ] "Kopírovat pondělí na Út–Pá" nastaví 4 dny
- [ ] "Uložit profil" uloží `openingHours` JSON do DB
- [ ] Po uložení se data zobrazují na public profilu `/bazar/[slug]`
- [ ] Editace existujících hodnot (load → edit → save roundtrip)
- [ ] Parse zvládne i stará data (robust parsing s try/catch)
- [ ] TypeScript: 0 errors
- [ ] Build: passes

## §4 STOP kritéria

- **STOP-1:** `input type="time"` nefunguje na konkrétním mobilním browseru → implementuj s nativním time inputem, iOS/Android mají native picker — to je OK
- **STOP-2:** JSON parsing selhává na starých datech → `parseHours` má try/catch + defaults, neměl by selhat
- **STOP-3:** Validace open < close — **NEIMPLEMENTOVAT** v MVP. Uživatel může mít edge case (přes půlnoc). Přidat validaci až na request.
