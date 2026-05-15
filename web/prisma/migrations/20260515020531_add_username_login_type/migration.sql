-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "username" TEXT,
    "loginType" TEXT NOT NULL DEFAULT 'local',
    "email" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "passwordHash" TEXT,
    "department" TEXT,
    "employeeId" TEXT,
    "title" TEXT,
    "phone" TEXT,
    "hermesApiKey" TEXT,
    "hermesApiUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lockedUntil" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "department", "email", "emailVerified", "employeeId", "hermesApiKey", "hermesApiUrl", "id", "image", "isActive", "lockedUntil", "name", "passwordHash", "phone", "title", "updatedAt") SELECT "createdAt", "department", "email", "emailVerified", "employeeId", "hermesApiKey", "hermesApiUrl", "id", "image", "isActive", "lockedUntil", "name", "passwordHash", "phone", "title", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
