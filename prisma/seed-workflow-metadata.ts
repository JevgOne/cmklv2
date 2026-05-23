/**
 * Update existing workflow requests with structured metadata.
 * Also create admin notifications for recent workflow requests.
 *
 * Run: npx tsx prisma/seed-workflow-metadata.ts
 * Prod: ssh server "cd /var/www/carmakler && export $(grep -v '^#' .env | xargs) && node --import tsx/esm prisma/seed-workflow-metadata.ts"
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL || "postgresql://zen@localhost:5432/carmakler";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Metadata per type — realistic structured context
const TYPE_METADATA: Record<string, Record<string, string>> = {
  BUG_REPORT: {
    page: "PWA Dashboard → Nahrávání fotek",
    device: "iPhone 14 Pro",
    browser: "iOS 18.4, Safari",
    stepsToReproduce: "1. Otevřel PWA na iPhone\n2. Klikl na 'Přidat fotky'\n3. Vyfotil 8 fotek\n4. Appka zamrzla a musela se restartovat",
    errorMessage: "Žádná chybová zpráva — appka jen zamrzne",
  },
  SUPPORT: {
    page: "Admin panel → Vozidla → Detail",
    device: "MacBook Pro",
    browser: "Chrome 126",
    errorMessage: "Tlačítko 'Schválit' je šedé a nejde kliknout",
  },
  QUESTION: {
    page: "PWA → Smlouvy",
  },
  COMPLAINT: {
    page: "Veřejný web → Detail nabídky",
  },
  FINANCING: {
    page: "PWA → Detail vozidla → Financování",
  },
  INSURANCE: {
    page: "PWA → Detail vozidla → Pojištění",
  },
};

async function main() {
  console.log("Updating workflow requests with metadata...\n");

  // Get all workflow requests
  const requests = await prisma.workflowRequest.findMany({
    where: { metadata: null },
    select: { id: true, type: true, title: true },
  });

  let updated = 0;
  for (const req of requests) {
    const metadata = TYPE_METADATA[req.type];
    if (metadata) {
      await prisma.workflowRequest.update({
        where: { id: req.id },
        data: { metadata: JSON.stringify(metadata) },
      });
      console.log(`  Updated: ${req.title} (${req.type}) — added ${Object.keys(metadata).length} context fields`);
      updated++;
    }
  }

  // Create admin notifications for all unresolved requests
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", status: "ACTIVE" },
    select: { id: true },
  });

  const openRequests = await prisma.workflowRequest.findMany({
    where: { status: { notIn: ["CLOSED", "CANCELLED", "RESOLVED"] } },
    include: { createdBy: { select: { firstName: true, lastName: true } } },
  });

  let notifCount = 0;
  for (const admin of admins) {
    for (const req of openRequests) {
      // Check if notification already exists
      const existing = await prisma.notification.findFirst({
        where: {
          userId: admin.id,
          link: `/admin/workflow/${req.id}`,
        },
      });
      if (existing) continue;

      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: "SYSTEM",
          title: `Požadavek: ${req.title}`,
          body: `${req.createdBy.firstName} ${req.createdBy.lastName} — ${req.type.replace(/_/g, " ").toLowerCase()}`,
          link: `/admin/workflow/${req.id}`,
          read: false,
        },
      });
      notifCount++;
    }
  }

  console.log(`\nDone! ${updated} requests updated with metadata, ${notifCount} admin notifications created.`);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
