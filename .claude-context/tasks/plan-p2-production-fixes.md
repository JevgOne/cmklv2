# Plan: P2 Production Fixes — 4 bugy z produkčního auditu

**Datum:** 2026-04-26
**Status:** PLAN READY
**Zdroj:** `.claude-context/tasks/chrome-production-audit-20260426.md`

---

## BUG P2-1: `/profil/[slug]` — stats vs. items mismatch

### Symptom
Stats box zobrazuje "3 vozidla", záložka Vozidla zobrazuje "Žádné položky".

### Analýza

**Stats (server-side):** `app/(web)/profil/[slug]/page.tsx:70-72`
```typescript
const vehicleCount = await prisma.vehicle.count({
  where: { brokerId: user.id, status: "ACTIVE" },
});
```
Předáno do `ProfileClient` jako `stats.vehicles`.

**Items (client-side):** `app/api/profile/[slug]/items/route.ts:28-29`
```typescript
const items = await prisma.vehicle.findMany({
  where: { brokerId: user.id, status: "ACTIVE" },
  select: { ..., broker: {...}, _count: { select: { profileLikes: true, profileComments: true } } },
});
```

**Queries jsou identické** co do `where` clause. Obě používají `{ brokerId: user.id, status: "ACTIVE" }`.

**Seed data:** Jan Novák (BROKER) má 3 vozidla s `status: "ACTIVE"` (seed.ts:415, 538, 618).

### Root cause — 3 možné příčiny

#### 1. NEJPRAVDĚPODOBNĚJŠÍ: ISR cache stale + produkční data změna

Stránka `page.tsx` má `revalidate = 300` (5 min ISR cache). Stats jsou z cache, ale items API vrací aktuální data. Pokud se na produkci data změnila (vozidla deaktivována/smazána po posledním cache rebuild), stats ukazují starou hodnotu.

**Proč 3 vs 0:** Stats cachované z doby kdy vozidla existovala → 3. Reálně v DB status změněn → API vrací 0.

#### 2. MOŽNÉ: Items API selhává tiše

Items API je komplexnější — include `broker`, `images`, `_count`. Pokud jakýkoliv relation select selže, API vrátí 500 a `ProfileClient` tiše nastaví prázdné pole.

`ProfileClient.tsx:211-218`:
```typescript
const res = await fetch(url, { signal });
if (res.ok) {                    // ← API error → items zůstanou []
  const data = await res.json();
  setItems(data.items ?? []);
}
```
Žádný error toast, žádný log.

#### 3. MÉNĚ PRAVDĚPODOBNÉ: totalSales fallback

`page.tsx:132-134`:
```typescript
const authoritativeSold = vehicleSoldCount + listingSoldCount;
const soldCount = authoritativeSold > 0 ? authoritativeSold : user.totalSales;
```
`totalSales` se ukládá na User modelu a nemusí odpovídat reálnému stavu. Ale toto ovlivňuje stat "Prodáno", ne "Vozidla".

### Fix — 2 kroky

**Krok 1: Přidat error handling do ProfileClient**

**Edit:** `app/(web)/profil/[slug]/ProfileClient.tsx` — fetchItems

```typescript
const res = await fetch(url, { signal });
if (res.ok) {
  const data = await res.json();
  setItems(cursor ? [...prev, ...data.items] : data.items ?? []);
  setNextCursor(data.nextCursor);
  setItemType(data.type);
} else {
  console.error("Profile items API error:", res.status);
  // Optionally show error state
}
```

**Krok 2: Produkční diagnostika**

```bash
ssh server
# Ověřit data v DB
curl -s "http://localhost:3000/api/profile/jan-novak-praha/items?tab=vehicles&limit=12" | jq '.items | length'
# Pokud 0 → zkontrolovat DB
npx prisma studio  # → Vehicle tabulka → filtr brokerId + status
```

**Krok 3: Zvážit konzistentní datový zdroj**

Dlouhodobě: přesunout stats do items API response (single source of truth) nebo fetchovat stats client-side. Eliminuje ISR cache mismatch.

**Složitost:** MALÁ (error handling) + DIAGNOSTIKA (produkce)

---

## BUG P2-2: `/dily/kosik` — chybí H1 nadpis

### Symptom
Stránka košíku nemá H1 nadpis.

### Root cause

**Soubor:** `app/(web)/dily/kosik/page.tsx`

H1 existuje pro plný košík (line 53):
```tsx
<h1 className="text-3xl font-extrabold text-gray-900">Košík</h1>
```

Ale pro **prázdný košík** (line 33-46) zobrazuje jen `EmptyState` komponentu BEZ H1:
```tsx
<EmptyState
  icon="🛒"
  title="Košík je prázdný"       // ← toto NENÍ <h1>
  description="Prozkoumejte náš katalog..."
/>
```

Audit pravděpodobně otestoval prázdný košík (žádné díly v localStorage).

### Fix

**Edit:** `app/(web)/dily/kosik/page.tsx` — přidat H1 nad EmptyState

```tsx
<div className="min-h-screen bg-gray-50">
  <section className="bg-white border-b border-gray-200">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-extrabold text-gray-900">Košík</h1>
    </div>
  </section>
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <EmptyState ... />
  </div>
</div>
```

**Složitost:** TRIVIÁLNÍ
**Riziko:** NULOVÉ

---

## BUG P2-4: Admin export tlačítko — UŽ OPRAVENO

### Analýza

Commit `3255d55` (`feat(admin): implement CSV export for vehicles, brokers, commissions`):
- Nový `app/(admin)/admin/dashboard/ExportButton.tsx` — dropdown s 3 CSV exporty (Vozidla, Makléři, Provize)
- Nový `app/api/admin/export/route.ts` — API s BOM pro Excel kompatibilitu
- Auth: ADMIN/BACKOFFICE

**ExportButton** je plně funkční: dropdown menu, blob download, loading spinner, error handling.

### Status: **OPRAVENO v kódu** — nutné ověřit deploy na produkci

Pokud commit `3255d55` je součástí posledního buildu na produkci, bug je vyřešen. Pokud ne → potřeba rebuild + deploy.

```bash
ssh server
cd /var/www/carmakler
git log --oneline -5  # Ověřit jestli 3255d55 je v historii
```

**Žádná další akce potřeba** (krom ověření deploye).

---

## BUG P2-5: Admin search bar — UŽ OPRAVENO

### Analýza

Commit `17943be` (`feat(admin): add functional search bar with Cmd+K shortcut`):
- Nový `components/admin/AdminGlobalSearch.tsx` — 311 řádků, debounced search, modal
- Edit `components/admin/AdminHeader.tsx` — integruje AdminGlobalSearch, Cmd/Ctrl+K shortcut
- Vyhledávání: vozidla, kontakty, smlouvy → redirect na admin detail

**AdminHeader.tsx** importuje a používá `AdminGlobalSearch`:
```tsx
import { AdminGlobalSearch } from "@/components/admin/AdminGlobalSearch";
// ...
<AdminGlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
```

### Status: **OPRAVENO v kódu** — nutné ověřit deploy na produkci

Stejné jako P2-4 — commit existuje, funkčnost implementována. Ověřit deploy.

```bash
ssh server
cd /var/www/carmakler
git log --oneline | grep 17943be  # Ověřit přítomnost commitu
```

**Žádná další akce potřeba** (krom ověření deploye).

---

## Souhrn změn

| Bug | Soubor | Akce | Složitost | Status |
|-----|--------|------|-----------|--------|
| P2-1 | `app/(web)/profil/[slug]/ProfileClient.tsx` | EDIT (error handling) | MALÁ | NOVÝ FIX |
| P2-1 | produkce | DIAGNOSTIKA | — | POTŘEBA |
| P2-2 | `app/(web)/dily/kosik/page.tsx` | EDIT (přidat H1 do empty state) | TRIVIÁLNÍ | NOVÝ FIX |
| P2-4 | — | Ověřit deploy commitu `3255d55` | — | UŽ OPRAVENO |
| P2-5 | — | Ověřit deploy commitu `17943be` | — | UŽ OPRAVENO |

**Nové změny: 2 edity souborů. P2-4 a P2-5 jsou hotové — jen ověřit deploy.**

---

## Pořadí implementace

1. **P2-2** — H1 do košíku (triviální, okamžitý SEO/a11y efekt)
2. **P2-1** — Error handling + diagnostika na produkci
3. **P2-4 + P2-5** — Ověřit deployment (jen SSH check)
