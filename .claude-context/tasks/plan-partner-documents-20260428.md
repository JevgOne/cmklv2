# Plan: Partner Documents — nahradit stub reálnou funkcionalitou

**Datum:** 2026-04-28
**Autor:** planovac
**Task:** #34

---

## PROBLÉM

`app/(partner)/partner/documents/page.tsx` zobrazuje hardcoded seznam 3 dokumentů s tlačítkem "Připravujeme" (řádek 66). Partneři nemohou nahrávat/stahovat žádné dokumenty.

Stávající stav:
1. "Partnerská smlouva" — `available: false`, `href: null` → "Připravujeme"
2. "Obchodní podmínky" — `available: true`, `href: "/obchodni-podminky"` → link na web
3. "Měsíční vyúčtování" — `available: false`, `href: null` → "Připravujeme"

---

## IMPLEMENTAČNÍ PLÁN

### Fáze 1: Prisma schema — PartnerDocument model

**Soubor:** `prisma/schema.prisma`

```prisma
model PartnerDocument {
  id          String   @id @default(cuid())
  partnerId   String
  partner     Partner  @relation(fields: [partnerId], references: [id])
  title       String
  description String?
  fileUrl     String
  fileName    String
  fileSize    Int      // bytes
  category    String   // "CONTRACT", "INVOICE", "REPORT", "OTHER"
  uploadedBy  String   // userId — kdo nahrál (admin nebo partner)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([partnerId])
}
```

Přidat relaci do Partner modelu:
```prisma
model Partner {
  // ... existing fields ...
  documents PartnerDocument[]
}
```

**Migrace:** `npx prisma migrate dev --name add_partner_document`

### Fáze 2: API routes

**Nový soubor:** `app/api/partners/[id]/documents/route.ts`

```
GET  /api/partners/[id]/documents     — seznam dokumentů partnera
POST /api/partners/[id]/documents     — upload nového dokumentu (multipart/form-data)
```

**Nový soubor:** `app/api/partners/[id]/documents/[docId]/route.ts`

```
DELETE /api/partners/[id]/documents/[docId]  — smazání dokumentu
```

**Auth:**
- Partner vidí jen SVOJE dokumenty (session.user.partnerId === id)
- Admin/Backoffice vidí a uploaduje pro libovolného partnera

**Upload:** Přes `lib/upload.ts` → `{UPLOAD_DIR}/partners/{partnerId}/documents/`

**Validace:**
- Max 10 MB per soubor
- Povolené typy: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG
- Max 50 dokumentů per partner

### Fáze 3: Partner Documents stránka — přepsat

**Soubor:** `app/(partner)/partner/documents/page.tsx` — PŘEPSAT

Z `"use client"` komponenty s hardcoded daty na server component s DB query:

```typescript
export default async function PartnerDocumentsPage() {
  const session = await getServerSession(authOptions);
  const partner = await prisma.partner.findFirst({
    where: { userId: session.user.id },
    include: { documents: { orderBy: { createdAt: "desc" } } },
  });

  // Vždy zobrazit "Obchodní podmínky" jako statický link
  // Dynamické dokumenty z DB
  // Upload formulář
}
```

UI:
- **Sekce 1:** Statické dokumenty (Obchodní podmínky — link na /obchodni-podminky) — tyto zůstávají
- **Sekce 2:** Nahrané dokumenty (z DB) — cards s ikonou, názvem, velikostí, datem, download tlačítkem
- **Sekce 3:** Upload formulář — drag & drop zone nebo file input, kategorie select, popis (optional)
- **Prázdný stav:** "Zatím nemáte žádné dokumenty" místo "Připravujeme"

### Fáze 4: Admin — dokumenty partnera

**Soubor:** `app/(admin)/admin/partners/[id]/page.tsx` nebo samostatná sekce

Přidat do detailu partnera (existující stránka):
- Seznam dokumentů partnera
- Upload dokumentu pro partnera (admin může nahrát smlouvu)
- Smazání dokumentu

---

## SOUBORY

| Soubor | Akce | Fáze |
|--------|------|------|
| `prisma/schema.prisma` | Přidat PartnerDocument model + relace | 1 |
| `app/api/partners/[id]/documents/route.ts` | NOVÝ — GET/POST | 2 |
| `app/api/partners/[id]/documents/[docId]/route.ts` | NOVÝ — DELETE | 2 |
| `app/(partner)/partner/documents/page.tsx` | PŘEPSAT — server component s DB | 3 |
| Admin partner detail | UPRAVIT — přidat documents sekci | 4 |

**Celkem:** 2 nové soubory + 2-3 upravené

---

## STOP PRAVIDLA

1. **STOP** — "Obchodní podmínky" link na `/obchodni-podminky` ZŮSTÁVÁ jako statický (ne z DB)
2. **STOP** — upload přes `lib/upload.ts`, NE přes Cloudinary
3. **STOP** — partner vidí JEN svoje dokumenty (session check)
4. **STOP** — žádné "Připravujeme" texty v nové implementaci
5. **STOP** — maximální velikost 10 MB, validovat na serveru
