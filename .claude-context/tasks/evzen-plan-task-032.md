# Evžen review — TASK-032 plán sjednocení profilu

## Doslovné zadání
1. "to nedava smysl musí bejt jednotny styl profilu maklere"
2. "a k tomu po kliknutí na hastag landing page"
3. "tnevim co jsi udělal jakože ale nemužou tam bejt veci 30x"

## Check 1 — jednotný styl
✅ — §2.1 zvolí kanonickou URL `/profil/[slug]`, §2.2 řeší `/makler/[slug]` přes 301 permanentRedirect, §2.3 + §3 přestavba do moderního kartového layoutu (hero card, 6 sekcí, `max-w-6xl`, `shadow-card`). §1.3 explicitně identifikuje 10 designových defektů „starobylosti" a §3.2 F1–F10 je cíleně řeší. Jeden profil, moderní design.

## Check 2 — hashtag landing
✅ — §2.4 a §3.4 potvrzují TagPill v HERO kartě (ne schovaný), linkuje na `/makleri/[slug]` (TASK-054 tag landing). AC8 test: „klik na TagPill → /makleri/[tagslug]". §4.4 bod 15 ověřuje `TagPill.tsx` linkuje na správný tag landing. §8 dependency explicitně vyžaduje TASK-054 mergnutý.

## Check 3 — žádné další duplicity
✅ — §4.3 přepíše všech 6 entry pointů (`sitemap.ts:238`, `signature.ts:13/40`, `BrokerBox.tsx:121`, `makleri/page.tsx:114`, `page.tsx:537`). §4.2 `/makler/[slug]/page.tsx` redukuje na permanentRedirect (324 ř. → ~10 ř.) a `MaklerContactForm.tsx` **explicitně smaže**. §4.4 ověří že zbylých 5 míst (BrokerCard, makleri/[slug], CommentSection, muj-ucet/profil, TagPill) už správně linkuje. Žádná nová stránka — jen přestavba stávající `/profil/[slug]`.

## Check 4 — pravidla Carmakler
✅ — Žádné zkratky v UI (plán používá „Certifikovaný makléř", „Člen od", „Ocenění a odznaky", „Upravit profil", „Kontaktovat"). Nedokončené funkce označeny (F2 cover edit + F10 edit cover/avatar jako „Přijde brzy" placeholder nebo vypuštěno do future TASK dle Q4). Smazání `/makler/[slug]/MaklerContactForm.tsx` je explicitně v §4.2 a §9 C2 pojmenováno „Delete" — ne „možná bychom". 3 commity (C1/C2/C3) = každá změna schvalovaná jednotlivě.

## Verdikt
✅ APPROVED — lead může ptát uživatele na ano/ni
