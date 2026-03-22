-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Escalation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brokerId" TEXT NOT NULL,
    "managerId" TEXT,
    "vehicleId" TEXT,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "resolvedAt" DATETIME,
    CONSTRAINT "Escalation_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Escalation_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Escalation_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Escalation" ("brokerId", "createdAt", "description", "id", "managerId", "priority", "resolution", "resolvedAt", "status", "subject", "type", "updatedAt") SELECT "brokerId", "createdAt", "description", "id", "managerId", "priority", "resolution", "resolvedAt", "status", "subject", "type", "updatedAt" FROM "Escalation";
DROP TABLE "Escalation";
ALTER TABLE "new_Escalation" RENAME TO "Escalation";
CREATE INDEX "Escalation_brokerId_idx" ON "Escalation"("brokerId");
CREATE INDEX "Escalation_managerId_idx" ON "Escalation"("managerId");
CREATE INDEX "Escalation_vehicleId_idx" ON "Escalation"("vehicleId");
CREATE INDEX "Escalation_status_idx" ON "Escalation"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
