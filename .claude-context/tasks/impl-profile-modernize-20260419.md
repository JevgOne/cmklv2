# Implementace: Profil modernizace — badges removal + milníky + kontakt

**Datum:** 2026-04-19
**Stav:** IN PROGRESS (implementátor pracuje)
**Commit:** čeká

---

## Úkoly

### 1. Odstranit gamifikační badges sekci
- Smazat celou "Odznaky" sekci z ProfileClient.tsx
- Smazat BADGE_CATALOG a related imports pokud nejsou jinde použité
- Ponechat ověřovací badges (Ověřená identita, Ověřený telefon, Ověřený e-mail)

### 2. Modernizovat Milníky
- Aktuální stav: nudný vertikální seznam s kroužky, zabírá moc místa
- Cíl: horizontální roadmap/progress styl
- Dosažené milníky: oranžové, výrazné, s ikonkou
- Nedosažené: šedé, vybledlé
- Kompaktnější — méně výšky

### 3. Modernizovat Kontakt
- Aktuální stav: prázdná karta s telefonem + 3 malé šedé social ikony
- Cíl: kompaktní layout — telefon + email jako pills, social ikony větší s brand-color bg
- Nebo integrovat do hero karty místo separátní sekce dole

### Obecný směr
- Méně separátních karet, víc integrovaný look
- Méně nadpisů, víc vizuální flow
- Moderní, IG-style estetika

---

## Deploy
- Commit + push + `ssh server "cd /var/www/carmakler && git pull && npm run build && pm2 reload all"`
