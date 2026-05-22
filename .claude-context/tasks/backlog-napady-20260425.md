# Backlog — nápady a úkoly k řešení (2026-04-25)

> Průběžně doplňováno od uživatele. Zpracovat po dokončení TASK-044.

---

## 1. TASK-044: Kariérní systém s hvězdičkami
- 5 úrovní (⭐–⭐⭐⭐⭐⭐), provize 30–60%
- Regionální prahy (Praha/Brno/Ostrava+Plzeň/Menší města)
- Admin přehled výplat + vysvětlivky
- PWA: makléř vidí svůj region a progress
- **Stav: plánovač pracuje na plánu**

## 2. Nová loga — JEN PDF/smlouvy/prezentace
- Logo na webu ✅ HOTOVÉ
- Favicon ✅ HOTOVÉ
- Vyměnit v PDF šablonách (docs/presentations/*.html)
- Vyměnit ve smlouvách
- Logo set: `/Users/zen/Desktop/CarMaker_Logosets/`

## 3. Fonty — rozhodnout
- Nový brand: **Exo 2** (nadpisy) + **Inter** (texty)
- Aktuálně v projektu: **Outfit**
- **ČEKÁ NA ROZHODNUTÍ:** přejít na nové fonty na celém webu, nebo jen logo/PDF?

## 4. Registrace makléře
- Zkontrolovat celý registrační flow
- Opravit co nefunguje

## 5. Průvodce aplikací (onboarding)
- Onboarding flow v PWA pro nové makléře
- Zkontrolovat/implementovat

## 6. Scénář na uvítací video
- Zkontrolovat stav existujících scénářů
- Soubory na Desktop: Scenar-uvitaci-video-makleri-CarMakler.md a další

## 7. Loga na smlouvách
- Smlouvy musí mít nové logo
- Zkontrolovat všechny šablony smluv

## 8. Profil makléře — badge a hvězdičky
- Odstranit současné badge/milníky (Makléř 0% z prodeje atd.)
- Nahradit za hvězdičkový badge (⭐–⭐⭐⭐⭐⭐)
- **Veřejný profil / karta makléře:** jen hvězdičky = kariéra, BEZ cen/procent/obratu
- **Interní systém (admin, PWA makléře):** obrat prodejů v Kč, procenta provize, prahy regionu
- Dva různé pohledy na stejná data

## 9. Profil makléře — redesign Instagram style
- Detail profilu makléře má vypadat více jako Instagram profil
- Moderní, vizuálně atraktivní layout
- Lepší zobrazení i na homepage (karty makléřů)
- Inspirace: Instagram profil — avatar, stats v řadě, grid obsahu

## 10. Reputační systém — moderní, automatický (ŽÁDNÉ formuláře)
- **Trust Score (0-100)** — počítá se automaticky z dat platformy
  - Vstupuje: počet prodejů, rychlost odpovědi, doba prodeje, aktivita
  - Zobrazení: kruhový progress (Apple Watch ring style)
- **ŽÁDNÉ SMS ani formuláře** — vše automaticky, klienta neobtěžovat
- **Activity signals (živé):**
  - "Odpovídá do 5 min" — real-time z dat
  - "Aktivní dnes" — zelená tečka
  - "Prodal 3 auta tento měsíc" — dynamický
- **Auto-badges (earned):**
  - 🔥 Rychlý prodejce (průměr pod 30 dní)
  - 💬 Bleskový kontakt (odpovídá do 10 min)
  - 🏆 Top v regionu (#1 za měsíc)
  - ✅ Ověřený (onboarding + 5+ prodejů)
- Žádné dlouhé recenze — všechno automaticky z dat

## 12. Like/srdíčko na profil makléře
- Jeden klik, žádný formulář
- Počet lajků viditelný na profilu i v kartě
- Soft reputační signál

## 11. Interní chat / support systém s automatickým zachycením problémů
- Makléř nemusí popisovat problém ručně — systém automaticky zachytí kontext
- **Auto-capture:** aktuální stránka/URL, chybová hláška, stav formuláře, screenshot, role uživatele, prohlížeč/zařízení
- **Chat:** makléř jen napíše "nefunguje mi to" a systém přiloží vše potřebné
- Příjemce: BackOffice / admin / support tým
- Inspirace: Intercom/Crisp s vestavěným error reportingem
- Možné řešení: Pusher (už v tech stacku) pro real-time, nebo integrace s existujícím AI asistentem
- **Priorita:** K naplánování

---

*Další nápady doplňovat sem.*
