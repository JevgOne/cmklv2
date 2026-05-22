# Evžen THE KING — Verdikt: /sluzby/vykup + /prezentace

**Datum:** 2026-04-19  
**Kontrolor:** Evžen THE KING  
**Podklady:** TASK-QUEUE.md (TASK-010 ř.668-688, TASK-031 ř.4147-4162), plan-audit-fixes-20260419.md, qa-audit-fixes-20260419.md, qa-recheck-prezentace-20260419.md

---

## POLOŽKA 1: /sluzby/vykup — SCHVÁLENO

### Původní zadání (TASK-010, ř.668-688):
- Hero: "Vykoupíme vaše auto za hotové" / "Peníze na účtu do 24 hodin"
- Kroky: Pošlete info o voze → Nabídneme cenu → Vyplatíme do 24h
- Benefity: Férová cena, Platba ihned, Bez skrytých poplatků, Přepis na počkání
- CTA: Formulář (značka, model, rok, km, tel)
- FAQ (2-3 otázky)

### Kontrola shody:

| Požadavek | Shoda | Poznámka |
|---|---|---|
| Hero nadpis + podnadpis | ✅ | Přesně dle spec |
| 3 kroky "Jak to funguje" | ✅ | Přesně dle spec (📋→💵→✅) |
| 4 benefity | ✅ | Všechny 4 ze spec přítomny |
| Formulář (značka, model, rok, km, tel) | ✅ | Všech 5 polí dle spec |
| FAQ | ✅ | 4 otázky (spec říká 2-3, nadlimitní = OK) |
| Shared ServicePage šablona | ✅ | Reusable pattern, konzistentní s ostatními |
| Metadata + breadcrumbs | ✅ | Správné |

**BONUS (nad rámec spec):** Formulář skutečně odesílá na `/api/contact` — spec říkal "vizuální, neodesílá". Pozitivní odchylka.

### Verdikt: ✅ SCHVÁLENO — 100% shoda s doslovným zadáním

---

## POLOŽKA 2: /prezentace — VRÁCENO K PŘEPRACOVÁNÍ

### Původní zadání (TASK-031 sekce 6, ř.4147-4162):
Fullscreen pitch deck, 8 sekcí (100vh), scroll snap, Framer Motion, ?manager=slug, tečkový indikátor, BEZ navbar/footer, robots noindex.

### Kontrola shody — sekce po sekci:

| Sekce | Požadavek (spec) | Shoda | Nález |
|---|---|---|---|
| 1. Kdo jsme | Logo + "síť **certifikovaných** automakléřů" + čísla | ⚠️ | Text říká "**ověřených**" místo "**certifikovaných**" |
| 2. Jak to funguje | 3 kroky s ikonkami (nabírání→inzerce→prodej) | ✅ | Přesně dle spec |
| 3. Pro autobazary | Benefity (leads, viditelnost, badge, bez nákladů, provize) | ✅ | Obsahuje 6 bodů (spec 5 + bonus financování) |
| 4. Pro vrakoviště | Benefity (online prodej, objednávky, platby) | ✅ | Obsahuje 6 bodů (spec 3 + rozšíření) |
| 5. Provizní model | Bazary (kupující platí) + vrakoviště (15%/85%) | ✅ | Přesně dle spec |
| 6. Naši partneři | **Mapa partnerů s piny** + čísla | ❌ | **MAPA CHYBÍ** — jen statistiky, žádná vizualizace mapy ČR |
| 7. Další kroky | 3 kroky (smlouva→profil→online) | ✅ | Přesně dle spec |
| 8. Kontakt | Manager z ?manager=slug + tel + email + **QR kód** | ❌ | **QR KÓD CHYBÍ** — nahrazeno CTA tlačítkem |

### Kontrola dalších požadavků:

| Požadavek | Shoda | Poznámka |
|---|---|---|
| Fullscreen BEZ navbar/footer | ✅ | Route `app/prezentace/` mimo `(web)`, čistý layout |
| 8 sekcí, každá 100vh | ✅ | `min-h-screen snap-start` × 8 |
| Scroll snap | ✅ | `snap-y snap-mandatory` na kontejneru |
| Framer Motion animace | ✅ | `motion.div`, `useInView`, `whileHover` |
| ?manager=slug fetch kontaktu | ✅ | Fetchuje z `/api/profile/[slug]`, zobrazí jméno+tel+email |
| Tečkový indikátor | ✅ | `DotNav` s aktivní sekcí (oranžová) |
| robots noindex | ✅ | `robots: { index: false, follow: false }` v layout.tsx |
| Design (orange + bílá + gray-900) | ✅ | Střídající se pozadí sekcí |

---

### KONKRÉTNÍ NEDOSTATKY (3 body):

**[E-1] ❌ Sekce 6 "Naši partneři" — chybí mapa**
- **Spec doslova říká:** "mapa partnerů s piny + čísla"
- **Implementace:** Jen grid se statistikami (50+ Autobazarů, 20+ Vrakovišť, 14 Krajů...), žádná mapa
- **Plán říkal:** "Mapa ČR s piny partnerů (statická SVG mapa nebo jednoduché vizuální zobrazení)"
- **QA tento bod NEIDENTIFIKOVALA** — nebyl ani ve findings, proto nebyl opraven
- **Doporučení:** Přidat alespoň statickou SVG mapu ČR s piny v krajích nebo jednoduché vizuální zobrazení

**[E-2] ❌ Sekce 8 "Kontakt" — chybí QR kód**
- **Spec doslova říká:** "QR kód (odkaz na registraci/kontakt)"
- **Plán říkal:** "QR kód — STOP-2: pokud nelze nainstalovat, fallback statický text 'Naskenujte QR kód' s odkazem"
- **Implementace:** CTA tlačítko "Registrovat se jako partner →" — funkčně podobné, ale NE QR kód a NE fallback text ze STOP-2
- **QA identifikovala** (NÁLEZ-2) ale akceptovala CTA jako opravu — Evžen nesouhlasí: spec říká QR kód, CTA tlačítko je jiný UI element
- **Doporučení:** Přidat `qrcode.react` QR kód s odkazem na `/kontakt`, nebo alespoň STOP-2 fallback text

**[E-3] ⚠️ Sekce 1 "Kdo jsme" — odlišná formulace**
- **Spec:** "Jsme síť **certifikovaných** automakléřů"
- **Implementace:** "Síť **ověřených** automakléřů"
- **Hodnocení:** Minor, ale "certifikovaných" je záměrné branding slovo
- **Doporučení:** Změnit "ověřených" na "certifikovaných"

---

## CELKOVÝ VERDIKT

| Položka | Verdikt |
|---|---|
| /sluzby/vykup | ✅ **SCHVÁLENO** |
| /prezentace | ❌ **VRÁCENO K PŘEPRACOVÁNÍ** — 2 chybějící prvky (mapa, QR kód) + 1 minor wording |

**Poznámka:** Prezentace je funkční a použitelná, 6 z 8 sekcí je v 100% shodě se spec. Chybějící mapa (E-1) a QR kód (E-2) jsou ale doslovné požadavky z TASK-031 které nebyly splněny. E-3 je drobnost opravitelná za sekundy.

---

*Evžen THE KING, 2026-04-19*
