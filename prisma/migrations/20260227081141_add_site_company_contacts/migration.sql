-- AlterTable
ALTER TABLE "schedule_contractors" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "site_company_contacts" (
    "id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "company_contact_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_company_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "site_company_contacts_site_id_idx" ON "site_company_contacts"("site_id");

-- CreateIndex
CREATE INDEX "site_company_contacts_company_contact_id_idx" ON "site_company_contacts"("company_contact_id");

-- CreateIndex
CREATE UNIQUE INDEX "site_company_contacts_site_id_company_contact_id_key" ON "site_company_contacts"("site_id", "company_contact_id");

-- AddForeignKey
ALTER TABLE "site_company_contacts" ADD CONSTRAINT "site_company_contacts_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_company_contacts" ADD CONSTRAINT "site_company_contacts_company_contact_id_fkey" FOREIGN KEY ("company_contact_id") REFERENCES "company_contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
