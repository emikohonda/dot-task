-- AlterTable
ALTER TABLE "schedules" ADD COLUMN     "endDate" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "schedules_endDate_idx" ON "schedules"("endDate");
