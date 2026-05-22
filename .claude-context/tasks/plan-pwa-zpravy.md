# Plan: ZPRÁVY v PWA aplikaci

**Task:** #7
**Status:** PLAN READY
**Datum:** 2026-05-22
**Typ:** Enhancement (dokončení existující funkce)
**Závažnost:** MEDIUM

---

## 1. Aktuální stav

### Co UŽ EXISTUJE (funkční):

| Soubor | Funkce | Stav |
|--------|--------|------|
| `app/(pwa)/makler/messages/page.tsx` | Seznam vozů s dotazy (seskupené) | ✅ Funkční |
| `app/(pwa)/makler/messages/[vehicleId]/page.tsx` | Detail dotazů k vozu | ✅ Funkční |
| `components/pwa/messages/InquiryActions.tsx` | Odpovědět, Zavolat, Prohlídka, Bez zájmu | ✅ Funkční |
| `components/pwa/messages/InquiryCard.tsx` | Karta dotazu (nepoužívá se?) | ✅ Existuje |
| `components/pwa/BottomNav.tsx` | Zprávy tab s badge | ✅ Existuje |
| `app/api/vehicles/[id]/inquiries/route.ts` | GET + POST inquiries | ✅ Funkční |
| `app/api/vehicles/[id]/inquiries/[inquiryId]/route.ts` | PUT update inquiry | ✅ Funkční |
| `prisma/schema.prisma` → VehicleInquiry model | DB model | ✅ Existuje |

### Co CHYBÍ / NEFUNGUJE:

#### A: Odpověď se NEPOSÍLÁ kupujícímu (CRITICAL)
`InquiryActions.handleReply()` volá PUT `/api/vehicles/[id]/inquiries/[id]` s `{ reply, status: "REPLIED" }`. API uloží reply do DB ale **nikam ji neposílá** — kupující se nikdy nedozví, že dostal odpověď.

**Požadavek:** Při reply poslat email kupujícímu přes Resend.

#### B: Badge počítá notifikace, ne nepřečtené zprávy
`BottomNav` (ř. 121-133) fetchuje `/api/broker/notifications` → `unreadCount`. To počítá OBECNÉ notifikace, ne nové dotazy. Zprávy badge by měl ukazovat počet NEW inquiries.

#### C: Chybí kontaktní formulář zprávy
Kontaktní formulář na `/kontakt` posílá zprávy přes `/api/contact`, ale tyto zprávy se nikde v PWA nezobrazí. Makléř nevidí zprávy z kontaktního formuláře (pokud mu jsou směrovány).

#### D: Žádný real-time update
Pusher je v tech stacku ale messages page nemá real-time subscribe. Nový dotaz se neobjeví bez page refresh.

---

## 2. Implementační plán

### Krok 1: Email reply kupujícímu (CRITICAL — A)

**Soubor:** `app/api/vehicles/[id]/inquiries/[inquiryId]/route.ts`

Po úspěšném update s reply, poslat email:

```tsx
// Po řádku 102 (po prisma update):
if (data.reply && inquiry.buyerEmail) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    select: { brand: true, model: true, variant: true },
  });
  const vehicleName = `${vehicle?.brand} ${vehicle?.model}${vehicle?.variant ? ` ${vehicle.variant}` : ""}`;
  
  await sendEmail({
    to: inquiry.buyerEmail,
    subject: `Odpověď na dotaz: ${vehicleName} — CarMakléř`,
    template: "inquiry-reply",
    data: {
      buyerName: inquiry.buyerName,
      vehicleName,
      reply: data.reply,
      brokerName: session.user.name,
    },
  });
}
```

**Nový email template:** `emails/inquiry-reply.tsx` (React Email)

**Obsah emailu:**
- "Dobrý den [buyerName],"
- "Makléř [brokerName] odpověděl na váš dotaz k vozidlu [vehicleName]:"
- [reply text]
- CTA: "Zobrazit vozidlo" → link na nabídku
- Footer: CarMakléř branding

**Závislosti:** `lib/email.ts` / Resend (už v projektu).

### Krok 2: Opravit badge na Zprávy (B)

**Možnost A (jednoduchá):** Přidat API endpoint `/api/broker/unread-inquiries` který vrací count NEW inquiries pro aktuálního brokera:

```tsx
// app/api/broker/unread-inquiries/route.ts
const count = await prisma.vehicleInquiry.count({
  where: {
    brokerId: session.user.id,
    status: "NEW",
  },
});
return NextResponse.json({ count });
```

**BottomNav change:** Fetchovat z `/api/broker/unread-inquiries` místo `/api/broker/notifications`, NEBO fetchovat oba a sečíst.

**Doporučení:** Badge na Zprávy = unread inquiries. Notifikace badge (pokud existuje) zvlášť.

**Soubory:**
- `app/api/broker/unread-inquiries/route.ts` (NEW)
- `components/pwa/BottomNav.tsx` (EDIT — změnit fetch endpoint)

### Krok 3 (OPTIONAL): Real-time notifikace (D)

Pusher subscribe na kanálu `broker-{userId}` pro event `new-inquiry`:

**Soubor:** `app/(pwa)/makler/messages/page.tsx` → přidat client wrapper:

```tsx
// components/pwa/messages/MessagesRealtime.tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { pusherClient } from "@/lib/pusher-client";

export function MessagesRealtime({ userId }: { userId: string }) {
  const router = useRouter();
  useEffect(() => {
    const channel = pusherClient.subscribe(`private-broker-${userId}`);
    channel.bind("new-inquiry", () => router.refresh());
    return () => { channel.unbind_all(); channel.unsubscribe(); };
  }, [userId, router]);
  return null;
}
```

**Trigger:** V POST `/api/vehicles/[id]/inquiries/route.ts` (ř. 109-128) — po vytvoření inquiry triggerovat Pusher event.

**Závislost:** `lib/pusher-client.ts` a `lib/pusher.ts` musí existovat (ověřit).

### Krok 4 (OPTIONAL): Kontaktní formulář zprávy (C)

Toto je větší změna — kontaktní formulář jde přes jiný model. Pro MVP stačí, že makléř vidí inquiry z vozidel. Kontaktní zprávy řeší admin panel.

**Skip pro nyní.**

---

## 3. Seznam souborů k úpravě

### Krok 1 (MUST):

| Soubor | Typ | Detail |
|--------|-----|--------|
| `app/api/vehicles/[id]/inquiries/[inquiryId]/route.ts` | EDIT | Přidat email reply po PUT |
| `emails/inquiry-reply.tsx` | NEW | React Email template pro odpověď |

### Krok 2 (SHOULD):

| Soubor | Typ | Detail |
|--------|-----|--------|
| `app/api/broker/unread-inquiries/route.ts` | NEW | API endpoint pro count NEW inquiries |
| `components/pwa/BottomNav.tsx` | EDIT | Změnit fetch na unread-inquiries |

### Krok 3 (NICE-TO-HAVE):

| Soubor | Typ | Detail |
|--------|-----|--------|
| `components/pwa/messages/MessagesRealtime.tsx` | NEW | Pusher subscribe |
| `app/(pwa)/makler/messages/page.tsx` | EDIT | Přidat MessagesRealtime |
| `app/api/vehicles/[id]/inquiries/route.ts` | EDIT | Pusher trigger v POST |

---

## 4. Priorita

1. **Krok 1** — MUST (email reply — bez toho je odpovídání k ničemu)
2. **Krok 2** — SHOULD (badge ukazuje správný count)
3. **Krok 3** — NICE-TO-HAVE (real-time je luxury, page refresh funguje)

---

## 5. STOP pravidla

- **STOP-1:** Ověřit že Resend je nakonfigurovaný a `lib/email.ts` existuje — pokud ne, nejprve nastavit
- **STOP-2:** Email template musí být konzistentní s ostatními emaily v projektu (`emails/` složka)
- **STOP-3:** Ověřit že `buyerEmail` existuje na VehicleInquiry — pokud ne, email se nepošle (graceful skip)
- **STOP-4:** Pusher lib (krok 3) — ověřit existenci `lib/pusher-client.ts` před implementací
- **STOP-5:** Nepřepisovat logiku BottomNav badge — pouze změnit endpoint

---

## 6. Závislosti k ověření

Před implementací ověřit existenci:

```
lib/email.ts nebo lib/resend.ts   → email sending utility
emails/                            → email templates folder
lib/pusher.ts                      → Pusher server-side
lib/pusher-client.ts               → Pusher client-side
```

---

## 7. Acceptance Criteria

### Krok 1:
- [ ] Makléř odpovídá na dotaz v PWA → kupující dostane email s odpovědí
- [ ] Email obsahuje: jméno kupujícího, název vozu, text odpovědi, link na vozidlo
- [ ] Pokud kupující nemá email (`buyerEmail` null), email se nepošle (bez erroru)
- [ ] Email template je konzistentní s designem ostatních emailů

### Krok 2:
- [ ] Badge na Zprávy v BottomNav ukazuje počet NEW inquiries (ne notifikací)
- [ ] Počet se aktualizuje po odpovědění na dotaz (refresh)
- [ ] Badge zmizí když nejsou žádné NEW inquiries

### Krok 3:
- [ ] Nový dotaz se objeví na messages stránce bez page refresh
- [ ] Badge count se aktualizuje v reálném čase
