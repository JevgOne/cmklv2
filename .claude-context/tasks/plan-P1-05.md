# Plan P1-05: Resend email konfigurace — audit a graceful fallbacks

**Priorita:** P1
**Slozitost:** M
**Zavislosti:** P0-07 (env — HOTOVO v Batch 1)
**Batch:** 2
**Fix plan reference:** Puvodne P1-06 ve fix-plan-production-readiness.md
**Blokuje:** P1-09 (zapomenute heslo), P2-07 (handover follow-up), P2-13 (email verifikace)

---

## Cil

1. Overit ze vsechny email-send cesty v kodu pouzivaji Resend spravne
2. Centralizovat Resend inicializaci do sdileneho modulu (DRY)
3. Pridat graceful fallback pro vsechny email cesty (pokud RESEND_API_KEY chybi)
4. Dokumentovat DNS setup pro domenu `carmakler.cz`
5. Sjednotit from adresy

---

## Audit: Vsechny soubory pouzivajici Resend

Grep nasel **8 souboru** ktere pouzivaji `new Resend(process.env.RESEND_API_KEY)`:

| # | Soubor | Ucel | From adresa | Graceful? |
|---|--------|------|-------------|-----------|
| 1 | `app/api/emails/send/route.ts` (L119) | Maklerske emaily (PWA) | `info@carmakler.cz` | ANO — catch blok, log FAILED |
| 2 | `app/api/invitations/route.ts` (L123) | Pozvanka maklere | `info@carmakler.cz` | CASTECNE — `if (RESEND_API_KEY)` guard |
| 3 | `app/api/contracts/[id]/send/route.ts` (L91) | Odeslani smlouvy | `smlouvy@carmakler.cz` | NE — vyhodi 500 |
| 4 | `app/api/payments/[id]/confirm/route.ts` (L91) | Potvrzeni platby | `info@carmakler.cz` | NE — vyhodi 500 |
| 5 | `app/api/payments/webhook/route.ts` (L90) | Stripe webhook notifikace | `info@carmakler.cz` | NE — vyhodi 500 |
| 6 | `app/api/cron/daily-summary/route.ts` (L246) | Denni shrnuti pro maklere | `info@carmakler.cz` | NE — vyhodi 500 |
| 7 | `app/api/payouts/seller/[id]/process/route.ts` (L72) | Notifikace prodejci o vyplate | `info@carmakler.cz` | NE — vyhodi 500 |
| 8 | `lib/listing-sla.ts` (L188) | Watchdog match + SLA reminders | `info@carmakler.cz` | ANO — `if (!apiKey) return` guard |

**Dodatecne misto bez Resendu (TODO komentar):**

| # | Soubor | Ucel | Stav |
|---|--------|------|------|
| 9 | `app/api/marketplace/apply/route.ts` (L35) | Zadost o pristup | Jen komentar: "V budoucnu: email pres Resend" |

### Problemy nalezene auditem

1. **DRY porruseni:** `new Resend(process.env.RESEND_API_KEY)` se opakuje 8x. Zadny sdileny modul.
2. **Nekonzistentni graceful fallback:** 2 soubory maji guard, 5 souboru vyhodi 500, 1 ma catch.
3. **Nekonzistentni from adresy:** 7x `info@carmakler.cz`, 1x `smlouvy@carmakler.cz`. Oba musi byt overeny v Resend.
4. **Zadny centralni import:** Kazdy soubor ma `await import("resend")` (dynamic import, ok) nebo top-level import.
5. **Marketplace apply:** Chybi email notifikace pro admina.

---

## Kroky implementace

### Krok 1: Vytvorit sdileny `lib/resend.ts`

**Soubor:** `lib/resend.ts` (NOVY)

```ts
import { Resend } from "resend";

let _resend: Resend | null = null;

/**
 * Vraci Resend klienta. Inicializuje lazy (pri prvnim volani).
 * Pokud RESEND_API_KEY neni nastaveny, vraci null.
 */
export function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!_resend) {
    _resend = new Resend(apiKey);
  }
  return _resend;
}

/**
 * Default FROM adresa.
 */
export const RESEND_FROM = process.env.RESEND_FROM_EMAIL || "info@carmakler.cz";

/**
 * FROM adresy pro specificke typy emailu.
 */
export const RESEND_FROM_CONTRACTS = process.env.RESEND_FROM_EMAIL || "smlouvy@carmakler.cz";

/**
 * Odesle email pres Resend. Graceful fallback — pokud Resend neni nakonfigurovany,
 * zaloguje do konzole a vrati { success: false }.
 */
export async function sendEmail(params: {
  from?: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{ path?: string; filename?: string; content?: Buffer }>;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const resend = getResend();

  if (!resend) {
    console.warn(
      `[Email:DEV] RESEND_API_KEY not set. Would send to: ${params.to}, subject: "${params.subject}"`
    );
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    const result = await resend.emails.send({
      from: params.from || RESEND_FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      attachments: params.attachments,
    });

    return { success: true, id: result.data?.id ?? undefined };
  } catch (error) {
    console.error("[Email] Send failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
```

### Krok 2: Refaktorovat `app/api/emails/send/route.ts` (radky 116-147)

**Zmena — nahradit Resend inicializaci:**
```diff
+import { sendEmail } from "@/lib/resend";

     // Send via Resend
     let resendId: string | undefined;
-    try {
-      const { Resend } = await import("resend");
-      const resend = new Resend(process.env.RESEND_API_KEY);
-      const result = await resend.emails.send({
-        from: process.env.RESEND_FROM_EMAIL || "info@carmakler.cz",
-        to: recipientEmail,
-        subject: email.subject,
-        html: email.html,
-        text: email.text,
-        attachments: attachmentUrl
-          ? [{ path: attachmentUrl, filename: "smlouva.pdf" }]
-          : undefined,
-      });
-      resendId = result.data?.id ?? undefined;
-    } catch (sendError) {
-      console.error("Resend send error:", sendError);
-      // Log as failed
-      await prisma.emailLog.create({
-        data: {
-          templateType,
-          senderId: session.user.id,
-          vehicleId: vehicleId || null,
-          recipientEmail,
-          recipientName,
-          subject: email.subject,
-          customText,
-          status: "FAILED",
-        },
-      });
-      return NextResponse.json({ error: "Chyba pri odesilani emailu" }, { status: 500 });
-    }
+    const result = await sendEmail({
+      to: recipientEmail,
+      subject: email.subject,
+      html: email.html,
+      text: email.text,
+      attachments: attachmentUrl
+        ? [{ path: attachmentUrl, filename: "smlouva.pdf" }]
+        : undefined,
+    });
+
+    if (!result.success) {
+      await prisma.emailLog.create({
+        data: {
+          templateType,
+          senderId: session.user.id,
+          vehicleId: vehicleId || null,
+          recipientEmail,
+          recipientName,
+          subject: email.subject,
+          customText,
+          status: "FAILED",
+        },
+      });
+      return NextResponse.json({ error: "Chyba pri odesilani emailu" }, { status: 500 });
+    }
+    resendId = result.id;
```

### Krok 3: Refaktorovat `app/api/invitations/route.ts` (radky 120-148)

**Zmena:**
```diff
+import { sendEmail } from "@/lib/resend";

-    if (process.env.RESEND_API_KEY) {
-      try {
-        const { Resend } = await import("resend");
-        const resend = new Resend(process.env.RESEND_API_KEY);
-
-        await resend.emails.send({
-          from: process.env.RESEND_FROM_EMAIL || "info@carmakler.cz",
-          to: email,
-          subject: "Pozvanka do Carmakler",
-          html: `...`,
-        });
-      } catch (emailError) {
-        console.error("Email error:", emailError);
-      }
-    }
+    await sendEmail({
+      to: email,
+      subject: "Pozvanka do Carmakler",
+      html: `...`, // existujici HTML zustava beze zmeny
+    });
```

Guard `if (RESEND_API_KEY)` jiz neni potreba — `sendEmail` ho ma vnitrne.

### Krok 4: Refaktorovat `app/api/contracts/[id]/send/route.ts` (radky 89-109)

**Zmena:**
```diff
+import { sendEmail, RESEND_FROM_CONTRACTS } from "@/lib/resend";

-    const { Resend } = await import("resend");
-    const resend = new Resend(process.env.RESEND_API_KEY);
-
-    await resend.emails.send({
-      from: process.env.RESEND_FROM_EMAIL || "smlouvy@carmakler.cz",
-      to: contract.sellerEmail,
-      subject: `${contractType} - ${vehicleName} | Carmakler`,
-      html: `...`,
-      attachments: [...],
-    });
+    const result = await sendEmail({
+      from: RESEND_FROM_CONTRACTS,
+      to: contract.sellerEmail,
+      subject: `${contractType} - ${vehicleName} | Carmakler`,
+      html: `...`, // existujici HTML zustava
+      attachments: [...], // existujici attachments zustavaji
+    });
+
+    if (!result.success) {
+      console.error("Contract email failed:", result.error);
+      // Pokracovat — smlouva je ulozena, email se muze odeslat manualne
+    }
```

### Krok 5: Refaktorovat `app/api/payments/[id]/confirm/route.ts` (radky 89-91)

**Zmena:**
```diff
+import { sendEmail } from "@/lib/resend";

-      const { Resend } = await import("resend");
-      const resend = new Resend(process.env.RESEND_API_KEY);
-
-      await resend.emails.send({
-        from: process.env.RESEND_FROM_EMAIL || "info@carmakler.cz",
-        to: payment.buyerEmail,
-        subject: `Potvrzení platby | Carmakler`,
-        html: `...`,
-      });
+      await sendEmail({
+        to: payment.buyerEmail,
+        subject: `Potvrzení platby | Carmakler`,
+        html: `...`, // existujici HTML zustava
+      });
```

### Krok 6: Refaktorovat `app/api/payments/webhook/route.ts` (radky 88-92)

**Zmena:**
```diff
+import { sendEmail } from "@/lib/resend";

-            const { Resend } = await import("resend");
-            const resend = new Resend(process.env.RESEND_API_KEY);
-
-            await resend.emails.send({
-              from: process.env.RESEND_FROM_EMAIL || "info@carmakler.cz",
-              to: payment.buyerEmail,
-              subject: `Platba přijata | Carmakler`,
-              html: `...`,
-            });
+            await sendEmail({
+              to: payment.buyerEmail,
+              subject: `Platba přijata | Carmakler`,
+              html: `...`, // existujici HTML zustava
+            });
```

### Krok 7: Refaktorovat `app/api/cron/daily-summary/route.ts` (radky 244-249)

**Zmena:**
```diff
+import { sendEmail } from "@/lib/resend";

-          const { Resend } = await import("resend");
-          const resend = new Resend(process.env.RESEND_API_KEY);
-
-          await resend.emails.send({
-            from: process.env.RESEND_FROM_EMAIL || "info@carmakler.cz",
-            to: broker.email,
-            subject: dailySummarySubject(summaryData),
-            html: dailySummaryHtml(summaryData),
-            text: dailySummaryText(summaryData),
-          });
+          const result = await sendEmail({
+            to: broker.email,
+            subject: dailySummarySubject(summaryData),
+            html: dailySummaryHtml(summaryData),
+            text: dailySummaryText(summaryData),
+          });
+
+          if (!result.success) {
+            console.error(`Daily summary email failed for ${broker.email}`);
+          }
```

### Krok 8: Refaktorovat `app/api/payouts/seller/[id]/process/route.ts` (radky 70-74)

**Zmena:**
```diff
+import { sendEmail } from "@/lib/resend";

-        const { Resend } = await import("resend");
-        const resend = new Resend(process.env.RESEND_API_KEY);
-
-        await resend.emails.send({
-          from: process.env.RESEND_FROM_EMAIL || "info@carmakler.cz",
-          to: vehicle.contactEmail,
-          subject: `Výplata za prodej vozidla | Carmakler`,
-          html: `...`,
-        });
+        await sendEmail({
+          to: vehicle.contactEmail,
+          subject: `Výplata za prodej vozidla | Carmakler`,
+          html: `...`, // existujici HTML zustava
+        });
```

### Krok 9: Refaktorovat `lib/listing-sla.ts` (radky 1-2, 182-217)

**Zmena — hlavicka:**
```diff
 import { prisma } from "@/lib/prisma";
-import { Resend } from "resend";
+import { sendEmail } from "@/lib/resend";
```

**Zmena — sendWatchdogEmail funkce (radky 182-217):**
```diff
-  const apiKey = process.env.RESEND_API_KEY;
-  if (!apiKey) {
-    console.warn("RESEND_API_KEY not set, skipping watchdog email");
-    return;
-  }
-
-  const resend = new Resend(apiKey);
-
   // ... (zachovat sestaveni data objektu na radcich 190-209) ...

-  await resend.emails.send({
-    from: process.env.RESEND_FROM_EMAIL || "info@carmakler.cz",
-    to: recipientEmail,
-    subject: watchdogMatchSubject(data),
-    html: watchdogMatchHtml(data),
-    text: watchdogMatchText(data),
-  });
+  await sendEmail({
+    to: recipientEmail,
+    subject: watchdogMatchSubject(data),
+    html: watchdogMatchHtml(data),
+    text: watchdogMatchText(data),
+  });
```

---

## DNS setup dokumentace

Pro spravne fungovani Resendu je potreba DNS konfigurace domeny `carmakler.cz`.

### Pozadovane DNS zaznamy

Po overeni domeny v Resend dashboardu (https://resend.com/domains) pridat tyto zaznamy:

| Typ | Nazev | Hodnota | Ucel |
|-----|-------|---------|------|
| TXT | `carmakler.cz` | `v=spf1 include:amazonses.com ~all` | SPF — opravneni Resend k odesilani |
| CNAME | `resend._domainkey.carmakler.cz` | `[Resend poskytne]` | DKIM podpis |
| CNAME | `[Resend poskytne]` | `[Resend poskytne]` | DKIM rotace |
| TXT | `_dmarc.carmakler.cz` | `v=DMARC1; p=quarantine; rua=mailto:dmarc@carmakler.cz` | DMARC politika |

**Postup:**
1. V Resend dashboardu pridat domenu `carmakler.cz`
2. Resend zobrazi presne DNS zaznamy k pridani
3. Pridat zaznamy u DNS providera (Vercel DNS, Cloudflare, apod.)
4. Pockat na propagaci (typicky 5-30 minut)
5. V Resend kliknout "Verify" — stav se zmeni na "Verified"

### From adresy ktere budou pouzivany

| From adresa | Ucel |
|-------------|------|
| `info@carmakler.cz` | Vychozi — notifikace, pozvankyz, potvrzeni |
| `smlouvy@carmakler.cz` | Odeslani smluv (contracts) |

Obe adresy MUSI byt z overene domeny. Neni potreba je zvlast registrovat — jakakoliv adresa `@carmakler.cz` funguje po overeni domeny.

---

## Env promenne

`.env.example` (radky 26-28) jiz obsahuje:
```env
RESEND_API_KEY=
RESEND_FROM_EMAIL=info@carmakler.cz
```

**NEMEN .env.example.** Staci vyplnit v `.env.local`:
```env
RESEND_API_KEY=re_xxxxxxxx
RESEND_FROM_EMAIL=info@carmakler.cz
```

---

## Soubory k vytvoreni/uprave

| Soubor | Zmena |
|--------|-------|
| `lib/resend.ts` | NOVY — sdileny modul s `getResend()`, `sendEmail()`, from konstanty |
| `app/api/emails/send/route.ts` | Refaktor na `sendEmail()` (radky 116-147) |
| `app/api/invitations/route.ts` | Refaktor na `sendEmail()` (radky 120-148) |
| `app/api/contracts/[id]/send/route.ts` | Refaktor na `sendEmail()` (radky 89-109) |
| `app/api/payments/[id]/confirm/route.ts` | Refaktor na `sendEmail()` (radky 89-91) |
| `app/api/payments/webhook/route.ts` | Refaktor na `sendEmail()` (radky 88-92) |
| `app/api/cron/daily-summary/route.ts` | Refaktor na `sendEmail()` (radky 244-249) |
| `app/api/payouts/seller/[id]/process/route.ts` | Refaktor na `sendEmail()` (radky 70-74) |
| `lib/listing-sla.ts` | Refaktor na `sendEmail()` (radky 1-2, 182-217) |

**CELKEM:** 1 novy soubor + 8 souboru k refaktoru.

## Co se NEMEN

- HTML sablony v email tele (zachovat existujici)
- Email template system v `lib/email-templates/` (zachovat — pouziva se jen v `emails/send`)
- `.env.example` (promenne uz existuji)
- `package.json` (resend `^6.9.4` uz je v dependencies)

## Overeni

- [ ] `lib/resend.ts` exportuje `getResend()`, `sendEmail()`, `RESEND_FROM`, `RESEND_FROM_CONTRACTS`
- [ ] Vsech 8 souboru pouziva `sendEmail()` z `@/lib/resend` misto primeho `new Resend()`
- [ ] Bez `RESEND_API_KEY` — vsechny email cesty zalogouji warning a pokracuji (NE 500 error)
- [ ] S `RESEND_API_KEY` — emaily se odesilaji
- [ ] Invitation email funguje po zmene
- [ ] Contract send email funguje s `smlouvy@carmakler.cz`
- [ ] Daily summary cron funguje
- [ ] Watchdog match email funguje
- [ ] Zadny soubor neimportuje primo `from "resend"` (krome `lib/resend.ts`)
- [ ] Build prochazi bez TypeScript chyb
- [ ] Unit testy prochazi (zadny existujici test netestuje email)
- [ ] DNS zaznamy pro carmakler.cz jsou overeny v Resend dashboardu (manualni krok)
