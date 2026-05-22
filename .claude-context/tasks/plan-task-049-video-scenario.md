# Plán: TASK-049 — Scénáře uvítacích videí — inventář a stav

**Datum:** 2026-04-25
**Autor:** Plánovač
**Typ:** Audit stavu

---

## Celkový stav

Existuje **kompletní sada scénářů pro 4 cílové skupiny**. Scénáře jsou finalizované produkční briefy — obsahují detailní časování, voiceover texty, technické specifikace pro natáčení. **Žádná videa zatím nebyla natočena** — existují pouze skripty.

---

## Inventář souborů

### Desktop (`/Users/zen/Desktop/`)

| Soubor | Cílovka | Délka | Velikost |
|--------|---------|-------|----------|
| `Scenar-uvitaci-video-makleri-CarMakler.md` | Makléři | 4:30 | 8.2 KB |
| `Scenar-uvitaci-video-vrakoviste.md` | Dodavatelé dílů | 5:05 | 12 KB |
| `Scenar-uvitaci-video-inzerce.md` | Prodejci aut (inzerce) | 4:25 | 9.9 KB |
| `Scenar-uvitaci-video-marketplace.md` | Investoři + dealeři (VIP) | 5:25 | 13 KB |

### Projekt (`.claude-context/tasks/`)

| Soubor | Varianta | Poznámka |
|--------|----------|----------|
| `scenario-welcome-video-makler.md` | Makléři v1 | Téměř identický s Desktop verzí |
| `scenar-uvitaci-video-makleri.md` | Makléři v2 | Rozšířená verze — 4:35, více detailů o AI asistentovi a gamifikaci |
| `scenar-uvitaci-video-dodavatele-dilu.md` | Dodavatelé dílů | Téměř identický s Desktop verzí |
| `scenar-uvitaci-video-inzerce.md` | Inzerce | Téměř identický s Desktop verzí |
| `scenar-uvitaci-video-marketplace-vip.md` | Marketplace VIP | Téměř identický s Desktop verzí |
| `scenario-welcome-video-vrakoviste.md` | Vrakoviště | Varianta dodavatelského videa |
| `scenario-welcome-video-marketplace.md` | Marketplace | Varianta investorského videa |
| `scenario-welcome-video-inzerce.md` | Inzerce | Varianta prodejcovského videa |

**Duplicity:** V projektu existují 2 verze pro každou cílovku — `scenar-*` (český název) a `scenario-*` (anglický prefix). Obsah je téměř totožný.

---

## Pokrytí cílových skupin

| # | Cílovka | Scénář existuje | Video natočeno |
|---|---------|-----------------|----------------|
| 1 | Makléři (BROKER) | ✅ Ano (2 verze) | ❌ Ne |
| 2 | Dodavatelé dílů (PARTS_SUPPLIER) | ✅ Ano (2 verze) | ❌ Ne |
| 3 | Prodejci aut — inzerce (ADVERTISER) | ✅ Ano (2 verze) | ❌ Ne |
| 4 | Investoři + dealeři — marketplace (INVESTOR/VERIFIED_DEALER) | ✅ Ano (2 verze) | ❌ Ne |
| 5 | Kupující (BUYER) | ❌ Chybí | ❌ Ne |
| 6 | Partneři (PARTNER) | ❌ Chybí | ❌ Ne |

---

## Shrnutí obsahu scénářů

### 1. Makléři (4:30–4:35)
- **Formát:** Screencast PWA + voiceover + face-to-camera intro
- **Obsah:** Jak funguje Carmakler, přehled PWA, 7-krokový wizard nabírání aut, digitální smlouvy + podpis, provize (5%, min 25K Kč)
- **Verze 2 navíc:** AI asistent, gamifikace (leaderboard), rychlé akce
- **Screenshoty:** ~14 z broker dashboardu a nabíracího flow

### 2. Dodavatelé dílů (5:05)
- **Formát:** Screencast PWA + voiceover + face-to-camera
- **Obsah:** Jak funguje marketplace dílů, 3-krokový onboarding, PWA instalace, přidávání dílů (3 kroky), CSV import pro velké sklady, správa objednávek, Stripe výplaty
- **Klíčová zpráva:** Nástroj zdarma, provize jen z prodaných dílů, automatické výplaty
- **Screenshoty:** ~16 z supplier dashboardu

### 3. Inzerce — prodejci (4:25)
- **Formát:** Screencast web + voiceover + face-to-camera
- **Obsah:** Proč Carmakler (zdarma, VIN dekodér), 6-krokový wizard podání inzerátu, registrace, dashboard s dotazy, TOP propagace
- **Klíčová zpráva:** Základní inzerce zdarma (1 inzerát 60 dní soukromí, 10 bazary)
- **Screenshoty:** ~14 z inzertního flow

### 4. Marketplace VIP (5:25)
- **Formát:** Screencast web + voiceover + face-to-camera
- **Obsah:** Co je car flipping, 4-krokový flow, bezpečnost (4 vrstvy), sekce pro investory (portfolio, prohlížení, investice), sekce pro dealery (wizard: auto, opravy, prodejní odhad), timeline (30-90 dní), FAQ
- **Klíčová zpráva:** 40/40/20 dělení zisku, 14-25% ROI, garantovaný odkup po 120 dnech (max -10%)
- **Screenshoty:** ~16 z marketplace dashboardů

---

## Produkční specifikace (společné)

| Parametr | Hodnota |
|----------|---------|
| Formát | 90% screencast + 10% face-to-camera/animace |
| Jazyk | Čeština |
| Tempo voiceoveru | 135-140 slov/min |
| Hudba | Ambient/lo-fi (-18 dB), bez dramatických přechodů |
| Délka | 4:25 – 5:25 |
| Počet slov | 620 – 780 na video |
| Screenshoty potřeba | 14-16 na video |

---

## Co je potřeba zkontrolovat/aktualizovat

### A. Aktuálnost obsahu vs. stav platformy

| Téma ve scénáři | Aktuální stav | Potřeba aktualizace? |
|-----------------|---------------|---------------------|
| Provize 5%, min 25K Kč | ✅ Stále platí (`lib/commission-calculator.ts`) | Ne |
| 4 kariérní úrovně (Tipař/Junior/Senior/Expert) | ⚠️ Probíhá přepis na hvězdičky (TASK-044) | **ANO** — po dokončení TASK-044 |
| AI asistent v PWA | ✅ Existuje (`/api/assistant/chat`) | Ne |
| VIN dekodér | ✅ Existuje (`vindecoder.eu` + NHTSA) | Ne |
| Offline PWA | ✅ Existuje (Service Worker + IndexedDB) | Ne |
| CSV import dílů | ✅ Existuje | Ne |
| Stripe výplaty | ✅ Existuje | Ne |
| Marketplace 40/40/20 split | ✅ Platí | Ne |
| Gamifikace/leaderboard | ⚠️ Mění se systém (TASK-044) | **ANO** — po dokončení TASK-044 |
| Registrace zdarma (inzerce) | ✅ Platí | Ne |

### B. Chybějící scénáře

1. **Kupující (BUYER)** — uživatel, který hledá auto. Zatím nemá uvítací video.
2. **Partneři (PARTNER)** — autobazary s partnerským programem. Zatím nemá uvítací video.

### C. Duplicity v souborech

V projektu existují 2 kopie téměř každého scénáře (s českým a anglickým prefixem). Doporučení: ponechat jednu kanonickou verzi, druhou smazat nebo označit jako archiv.

---

## Doporučení

1. **Počkat na dokončení TASK-044** (kariérní systém s hvězdičkami) než se natáčejí videa pro makléře — scénáře zmiňují kariérní úrovně
2. **Aktualizovat makléřský scénář** po TASK-044: nahradit zmínky o "body" a "úrovně" za "hvězdičky" a "celkový obrat"
3. **Vyčistit duplicity** — ponechat `scenar-*` verze jako kanonické, `scenario-*` označit jako starší draft
4. **Zvážit scénář pro kupující** — jednoduchý (2-3 min) průvodce hledáním auta na platformě
5. **Screenshoty natočit až po vizuálních změnách** (TASK-046 profil redesign, TASK-044 hvězdičky) — jinak budou zastaralé

## Celkové hodnocení

Scénáře jsou **kompletní a kvalitní produkční briefy** pro 4 ze 6 cílových skupin. Obsahují detailní časování, voiceover texty, technické specifikace. Hlavní bloker pro natáčení je dokončení vizuálních změn (TASK-044, TASK-046), po kterých bude potřeba aktualizovat screenshoty a zmínky o kariérním systému.
