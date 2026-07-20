-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SystemConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "defaultMaxTasks" INTEGER NOT NULL DEFAULT 3,
    "defaultMonthlyLimit" INTEGER NOT NULL DEFAULT 500,
    "maxStorageMB" INTEGER NOT NULL DEFAULT 500,
    "allowRegistration" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_SystemConfig" ("allowRegistration", "defaultMaxTasks", "defaultMonthlyLimit", "id") SELECT "allowRegistration", "defaultMaxTasks", "defaultMonthlyLimit", "id" FROM "SystemConfig";
DROP TABLE "SystemConfig";
ALTER TABLE "new_SystemConfig" RENAME TO "SystemConfig";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
