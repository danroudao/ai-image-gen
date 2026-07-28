-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GenerationTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL DEFAULT '',
    "apiTaskId" TEXT,
    "prompt" TEXT NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'gpt-image-2',
    "status" TEXT NOT NULL DEFAULT 'queued',
    "cost" REAL NOT NULL DEFAULT 0,
    "imageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME
);
INSERT INTO "new_GenerationTask" ("apiTaskId", "completedAt", "cost", "createdAt", "id", "imageCount", "prompt", "status", "userId") SELECT "apiTaskId", "completedAt", "cost", "createdAt", "id", "imageCount", "prompt", "status", "userId" FROM "GenerationTask";
DROP TABLE "GenerationTask";
ALTER TABLE "new_GenerationTask" RENAME TO "GenerationTask";
CREATE TABLE "new_Image" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL DEFAULT '',
    "filePath" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "size" TEXT,
    "cost" REAL NOT NULL DEFAULT 0,
    "taskId" TEXT,
    "model" TEXT NOT NULL DEFAULT 'gpt-image-2',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Image" ("cost", "createdAt", "filePath", "id", "prompt", "size", "taskId", "userId") SELECT "cost", "createdAt", "filePath", "id", "prompt", "size", "taskId", "userId" FROM "Image";
DROP TABLE "Image";
ALTER TABLE "new_Image" RENAME TO "Image";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
