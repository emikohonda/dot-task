/*
  Warnings:

  - Made the column `organization_id` on table `companies` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organization_id` on table `contractors` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organization_id` on table `employees` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organization_id` on table `schedules` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organization_id` on table `sites` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."companies" DROP CONSTRAINT "companies_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."contractors" DROP CONSTRAINT "contractors_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."employees" DROP CONSTRAINT "employees_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."schedules" DROP CONSTRAINT "schedules_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."sites" DROP CONSTRAINT "sites_organization_id_fkey";

-- AlterTable
ALTER TABLE "companies" ALTER COLUMN "organization_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "contractors" ALTER COLUMN "organization_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "employees" ALTER COLUMN "organization_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "schedules" ALTER COLUMN "organization_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "sites" ALTER COLUMN "organization_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sites" ADD CONSTRAINT "sites_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contractors" ADD CONSTRAINT "contractors_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
