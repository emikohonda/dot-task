/*
  Warnings:

  - You are about to drop the column `completed_at` on the `schedules` table. All the data in the column will be lost.
  - You are about to drop the column `is_deferred` on the `schedules` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."schedules_siteId_completed_at_idx";

-- AlterTable
ALTER TABLE "schedules" DROP COLUMN "completed_at",
DROP COLUMN "is_deferred";
