# Procesy Carmakler — jak to funguje

## Jak funguje Carmakler

### Princip
Carmakler je platforma pro zprostředkování prodeje vozidel přes síť ověřených makléřů. Makléři nabírají vozidla od prodejců, profesionálně je prezentují a zprostředkují prodej. Za úspěšný prodej dostávají provizi.

### Flow prodeje
1. **Kontakt s prodejcem** — makléř osloví prodejce nebo prodejce kontaktuje Carmakler
2. **Prohlídka vozu** — osobní prohlídka, inspekce, focení
3. **Podpis smlouvy** — zprostředkovatelská smlouva s prodejcem
4. **Vytvoření inzerátu** — zadání dat do aplikace, nahrání fotek
5. **Schválení** — backoffice zkontroluje a schválí inzerát
6. **Prezentace** — inzerát je živý na webu Carmakler
7. **Zájemci** — makléř komunikuje se zájemci, organizuje prohlídky
8. **Prodej** — dojednání podmínek, kupní smlouva, předání
9. **Provize** — po úspěšném prodeji je vyplacena provize

---

## Schvalovací proces

### Stavy inzerátu
| Stav | Význam |
|------|--------|
| **DRAFT** | Rozpracovaný, neodeslán ke schválení |
| **PENDING** | Odesláno ke schválení, čeká na backoffice |
| **REJECTED** | Zamítnuto — důvod je v komentáři, makléř musí opravit |
| **ACTIVE** | Schváleno a publikováno na webu |
| **RESERVED** | Vůz je zarezervován pro kupujícího |
| **SOLD** | Prodáno, čeká se na vyplacení provize |
| **ARCHIVED** | Staženo z nabídky (prodejce si to rozmyslel, atd.) |

### Co kontroluje backoffice
- Kvalita fotek (min. počet, ostrost, správné úhly)
- Úplnost údajů (VIN, značka, model, cena, stav, km)
- Reálnost ceny (není příliš vysoká/nízká)
- Popis — profesionální, bez chyb, pravdivý
- Smlouva — podepsaná zprostředkovatelská smlouva

### Zamítnutí
- Makléř dostane notifikaci s důvodem zamítnutí
- Opraví nedostatky a odešle znovu
- Nejčastější důvody: nekvalitní fotky, chybějící údaje, chybí smlouva

---

## Provize

### Struktura provize
- **Standardní**: 3% z prodejní ceny (min. 5 000 Kč)
- **Premium vozy** (nad 500 000 Kč): individuální dohoda (obvykle 2-3%)
- **Bonusy**: za rychlý prodej, za opakované prodeje, za kvalitu

### Výplata provize
1. Vůz se prodá → stav změní na SOLD
2. Backoffice ověří úspěšné dokončení obchodu
3. Provize se schválí → stav APPROVED
4. Výplata na účet makléře → stav PAID
5. Lhůta: do 14 pracovních dní po schválení

### Sledování provizí
- V aplikaci sekce "Provize" — přehled všech provizí a jejich stavů
- Filtry: měsíc, stav (čeká, schváleno, vyplaceno)
- Souhrnné statistiky: celkem za měsíc, průměr za vůz

---

## Eskalace

### Kdy eskalovat
- Prodejce je agresivní nebo podezřelý
- Podezření na podvod (stočený tachometr, falešné dokumenty)
- Kupující je nespokojený a hrozí právním sporem
- Technický problém s aplikací
- Nejasnosti ve smlouvě nebo provizi

### Kam eskalovat
1. **Váš manažer** — první kontakt pro běžné problémy
2. **Regionální ředitel** — závažnější problémy, spory
3. **Backoffice** — technické problémy, schvalování, provize
4. **Právní oddělení** — právní spory, podezření na podvod

---

## Pravidla pro makléře

### Musíte
- Vždy jednat profesionálně a čestně
- Pravdivě informovat o stavu vozu
- Používat oficiální šablony smluv
- Dokumentovat prohlídku v aplikaci
- Fotit podle standardů (min. 15 fotek)
- Dodržovat schvalovací proces

### Nesmíte
- Zatajovat známé vady vozu
- Slibovat prodej v konkrétním termínu
- Přijímat hotovost od kupujících
- Obcházet platformu (přímý prodej bez Carmakler)
- Nabízet vozy bez podepsané smlouvy
- Manipulovat s údaji (km, stav, cena)

---

## Tipy pro úspěšné makléřování

### Budování portfolia
- Nabírejte vozy z populárních segmentů (Škoda, VW, Hyundai)
- Cenové rozmezí 150 000 - 500 000 Kč se prodává nejrychleji
- Diverzifikujte — nemějte 10 stejných aut
- Kvalita > kvantita — raději 5 výborných inzerátů než 20 průměrných

### Komunikace
- Odpovídejte na dotazy zájemců do 1 hodiny (v pracovní době)
- Buďte konkrétní a věcní — žádné vyhýbavé odpovědi
- Nabídněte prohlídku — "Kdy se vám hodí auto vidět?"
- Po prohlídce followup: "Jak se vám auto líbilo? Máte dotazy?"

### Efektivita
- Používejte drafty — rozpracujte inzerát na místě, dokončete doma
- Foťte systematicky — vždy stejný postup = nic nevynecháte
- Využívejte AI asistenta — pro dotazy, generování popisů, rady
- Sledujte své statistiky — co funguje, co ne

## FAQ

**Q: Kolik vozů mohu mít najednou?**
A: Není limit, ale doporučujeme max. 15-20 aktivních inzerátů pro jednoho makléře. Kvalita péče o inzeráty klesá s množstvím.

**Q: Co když se vůz neprodá?**
A: Po 6 týdnech doporučte prodejci snížení ceny. Po 3 měsících zvažte archivaci a osobní konzultaci s prodejcem o dalším postupu.

**Q: Mohu pracovat ve více regionech?**
A: Ano, ale primární region určuje váš manažer. Pro práci v jiném regionu kontaktujte regionálního ředitele.
