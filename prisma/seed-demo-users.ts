/**
 * Seed demo users for testing all roles.
 *
 * Run: npx tsx prisma/seed-demo-users.ts
 * Prod: ssh server "cd /var/www/carmakler && node --import tsx/esm prisma/seed-demo-users.ts"
 *
 * Idempotent — upserts only, never deletes existing accounts.
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL || "postgresql://zen@localhost:5432/carmakler";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const PASSWORD_HASH = bcrypt.hashSync("Demo123!", 10);
const NOW = new Date();

interface DemoUser {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  companyName?: string;
  ico?: string;
  city?: string;
  slug?: string;
}

const DEMO_USERS: DemoUser[] = [
  // Regional Directors
  {
    email: "rd.praha@carmakler.cz",
    firstName: "Tomáš",
    lastName: "Dvořák",
    role: "REGIONAL_DIRECTOR",
    phone: "+420 601 111 001",
    city: "Praha",
    slug: "tomas-dvorak",
  },
  {
    email: "rd.brno@carmakler.cz",
    firstName: "Jana",
    lastName: "Králová",
    role: "REGIONAL_DIRECTOR",
    phone: "+420 601 111 002",
    city: "Brno",
    slug: "jana-kralova",
  },
  // Brokers
  {
    email: "makler1@carmakler.cz",
    firstName: "Petr",
    lastName: "Makléř",
    role: "BROKER",
    phone: "+420 602 222 001",
    city: "Praha",
    slug: "petr-makler",
  },
  {
    email: "makler2@carmakler.cz",
    firstName: "Eva",
    lastName: "Makléřová",
    role: "BROKER",
    phone: "+420 602 222 002",
    city: "Brno",
    slug: "eva-maklerova",
  },
  // Advertisers
  {
    email: "inzerent1@carmakler.cz",
    firstName: "Filip",
    lastName: "Inzerent",
    role: "ADVERTISER",
    phone: "+420 603 333 001",
    city: "Praha",
    slug: "filip-inzerent",
  },
  {
    email: "inzerent2@carmakler.cz",
    firstName: "Lucie",
    lastName: "Inzerentová",
    role: "ADVERTISER",
    phone: "+420 603 333 002",
    city: "Ostrava",
    slug: "lucie-inzerentova",
  },
  // Buyers
  {
    email: "kupujici1@carmakler.cz",
    firstName: "David",
    lastName: "Kupující",
    role: "BUYER",
    phone: "+420 604 444 001",
    city: "Praha",
  },
  {
    email: "kupujici2@carmakler.cz",
    firstName: "Anna",
    lastName: "Kupující",
    role: "BUYER",
    phone: "+420 604 444 002",
    city: "Brno",
  },
  // Investors
  {
    email: "investor1@carmakler.cz",
    firstName: "Richard",
    lastName: "Investor",
    role: "INVESTOR",
    phone: "+420 605 555 001",
    city: "Praha",
    companyName: "RI Investments s.r.o.",
    ico: "12345678",
  },
  {
    email: "investor2@carmakler.cz",
    firstName: "Monika",
    lastName: "Investorová",
    role: "INVESTOR",
    phone: "+420 605 555 002",
    city: "Brno",
    companyName: "MI Capital s.r.o.",
    ico: "87654321",
  },
  // Verified Dealers
  {
    email: "dealer1@carmakler.cz",
    firstName: "AutoMax",
    lastName: "s.r.o.",
    role: "VERIFIED_DEALER",
    phone: "+420 606 666 001",
    city: "Praha",
    companyName: "AutoMax Praha s.r.o.",
    ico: "11223344",
    slug: "automax-praha",
  },
  {
    email: "dealer2@carmakler.cz",
    firstName: "CarPro",
    lastName: "s.r.o.",
    role: "VERIFIED_DEALER",
    phone: "+420 606 666 002",
    city: "Plzeň",
    companyName: "CarPro s.r.o.",
    ico: "55667788",
    slug: "carpro-plzen",
  },
  // Parts Suppliers
  {
    email: "dodavatel1@carmakler.cz",
    firstName: "VrakoParts",
    lastName: "s.r.o.",
    role: "PARTS_SUPPLIER",
    phone: "+420 607 777 001",
    city: "Praha",
    companyName: "VrakoParts s.r.o.",
    ico: "99887766",
    slug: "vrakoparts",
  },
  {
    email: "dodavatel2@carmakler.cz",
    firstName: "AutoDíly Plus",
    lastName: "s.r.o.",
    role: "PARTS_SUPPLIER",
    phone: "+420 607 777 002",
    city: "Liberec",
    companyName: "AutoDíly Plus s.r.o.",
    ico: "66778899",
    slug: "autodily-plus",
  },
];

async function main() {
  console.log("Seeding demo users...\n");

  // 1. Find existing MANAGER (Kateřina) for hierarchy
  const manager = await prisma.user.findFirst({
    where: { role: "MANAGER", status: "ACTIVE" },
    select: { id: true, firstName: true, lastName: true },
  });

  if (!manager) {
    console.warn("WARNING: No active MANAGER found. Hierarchy will be incomplete.");
  } else {
    console.log(`Found manager: ${manager.firstName} ${manager.lastName} (${manager.id})`);
  }

  // 2. Upsert all demo users
  const userMap = new Map<string, string>(); // email → id

  for (const u of DEMO_USERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        status: "ACTIVE",
        phone: u.phone ?? null,
        companyName: u.companyName ?? null,
        ico: u.ico ?? null,
        city: u.city ?? null,
        emailVerified: NOW,
      },
      create: {
        email: u.email,
        passwordHash: PASSWORD_HASH,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        status: "ACTIVE",
        phone: u.phone ?? null,
        companyName: u.companyName ?? null,
        ico: u.ico ?? null,
        city: u.city ?? null,
        slug: u.slug ?? null,
        emailVerified: NOW,
        onboardingCompleted: true,
        onboardingStep: 5,
        hasSeenTour: true,
      },
    });

    userMap.set(u.email, user.id);
    console.log(`  ${u.role.padEnd(20)} ${u.email.padEnd(35)} → ${user.id}`);
  }

  // 3. Set hierarchy
  const rdPrahaId = userMap.get("rd.praha@carmakler.cz");
  const rdBrnoId = userMap.get("rd.brno@carmakler.cz");
  const makler1Id = userMap.get("makler1@carmakler.cz");
  const makler2Id = userMap.get("makler2@carmakler.cz");

  // RDs → Manager (Kateřina)
  if (manager) {
    if (rdPrahaId) {
      await prisma.user.update({ where: { id: rdPrahaId }, data: { managerId: manager.id } });
    }
    if (rdBrnoId) {
      await prisma.user.update({ where: { id: rdBrnoId }, data: { managerId: manager.id } });
    }
    console.log(`\n  Hierarchy: RD Praha + RD Brno → ${manager.firstName} ${manager.lastName}`);
  }

  // Brokers → RD Praha
  if (rdPrahaId) {
    if (makler1Id) {
      await prisma.user.update({ where: { id: makler1Id }, data: { managerId: rdPrahaId } });
    }
    if (makler2Id) {
      await prisma.user.update({ where: { id: makler2Id }, data: { managerId: rdPrahaId } });
    }
    console.log(`  Hierarchy: Makler1 + Makler2 → RD Praha (Tomáš Dvořák)`);
  }

  console.log(`\nDone! ${DEMO_USERS.length} demo users upserted.`);
  console.log("Password for all: Demo123!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
