-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GenerationTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL DEFAULT '',
    "apiTaskId" TEXT,
    "prompt" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "cost" REAL NOT NULL DEFAULT 0,
    "imageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME
);
INSERT INTO "new_GenerationTask" ("apiTaskId", "completedAt", "cost", "createdAt", "id", "imageCount", "prompt", "status", "userId") SELECT "apiTaskId", "completedAt", "cost", "createdAt", "id", "imageCount", "prompt", "status", "userId" FROM "GenerationTask";
DROP TABLE "GenerationTask";
ALTER TABLE "new_GenerationTask" RENAME TO "GenerationTask";
CREATE TABLE "new_HistoryEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL DEFAULT '',
    "params" TEXT NOT NULL,
    "imageIds" TEXT NOT NULL,
    "cost" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_HistoryEntry" ("cost", "createdAt", "id", "imageIds", "params", "userId") SELECT "cost", "createdAt", "id", "imageIds", "params", "userId" FROM "HistoryEntry";
DROP TABLE "HistoryEntry";
ALTER TABLE "new_HistoryEntry" RENAME TO "HistoryEntry";
CREATE TABLE "new_Image" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL DEFAULT '',
    "filePath" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "size" TEXT,
    "cost" REAL NOT NULL DEFAULT 0,
    "taskId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Image" ("cost", "createdAt", "filePath", "id", "prompt", "size", "taskId", "userId") SELECT "cost", "createdAt", "filePath", "id", "prompt", "size", "taskId", "userId" FROM "Image";
DROP TABLE "Image";
ALTER TABLE "new_Image" RENAME TO "Image";
CREATE TABLE "new_Quota" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "maxTasks" INTEGER NOT NULL DEFAULT 3,
    "monthlyLimit" INTEGER NOT NULL DEFAULT 500,
    "usedThisMonth" INTEGER NOT NULL DEFAULT 0,
    "monthReset" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Quota" ("id", "maxTasks", "monthReset", "monthlyLimit", "usedThisMonth", "userId") SELECT "id", "maxTasks", "monthReset", "monthlyLimit", "usedThisMonth", "userId" FROM "Quota";
DROP TABLE "Quota";
ALTER TABLE "new_Quota" RENAME TO "Quota";
CREATE UNIQUE INDEX "Quota_userId_key" ON "Quota"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
