/*
  Warnings:

  - You are about to drop the column `status` on the `schedules` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "schedules" DROP COLUMN "status",
ADD COLUMN     "completed_at" TIMESTAMP(3);

-- DropEnum
DROP TYPE "public"."ScheduleStatus";

-- CreateIndex
CREATE INDEX "schedules_siteId_completed_at_idx" ON "schedules"("siteId", "completed_at");
