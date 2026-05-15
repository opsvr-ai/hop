-- DropIndex
DROP INDEX "RoleBinding_userId_roleId_envId_key";

-- CreateIndex
CREATE INDEX "RoleBinding_userId_idx" ON "RoleBinding"("userId");

-- CreateIndex
CREATE INDEX "RoleBinding_roleId_idx" ON "RoleBinding"("roleId");
