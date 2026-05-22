# Plan: Admin správa týmu — nahradit hardcoded team členy DB daty

**Datum:** 2026-04-28
**Autor:** planovac
**Task:** #38

---

## PROBLÉM

Na stránce `/o-nas` (soubor `app/(web)/o-nas/page.tsx:44-63`) je tým hardcoded jako `const team = [...]`:

```typescript
const team = [
  { initials: "RZ", name: "Radim Zajíček", position: "Zakladatel & COO", bio: "..." },
  { initials: "YU", name: "Yevgen Ulyanchenko", position: "Zakladatel, CEO & CTO", bio: "..." },
  { initials: "KF", name: "Kateřina Fusslová", position: "Manažer prodeje", bio: "..." },
];
```

**Poznámka:** Yevgen už MÁ titul "Zakladatel, CEO & CTO" (řádek 54) — to je v pořádku.

Problém: přidání/úprava/odebrání člena týmu vyžaduje deploy. Musí se spravovat z admin panelu.

---

## IMPLEMENTAČNÍ PLÁN

### Fáze 1: Prisma schema — TeamMember model

**Soubor:** `prisma/schema.prisma`

```prisma
model TeamMember {
  id        String   @id @default(cuid())
  name      String
  initials  String   @db.VarChar(4)
  position  String
  bio       String   @db.Text
  photoUrl  String?
  order     Int      @default(0)
  isPublic  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Pole:**
- `name` — celé jméno
- `initials` — max 4 znaky (zobrazeno v kruhu když chybí foto)
- `position` — pracovní pozice ("Zakladatel, CEO & CTO")
- `bio` — krátký popis
- `photoUrl` — nullable, upload přes `lib/upload.ts`
- `order` — pořadí zobrazení (0 = první)
- `isPublic` — viditelný na webu?

**Migrace:** `npx prisma migrate dev --name add_team_member`

**Seed:** Přidat do `prisma/seed.ts` existující 3 členy týmu.

### Fáze 2: API route

**Nový soubor:** `app/api/admin/team/route.ts`

```
GET  /api/admin/team          — seznam členů (admin only)
POST /api/admin/team          — vytvoření nového člena
```

**Nový soubor:** `app/api/admin/team/[id]/route.ts`

```
GET    /api/admin/team/[id]   — detail člena
PUT    /api/admin/team/[id]   — úprava
DELETE /api/admin/team/[id]   — smazání
```

**Validace (Zod):**
```typescript
const teamMemberSchema = z.object({
  name: z.string().min(2).max(100),
  initials: z.string().min(1).max(4),
  position: z.string().min(2).max(200),
  bio: z.string().min(10).max(1000),
  photoUrl: z.string().url().nullable().optional(),
  order: z.number().int().min(0).default(0),
  isPublic: z.boolean().default(true),
});
```

**Auth:** ADMIN + BACKOFFICE only (getServerSession check).

### Fáze 3: Admin stránka

**Nový soubor:** `app/(admin)/admin/team/page.tsx`

UI:
- Seznam členů týmu (cards s foto/iniciálami, jméno, pozice, pořadí)
- Drag & drop nebo šipky pro změnu pořadí
- Tlačítko "Přidat člena"
- Edit/delete ikony na každé kartě

**Nový soubor:** `app/(admin)/admin/team/[id]/edit/page.tsx` (nebo modal)

Formulář:
- Jméno, Iniciály, Pozice, Bio (textarea)
- Foto upload (přes `lib/upload.ts` → file server)
- Pořadí (number input)
- Veřejný (checkbox)
- Uložit / Smazat

**AdminSidebar:** Přidat link do navigace:
```typescript
// components/admin/AdminSidebar.tsx — přidat do items:
{ id: "team", href: "/admin/team", icon: "👥", label: "Tým" }
```

### Fáze 4: Úprava O nás stránky

**Soubor:** `app/(web)/o-nas/page.tsx`

Změny:
1. Smazat hardcoded `const team = [...]` (řádky 44-63)
2. Přidat DB query:
```typescript
async function getTeamMembers() {
  try {
    return await prisma.teamMember.findMany({
      where: { isPublic: true },
      orderBy: { order: "asc" },
    });
  } catch {
    return [];
  }
}
```
3. V komponentě volat `const team = await getTeamMembers();`
4. Upravit rendering — pokud `photoUrl` existuje, zobrazit `<img>`, jinak iniciály v kruhu (stávající design)

### Fáze 5: Seed data

**Soubor:** `prisma/seed.ts` — přidat na konec:

```typescript
console.log("Seeding team members...");
await prisma.teamMember.upsert({
  where: { id: "team-radim" },
  create: { id: "team-radim", name: "Radim Zajíček", initials: "RZ", position: "Zakladatel & COO", bio: "Zakladatel CarMakléř...", order: 0 },
  update: {},
});
await prisma.teamMember.upsert({
  where: { id: "team-yevgen" },
  create: { id: "team-yevgen", name: "Yevgen Ulyanchenko", initials: "YU", position: "Zakladatel, CEO & CTO", bio: "Zodpovídá za strategii...", order: 1 },
  update: {},
});
await prisma.teamMember.upsert({
  where: { id: "team-katerina" },
  create: { id: "team-katerina", name: "Kateřina Fusslová", initials: "KF", position: "Manažer prodeje", bio: "Koordinuje tým makléřů...", order: 2 },
  update: {},
});
```

---

## SOUBORY

| Soubor | Akce | Fáze |
|--------|------|------|
| `prisma/schema.prisma` | Přidat TeamMember model | 1 |
| `prisma/seed.ts` | Přidat seed data | 5 |
| `app/api/admin/team/route.ts` | NOVÝ — CRUD list/create | 2 |
| `app/api/admin/team/[id]/route.ts` | NOVÝ — CRUD detail/update/delete | 2 |
| `app/(admin)/admin/team/page.tsx` | NOVÝ — admin seznam | 3 |
| `components/admin/AdminSidebar.tsx` | Přidat "Tým" link | 3 |
| `app/(web)/o-nas/page.tsx` | Nahradit hardcoded → DB query | 4 |

**Celkem:** 3 nové soubory + 4 upravené

---

## STOP PRAVIDLA

1. **STOP** — seed data MUSÍ obsahovat přesné texty ze stávajícího `const team` pole (ne přepisovat)
2. **STOP** — Yevgen pozice = "Zakladatel, CEO & CTO" (ne "CEO & CTO")
3. **STOP** — pokud je DB prázdná/nedostupná → zobrazit prázdnou sekci, NE fallback na hardcoded
4. **STOP** — fotky přes `lib/upload.ts`, NE přes Cloudinary SDK přímo
