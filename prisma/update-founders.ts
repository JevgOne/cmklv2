/**
 * One-time script: Update real team members so they appear on /makleri
 * with correct names, roles (BROKER) and displayed positions (jobTitle).
 *
 * Usage: DATABASE_URL=... npx tsx prisma/update-founders.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Radim Zajíček — Zakladatel & COO (DB role: BROKER)
  const radim = await prisma.user.updateMany({
    where: { email: "radim@wikiporadce.cz" },
    data: {
      firstName: "Radim",
      lastName: "Zajíček",
      role: "BROKER",
      slug: "radim-zajicek",
      jobTitle: "Zakladatel & COO",
      city: "Praha",
      bio: "Zakladatel CarMakléř. Stojí za vizí platformy, která mění způsob prodeje aut v Česku. Řídí provoz a rozvoj makléřské sítě.",
      showPhone: true,
      status: "ACTIVE",
    },
  });
  console.log(`Radim Zajíček: ${radim.count} record(s) updated`);

  // 2. Yevgen Ulyanchenko — Zakladatel, CEO & CTO (DB role: BROKER)
  const yevgen = await prisma.user.updateMany({
    where: { email: "zenuly3@gmail.com" },
    data: {
      firstName: "Yevgen",
      lastName: "Ulyanchenko",
      role: "BROKER",
      slug: "yevgen-ulyanchenko",
      jobTitle: "Zakladatel, CEO & CTO",
      city: "Praha",
      bio: "Zodpovídá za strategii, technologii a vývoj celé platformy. Propojuje byznys s moderními technologiemi.",
      showPhone: true,
      status: "ACTIVE",
    },
  });
  console.log(`Yevgen Ulyanchenko: ${yevgen.count} record(s) updated`);

  // 3. Kateřina Fusslová — Manažer prodeje (DB role: BROKER)
  const katerina = await prisma.user.updateMany({
    where: { email: "Fusslova.k@gmail.com" },
    data: {
      firstName: "Kateřina",
      lastName: "Fusslová",
      role: "BROKER",
      slug: "katerina-fusslova",
      jobTitle: "Manažer prodeje",
      city: "Praha",
      bio: "Koordinuje tým makléřů a stará se o hladký průběh každého prodeje. Zajišťuje spokojenost klientů od prvního kontaktu po předání klíčů.",
      showPhone: true,
      status: "ACTIVE",
    },
  });
  console.log(`Kateřina Fusslová: ${katerina.count} record(s) updated`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
