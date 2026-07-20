-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "defaultMaxTasks" INTEGER NOT NULL DEFAULT 3,
    "defaultMonthlyLimit" INTEGER NOT NULL DEFAULT 500,
    "allowRegistration" BOOLEAN NOT NULL DEFAULT true
);
