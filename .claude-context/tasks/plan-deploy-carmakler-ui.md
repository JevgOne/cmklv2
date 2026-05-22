# PLÁN: Deploy Carmakler UI změn na produkci

**Datum:** 2026-05-20
**Priorita:** P0 (hotové změny čekají na deploy)
**Cesta:** Produkce `ssh server` → `/var/www/carmakler`

---

## Co se deployuje

Lokální git změny (ověřené, committnuté na `main`):

1. **Navbar:** "Katalog" → "Nabídka vozidel" (`components/inzerce/Navbar.tsx`)
2. **Footer:** Přidán link "Nabídka vozidel", odstraněn "Reklamační řád" (`components/inzerce/Footer.tsx`, `components/common/FooterBase.tsx`)
3. **Watchdog email input:** Fix viditelnosti — bílý text na bílém pozadí (`components/web/WatchdogEmailForm.tsx`)
4. **Company info:** "CarMakler s.r.o." bez diakritiky (háčky/čárky) (`lib/company-info.ts`)

## Deploy postup

**Reference:** deploy checklist z memory `reference_deploy_checklist.md`

### Krok 1: Ověřit lokální stav

```bash
# Na lokálu — ověřit že změny jsou commitnuté a pushnuté
git status
git log --oneline -5
git push origin main
```

### Krok 2: SSH na server

```bash
ssh server
cd /var/www/carmakler
```

### Krok 3: Deploy sekvence (7 kroků)

```bash
# 1. Pull latest
git pull origin main

# 2. Prisma migrate (pokud jsou nové migrace)
npx prisma migrate deploy

# 3. Prisma generate (KRITICKÉ — často zapomínáno!)
npx prisma generate

# 4. Build
npm run build

# 5. PM2 reload
pm2 reload carmakler

# 6. Verify status
pm2 status

# 7. Check logs
pm2 logs carmakler --lines 20
```

### Krok 4: Smoke test

Po deploy ověřit v prohlížeči:

1. ✅ `carmakler.cz` — navbar zobrazuje "Nabídka vozidel" (ne "Katalog")
2. ✅ Footer — obsahuje "Nabídka vozidel", NEobsahuje "Reklamační řád"
3. ✅ Footer — "CarMakler s.r.o." bez diakritiky
4. ✅ Watchdog formulář — email input je viditelný (správná barva textu)

---

## STOP pravidla

- **STOP-1:** Pokud `git pull` má merge conflicty → STOP, řešit ručně
- **STOP-2:** Pokud `npm run build` failne → STOP, nefixovat na produkci, vrátit se na lokál
- **STOP-3:** Pokud `pm2 logs` ukazuje chyby po reloadu → rollback: `git checkout HEAD~1 && npm run build && pm2 reload carmakler`

## Rizika

- **Nízké:** Pouze frontend/UI změny, žádné API/DB změny
- Build může trvat 2-5 minut na serveru (Next.js)
