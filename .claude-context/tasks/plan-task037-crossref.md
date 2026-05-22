# Plan — Task #37: PartCrossReference + Compare API

**Datum:** 2026-04-14
**Gap:** G-08 (P1)
**Effort:** L (1-2 dny)

---

## 1. PRISMA SCHEMA

```prisma
model PartCrossReference {
  id                String  @id @default(cuid())
  oemNumber         String  // Originální OEM číslo (např. 1K0615301AC)
  aftermarketNumber String  // Aftermarket číslo (např. DF4276)
  manufacturer      String  // Výrobce (TRW, Bosch, LUK...)
  partId            String? // Propojení na Part pokud existuje v katalogu
  part              Part?   @relation(fields: [partId], references: [id])
  createdAt         DateTime @default(now())

  @@index([oemNumber])
  @@index([aftermarketNumber])
  @@index([partId])
}
```

Přidat na Part:
```prisma
  crossReferences PartCrossReference[]
```

---

## 2. API ROUTES

### GET /api/parts/compare?oemNumber=XXX
**Auth:** public
**Response:**
```typescript
{
  oemNumber: string;
  alternatives: Array<{
    type: "ORIGINAL" | "AFTERMARKET" | "USED";
    part?: { id, name, slug, price, stock, manufacturer, warranty, condition, image };
    crossRef?: { aftermarketNumber, manufacturer };
  }>;
}
```

**Logika:**
1. Normalizovat OEM (strip spaces/dashes)
2. Najít PartCrossReference kde oemNumber match
3. Pro každý crossRef najít Part v katalogu (partId nebo aftermarketNumber match)
4. Přidat originální díl (Part kde oemNumber match přímo)
5. Přidat použité díly (Part kde oemNumber match + partType=USED)
6. Seřadit: Originál → Aftermarket A → B → Použitý (per cena)

### GET /api/parts/[id]/alternatives (alias)
Načte Part.oemNumber → redirect na `/api/parts/compare?oemNumber=XXX`

---

## 3. FEED IMPORT INTEGRACE

V `lib/feed-import.ts` při importu nového dílu:
```typescript
// Pokud díl má oemNumber + partType=AFTERMARKET → vytvořit cross-reference
if (partData.oemNumber && partData.partType !== "USED") {
  await prisma.partCrossReference.upsert({
    where: {
      oemNumber_aftermarketNumber_manufacturer: {
        oemNumber: partData.oemNumber,
        aftermarketNumber: partData.partNumber || partData.oemNumber,
        manufacturer: partData.manufacturer || "Unknown",
      },
    },
    create: {
      oemNumber: partData.oemNumber,
      aftermarketNumber: partData.partNumber || partData.oemNumber,
      manufacturer: partData.manufacturer || "Unknown",
      partId: createdPart.id,
    },
    update: { partId: createdPart.id },
  });
}
```

---

## 4. UI

### Na detailu dílu (`/dily/[slug]/page.tsx`)
Sekce "Alternativní čísla dílu":
```
Alternativy k OEM 1K0615301AC:
| Typ        | Výrobce | Číslo    | Cena     | Stav      |
|------------|---------|----------|----------|-----------|
| Originál   | VW      | 1K0...AC | 2 890 Kč | Skladem   |
| Aftermarket| TRW     | DF4276   | 890 Kč   | Skladem   |
| Aftermarket| Bosch   | 0986...  | 1 050 Kč | Skladem   |
| Použitý    | —       | 1K0...AC | 450 Kč   | 2 ks      |
```

### Na stránce výsledků (katalog)
Pokud hledání OEM čísla → banner nahoře:
"Nalezeny alternativy k OEM 1K0615301AC — [Porovnat →]"

---

## 5. COMMIT
```
feat: add OEM cross-reference model + compare API
```
