# QA Report: FIX M7+M8+M11 — Visual search 503 + Checkout error + Shipping label

**Task:** #29  
**Commit:** `2403e21`  
**Kontrolor:** KONTROLOR agent  
**Datum:** 2026-04-24

---

## VERDIKT: ✅ PASS (všechny 3 fixy)

---

## M8 — Checkout error display + clearCart fix (KRITICKÝ)

**Soubor:** `app/(web)/shop/objednavka/page.tsx`

### Klíčová otázka: clearCart() v error path?

```tsx
const handleSubmit = async () => {
  setSubmitting(true);
  setSubmitError(null);
  try {
    const res = await fetch("/api/orders", { method: "POST", ... });

    if (res.ok) {
      const data = await res.json();
      clearCart();                             // ← POUZE na success
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      router.push(`/shop/objednavka/potvrzeni?id=${data.order?.orderNumber ?? data.order?.id}${trackingParam}`);
    } else {
      const errData = await res.json().catch(() => null);
      setSubmitError(
        errData?.error || "Objednávku se nepodařilo odeslat. Zkuste to prosím znovu."
      );
    }
  } catch {
    setSubmitError("Chyba spojení. Zkontrolujte připojení k internetu a zkuste to znovu.");
  } finally {
    setSubmitting(false);
  }
};
```

**Výsledek:**
- `clearCart()` se volá **POUZE** v `if (res.ok)` bloku — **nikdy** v error/catch path ✅
- Žádný demo redirect v error path ✅
- `else` větev: 4xx/5xx → `setSubmitError(errData?.error || fallback)` ✅
- `catch`: network error → `setSubmitError("Chyba spojení...")` ✅
- `res.json().catch(() => null)` — správné ošetření non-JSON error response ✅
- `setSubmitError(null)` na začátku každého submit — stale error se resetuje ✅
- `disabled={submitting}` — zabraňuje double-submit ✅

**Error UI:**
```tsx
{submitError && (
  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
    <p className="text-sm font-semibold text-red-700">{submitError}</p>
  </div>
)}
```
✅ Inline error message nad navigačními tlačítky — viditelné, konzistentní design

**Loading state:**
```tsx
<Button variant="primary" onClick={handleSubmit} disabled={submitting}>
  {submitting ? "Odesílám..." : "Odeslat objednávku"}
</Button>
```
✅ Loading text + disabled — UX ok

---

## M7 — Visual search HTTP 503 (bez API key)

**Soubor:** `app/api/parts/visual-search/route.ts`

```ts
const anthropicKey = process.env.ANTHROPIC_API_KEY;

if (!anthropicKey) {
  return NextResponse.json({
    recognized: false,
    message: "Vizuální vyhledávání je momentálně nedostupné. Zkuste popsat díl textově.",
    suggestions: [],
    status: "unavailable",
  }, { status: 503 });   // ← původně 200, nyní 503
}
```

✅ HTTP 503 Service Unavailable místo 200 — UI může detekovat chybu ✅
✅ Response obsahuje `status: "unavailable"` — umožňuje UI skrýt/degradovat feature ✅
✅ Srozumitelná zpráva pro uživatele ✅
✅ Dynamický import Claude SDK (`await import("@anthropic-ai/sdk")`) — key-gate funguje ✅
✅ Model: `claude-sonnet-4-20250514` — aktuální verze ✅

**Minor poznámka (mimo scope):** Catch blok na ř. 103 vrací HTTP 200 bez status kódu (default):
```ts
} catch (error) {
  return NextResponse.json({ recognized: false, message: "...", suggestions: [] });
  // ↑ chybí { status: 500 } — neblokující, response obsahuje recognized: false
}
```
Nesouvisí s M7 opravou — pouze pro evidenci.

---

## M11 — ShippingLabelCard: nahrazení "(nedostupné)"

**Soubor:** `components/pwa-parts/orders/ShippingLabelCard.tsx`

Původní problém: hardcoded disabled button "(nedostupné)" bez kontextu.  
Fix: Multi-variant component s jasnou komunikací stavu.

**5 variant (správně implementovány):**

| Varianta | Podmínka | UI |
|----------|----------|----|
| 1. PICKUP | `deliveryMethod === "PICKUP"` | Info box + "Označit jako vyzvednuto" |
| 2. Odesláno | `shippedAt != null` | Zelený card + tracking info |
| 3. Bez štítku | `!shippingLabelUrl` | "Štítek zatím není připraven" + "Čekáme na platbu" disabled |
| 4. Happy path | `shippingLabelUrl && !shippedAt` | PDF download + "Označit jako odesláno" |
| 5. DRY-RUN | `trackingNumber.startsWith("DRY-")` | Overlay banner na variantě 4 |

**Varianta 3 — klíčová (nahrazuje "(nedostupné)"):**
```tsx
if (!shippingLabelUrl) {
  return (
    <Card className="p-4 border-2 border-amber-100 bg-amber-50/40">
      <h3>Štítek zatím není připraven</h3>
      <p>Čekáme na platbu. Jakmile zákazník zaplatí, automaticky se vygeneruje přepravní štítek.</p>
      <Button variant="outline" size="lg" className="w-full" disabled>
        🖨️ Čekáme na vygenerování štítku
      </Button>
      <p className="text-xs text-center text-gray-400">
        Štítek se automaticky vygeneruje po přijetí platby.
      </p>
    </Card>
  );
}
```
✅ Jasné vysvětlení proč tlačítko není dostupné  
✅ Amber barva signalizuje "čeká" stav  
✅ Automatická generace štítku po platbě — komunikáno uživateli

**DRY-RUN banner (varianta 5):**
```tsx
{isDryRun && (
  <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
    <strong>⚠️ DRY-RUN režim</strong>
    <p>Štítek je placeholder (není skutečná zásilka). Pro produkční provoz nastav API klíče dopravce v .env.</p>
  </div>
)}
```
✅ Jasná komunikace že je ve vývoji + instrukce pro produkci

**Error handling:**
```tsx
const [error, setError] = useState<string | null>(null);
// ...
async function putStatus(...) {
  try {
    const res = await fetch(`/api/orders/${orderId}/status`, { method: "PUT", ... });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Nepodařilo se aktualizovat stav objednávky");
      return;
    }
    onSuccess();
  } catch {
    setError("Chyba spojení — zkuste to prosím znovu");
  }
}
```
✅ Error state s UI zobrazením (červený div)  
✅ 4xx/5xx i network error zachyceny  
✅ `window.confirm` před kritickými akcemi (per team-lead decision)  
✅ `supplierCount > 1` → blue warning banner pro koordinaci  

---

## Acceptance Criteria

| AC | Popis | Výsledek |
|----|-------|---------|
| M8-1 | clearCart() NIKDE v error path | ✅ |
| M8-2 | Žádný demo redirect | ✅ |
| M8-3 | Error message viditelný v UI | ✅ inline red div |
| M8-4 | 4xx/5xx zachyceno | ✅ `else setSubmitError(errData?.error)` |
| M8-5 | Network error zachyceno | ✅ `catch setSubmitError` |
| M8-6 | Loading state + disabled submit | ✅ |
| M7-1 | API vrací HTTP 503 bez API key | ✅ |
| M7-2 | Response status: "unavailable" | ✅ |
| M7-3 | Srozumitelná zpráva | ✅ |
| M11-1 | "(nedostupné)" nahrazeno | ✅ |
| M11-2 | Jasná komunikace stavu | ✅ 5 variant |
| M11-3 | DRY-RUN komunikace | ✅ amber banner + .env instrukce |
| M11-4 | Error handling pro PUT status | ✅ |

---

## Souhrn

| Fix | Verdict |
|-----|---------|
| M8 — Checkout clearCart + error display | ✅ PASS |
| M7 — Visual search HTTP 503 | ✅ PASS |
| M11 — ShippingLabelCard nahrazení "(nedostupné)" | ✅ PASS |

**Všechny 3 fixy připraveny k evžen review / merge.**
