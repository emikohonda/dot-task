-- DropIndex
DROP INDEX "organization_members_user_id_organization_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_user_id_key" ON "organization_members"("user_id");

