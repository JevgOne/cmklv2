# Plan — Task #38: Search history + cross-sell na detailu vozu

**Datum:** 2026-04-14
**Gap:** G-15 + G-16 (P1/P2)
**Effort:** M (4-8h)

---

## DŮLEŽITÝ NÁLEZ: Cross-sell je HOTOVÝ

`components/web/RecommendedParts.tsx` + `/api/parts/for-vehicle` JIŽ EXISTUJE a je POUŽIT na `/nabidka/[slug]/page.tsx`. **G-16 je vyřešený.**

Tento plán se týká pouze **search history**.

---

## 1. PRISMA SCHEMA

```prisma
model SearchQuery {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation("UserSearchHistory", fields: [userId], references: [id], onDelete: Cascade)
  query     String
  type      String   @default("PARTS") // PARTS, VEHICLES
  resultCount Int?
  createdAt DateTime @default(now())

  @@index([userId, createdAt])
}
```

Přidat na User:
```prisma
  searchHistory SearchQuery[] @relation("UserSearchHistory")
```

---

## 2. API

### POST /api/search/history (logování)
**Auth:** přihlášený
**Body:** `{ query, type?, resultCount? }`
**Logika:**
1. Upsert — pokud stejný query existuje, update timestamp
2. Max 10 per user (smazat nejstarší)

### GET /api/search/history
**Auth:** přihlášený
**Response:** `{ queries: [{ query, type, createdAt }] }` (posledních 10)

---

## 3. CLIENT-SIDE HISTORY (guest)

V `lib/search-history.ts` (NOVÝ):
```typescript
const STORAGE_KEY = "carmakler_search_history";
const MAX_GUEST = 5;

export function addSearchHistory(query: string) {
  const history = getSearchHistory();
  const filtered = history.filter(h => h !== query);
  filtered.unshift(query);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_GUEST)));
}

export function getSearchHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch { return []; }
}

export function clearSearchHistory() {
  localStorage.removeItem(STORAGE_KEY);
}
```

---

## 4. UI

### SmartSearchBar — focus empty suggestions
Na focus s prázdným inputem → zobrazit "Hledali jste naposledy":
```
Hledali jste naposledy:
  brzdové destičky octavia
  přední světlo fabia
  1K0615301AC
  [Smazat historii]
```

Merge server + localStorage histories (přihlášený → server priorita).

### Homepage eshopu — "Hledali jste naposledy"
V `app/(web)/dily/page.tsx` po přihlášení:
```tsx
{session && searchHistory.length > 0 && (
  <section>
    <h3>Hledali jste naposledy</h3>
    <div className="flex gap-2">
      {searchHistory.map(q => (
        <Link href={`/dily/katalog?search=${q}`} className="chip">{q}</Link>
      ))}
    </div>
  </section>
)}
```

---

## 5. INTEGRACE

Volání `POST /api/search/history` + `addSearchHistory(q)`:
- Po úspěšném hledání v katalogu (při submit search formu)
- V SmartSearchBar při Enter/submit

---

## 6. COMMIT
```
feat: add search history (DB for logged-in, localStorage for guests)
```
