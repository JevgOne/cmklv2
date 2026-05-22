# Plan P0-08: Migrace SQLite na PostgreSQL

**Priorita:** P0 (BLOKUJICI pro Batch 3)
**Slozitost:** L
**Zavislosti:** P0-07 (env soubory hotovo v Batch 1)
**Batch:** 2
**Blokuje:** P0-09, P0-10, P1-04, P1-13

---

## Cil

Zmenit databazovy provider z SQLite (better-sqlite3 + Prisma adapter) na PostgreSQL. Odstranit SQLite-specificke zavislosti. Vygenerovat novou baseline migraci. Aktualizovat seed script. Overit ze vsech 40+ modelu funguje s PostgreSQL.

---

## Analyza aktualniho stavu

### 1. Prisma schema: `prisma/schema.prisma` (radky 1-8)

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client"
}

datasource db {
  provider = "sqlite"
}
```

**Problem:** Provider je `sqlite`. Nema `url` — url se predava pres `prisma.config.ts`.

### 2. Prisma config: `prisma.config.ts`

```ts
import path from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  datasource: {
    url: process.env.DATABASE_URL || "file:./dev.db",
  },
  migrations: {
    seed: "npx tsx prisma/seed.ts",
  },
});
```

**Problem:** Defaultni URL je SQLite soubor `file:./dev.db`. Prisma config overriduje datasource URL za runtime.

### 3. Prisma klient: `lib/prisma.ts`

```ts
import { PrismaClient } from ".prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "node:path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const dbPath = path.resolve(process.cwd(), "dev.db");
  const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

**Problem:** Pouziva `PrismaBetterSqlite3` adapter a hardcodovany `dev.db` path. Toto je nejvetsi zmena — cela funkce createPrismaClient musi byt nahrazena.

### 4. Seed script: `prisma/seed.ts` (2730 radku)

```ts
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "node:path";

const dbPath = path.resolve(__dirname, "..", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });
```

**Problem:** Seed taky pouziva SQLite adapter primo. Musi pouzit `DATABASE_URL` z env.

### 5. SQLite zavislosti v `package.json`

```json
"@prisma/adapter-better-sqlite3": "^7.5.0",
"@types/better-sqlite3": "^7.6.13",
"better-sqlite3": "^12.8.0",
```

Tyto 3 balicky je treba ODSTRANIT.

### 6. Existujici migrace

23 migracnich souboru v `prisma/migrations/` — vsechny jsou SQLite SQL. PostgreSQL migrace bude nova baseline.

### 7. .env.example uz obsahuje PostgreSQL URL

```env
DATABASE_URL=postgresql://user:password@localhost:5432/carmakler
```

**Toto je pripraveno** — .env.example uz obsahuje PostgreSQL format (radek 7).

### 8. Schema kompatibilita SQLite vs PostgreSQL

**POZOR — SQLite-specificke omezeni ktere PostgreSQL resi:**
- SQLite nema nativni `DateTime` — Prisma ho mapuje jako text. PostgreSQL pouziva nativni timestamp.
- SQLite nema `@db.Text` — vsechny String sloupce jsou unlimited. V PostgreSQL `String` je `varchar(191)` pokud neni `@db.Text`.
- SQLite nepodporuje `enum` — vsechny statusy jsou `String`. V PostgreSQL muzeme nechat jako String (bez zmeny) nebo budouci migrace na enum.

**DULEZITE:** Aktualn schema NEPOUZIVA zadne SQLite-specificke Prisma featury (`@db.` modifiery). Vsechny sloupce jsou typicky `String`, `Int`, `Float`, `Boolean`, `DateTime`, `Json`. Migrace na PostgreSQL je tedy primocarejsi.

---

## Kroky implementace

### Krok 0: Predpoklady

1. Nainstalovat PostgreSQL lokalne (Homebrew: `brew install postgresql@16`)
2. Vytvorit databazi: `createdb carmakler`
3. Nastavit `.env.local`:
   ```env
   DATABASE_URL=postgresql://localhost:5432/carmakler
   ```

### Krok 1: Aktualizovat `prisma/schema.prisma`

**Zmena datasource (radky 6-8):**
```diff
 datasource db {
-  provider = "sqlite"
+  provider = "postgresql"
+  url      = env("DATABASE_URL")
 }
```

**Zmena generatoru — odstranit output (radky 1-4):**
```diff
 generator client {
   provider = "prisma-client-js"
-  output   = "../node_modules/.prisma/client"
 }
```

**POZOR:** S PostgreSQL se pouziva defaultni output. Custom output `"../node_modules/.prisma/client"` byl potreba pro SQLite adapter pattern. S PostgreSQL staci standardni import `from "@prisma/client"`.

### Krok 2: Aktualizovat `prisma.config.ts`

```diff
 import path from "node:path";
 import { defineConfig } from "prisma/config";

 export default defineConfig({
   schema: path.join(__dirname, "prisma", "schema.prisma"),
-  datasource: {
-    url: process.env.DATABASE_URL || "file:./dev.db",
-  },
   migrations: {
     seed: "npx tsx prisma/seed.ts",
   },
 });
```

**Proc:** Datasource URL se nyni cte z `env("DATABASE_URL")` primo v schema.prisma. Neni potreba runtime override v prisma.config.ts. Pokud env neni nastavene, Prisma vyhodi chybu (coz je spravne chovani).

### Krok 3: Prepsat `lib/prisma.ts`

**Kompletni nahrazeni:**

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

**Co se zmenilo:**
- Odstranen import `PrismaBetterSqlite3` a `path`
- Import z `"@prisma/client"` misto `".prisma/client"`
- Odstranen adapter a dbPath
- Prisma se pripoji primo pres `DATABASE_URL` env var
- Pridan `log` option pro development debugging

### Krok 4: Aktualizovat `prisma/seed.ts` (radky 1-8)

**Zmena hlavicky:**
```diff
-import { PrismaClient } from "@prisma/client";
-import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
-import path from "node:path";
-
-const dbPath = path.resolve(__dirname, "..", "dev.db");
-const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
-const prisma = new PrismaClient({ adapter });
+import { PrismaClient } from "@prisma/client";
+
+const prisma = new PrismaClient();
```

**Zbytek seed.ts (2722 radku) zustava BEZE ZMENY** — vsechny `prisma.xxx.create()`, `prisma.xxx.deleteMany()` volani jsou API-kompatibilni.

### Krok 5: Opravit vsechny importy `from ".prisma/client"`

Zkontrolovat zda nektery soubor importuje z custom output cesty:

**Hledat:** `from ".prisma/client"` nebo `from '.prisma/client'`

Jediny soubor by mel byt `lib/prisma.ts` (opraveno v Kroku 3). Pokud existuji dalsi, zmenit na `from "@prisma/client"`.

### Krok 6: Odstranit SQLite zavislosti z `package.json`

```bash
npm uninstall better-sqlite3 @prisma/adapter-better-sqlite3 @types/better-sqlite3
```

**Toto odstrani z dependencies:**
```diff
-    "@prisma/adapter-better-sqlite3": "^7.5.0",
-    "@types/better-sqlite3": "^7.6.13",
-    "better-sqlite3": "^12.8.0",
```

### Krok 7: Smazat stare SQLite migrace a data

```bash
# Smazat stare SQLite migrace (23 souboru)
rm -rf prisma/migrations/

# Smazat SQLite databazi
rm -f dev.db
```

### Krok 8: Vytvorit novou baseline migraci

```bash
# Generovat novou baseline migraci pro PostgreSQL
npx prisma migrate dev --name init_postgresql
```

**Toto:**
1. Vytvori `prisma/migrations/YYYYMMDDHHMMSS_init_postgresql/migration.sql`
2. SQL bude pouzivat PostgreSQL syntax (`CREATE TABLE`, `TEXT`, `TIMESTAMP(3)`, `SERIAL`, etc.)
3. Spusti migraci na lokalni PostgreSQL databazi
4. Vygeneruje novy Prisma Client

### Krok 9: Spustit seed

```bash
npx prisma db seed
```

Overi ze seed projde bez chyb na PostgreSQL.

### Krok 10: Overit build

```bash
npm run build
```

### Krok 11: Smazat dev.db z .gitignore (pokud je tam)

Zkontrolovat `.gitignore` — `dev.db` by mel zustat v .gitignore (neskodi), ale uz nebude pouzivan.

---

## Presny diff — vsechny soubory

### `prisma/schema.prisma` (radky 1-8)

```diff
 generator client {
   provider = "prisma-client-js"
-  output   = "../node_modules/.prisma/client"
 }

 datasource db {
-  provider = "sqlite"
+  provider = "postgresql"
+  url      = env("DATABASE_URL")
 }
```

### `prisma.config.ts`

```diff
 import path from "node:path";
 import { defineConfig } from "prisma/config";

 export default defineConfig({
   schema: path.join(__dirname, "prisma", "schema.prisma"),
-  datasource: {
-    url: process.env.DATABASE_URL || "file:./dev.db",
-  },
   migrations: {
     seed: "npx tsx prisma/seed.ts",
   },
 });
```

### `lib/prisma.ts` (kompletni nahrazeni)

```diff
-import { PrismaClient } from ".prisma/client";
-import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
-import path from "node:path";
-
-const globalForPrisma = globalThis as unknown as {
-  prisma: PrismaClient | undefined;
-};
-
-function createPrismaClient() {
-  const dbPath = path.resolve(process.cwd(), "dev.db");
-  const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
-  return new PrismaClient({ adapter });
-}
-
-export const prisma = globalForPrisma.prisma ?? createPrismaClient();
-
-if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
+import { PrismaClient } from "@prisma/client";
+
+const globalForPrisma = globalThis as unknown as {
+  prisma: PrismaClient | undefined;
+};
+
+export const prisma =
+  globalForPrisma.prisma ??
+  new PrismaClient({
+    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
+  });
+
+if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

### `prisma/seed.ts` (radky 1-8)

```diff
-import { PrismaClient } from "@prisma/client";
-import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
-import path from "node:path";
-
-const dbPath = path.resolve(__dirname, "..", "dev.db");
-const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
-const prisma = new PrismaClient({ adapter });
+import { PrismaClient } from "@prisma/client";
+
+const prisma = new PrismaClient();
```

### `package.json` (npm uninstall)

```diff
   "dependencies": {
-    "@prisma/adapter-better-sqlite3": "^7.5.0",
     "@prisma/client": "^7.5.0",
     ...
-    "@types/better-sqlite3": "^7.6.13",
     ...
-    "better-sqlite3": "^12.8.0",
     ...
   }
```

---

## SQLite vs PostgreSQL — potencialni problemy

### 1. JSON sloupce

SQLite uklada JSON jako String. PostgreSQL podporuje nativni `Json` typ. Aktualni schema pouziva `String` pro JSON data (napr. `cities`, `equipment`, `highlights` — vsechno `String?` se `JSON.stringify`). Toto funguje i na PostgreSQL bez zmeny.

**Budouci optimalizace (NE ted):** Zmenit `String?` JSON sloupce na `Json?` typ pro PostgreSQL-native querying. Ale to je breaking change — vyzadovalo by upravit vsechny `JSON.stringify()` / `JSON.parse()` volani. Tohle je P2 optimalizace.

### 2. DateTime

SQLite uklada DateTime jako ISO string. PostgreSQL pouziva nativni `timestamp(3)`. Prisma toto resi transparentne — zadna zmena v kodu potreba.

### 3. cuid() IDs

Vsechny modely pouzivaji `@id @default(cuid())`. Toto funguje identicky na PostgreSQL.

### 4. @unique constraints

SQLite i PostgreSQL podporuji @unique. Zadna zmena.

### 5. Compound indexes (@@index)

Existuji desitky `@@index` deklaraci. Vsechny jsou validni PostgreSQL. Zadna zmena.

### 6. Cascade deletes

`onDelete: Cascade` funguje identicky. Zadna zmena.

### 7. AiConversation.messages

```prisma
messages Json // Array of { role, content, timestamp }
```

Toto je jediny `Json` (ne `String`) typ ve schema. PostgreSQL ho podporuje nativne (lepsim zpusobem nez SQLite). Zadna zmena.

---

## Deployment checklist pro produkci

1. **Vercel/Railway:** Nastavit `DATABASE_URL` env var na PostgreSQL connection string
2. **Connection pooling:** Pro serverless (Vercel) pouzit Prisma Accelerate nebo PgBouncer:
   ```env
   DATABASE_URL=postgresql://user:pass@host:5432/carmakler?connection_limit=5
   ```
3. **SSL:** Pro cloud PostgreSQL pridat `?sslmode=require`:
   ```env
   DATABASE_URL=postgresql://user:pass@host:5432/carmakler?sslmode=require
   ```
4. **Migrace na produkci:**
   ```bash
   npx prisma migrate deploy
   ```
5. **Seed na produkci:** NESPOUSTET seed na produkci (seed je jen pro development data)

---

## Soubory k vytvoreni/uprave

| Soubor | Zmena |
|--------|-------|
| `prisma/schema.prisma` | Zmenit provider na `postgresql`, pridat `url = env("DATABASE_URL")`, odstranit custom output |
| `prisma.config.ts` | Odstranit `datasource` override |
| `lib/prisma.ts` | Kompletni prepis — odstranit SQLite adapter, pouzit standardni PrismaClient |
| `prisma/seed.ts` | Radky 1-8 — odstranit SQLite adapter, pouzit standardni PrismaClient |
| `package.json` | Odstranit `better-sqlite3`, `@prisma/adapter-better-sqlite3`, `@types/better-sqlite3` |
| `prisma/migrations/` | Smazat vsechny stare SQLite migrace, vytvorit novou baseline |
| `dev.db` | Smazat (jiz nepotrebny) |

## Poradi kroku (DULEZITE)

1. Aktualizovat schema.prisma (provider + url)
2. Aktualizovat prisma.config.ts (odstranit datasource override)
3. Prepsat lib/prisma.ts
4. Aktualizovat seed.ts hlavicku
5. `npm uninstall better-sqlite3 @prisma/adapter-better-sqlite3 @types/better-sqlite3`
6. `rm -rf prisma/migrations/ dev.db`
7. `npx prisma migrate dev --name init_postgresql`
8. `npx prisma db seed`
9. `npm run build`
10. Spustit unit testy: `npm run test:run`

## Overeni

- [ ] `npx prisma migrate dev` projde bez chyb
- [ ] `npx prisma db seed` projde (vsech 2730 radku seed dat)
- [ ] `npm run build` projde
- [ ] `npm run test:run` projde (15 existujicich testu)
- [ ] `npm run dev` — aplikace se spusti a pripoji k PostgreSQL
- [ ] Prisma Studio (`npx prisma studio`) ukazuje data
- [ ] `better-sqlite3` a `@prisma/adapter-better-sqlite3` NEJSOU v `package.json`
- [ ] `dev.db` neexistuje
- [ ] Import v `lib/prisma.ts` je z `"@prisma/client"` (ne `".prisma/client"`)
- [ ] Vsechny stare SQLite migrace jsou smazany
- [ ] Nova baseline migrace `init_postgresql` existuje
- [ ] `.env.local` obsahuje validni PostgreSQL connection string
