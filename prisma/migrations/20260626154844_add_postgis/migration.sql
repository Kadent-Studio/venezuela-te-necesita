/*
  Warnings:

  - You are about to drop the column `location` on the `Report` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Report_location_gix";

-- AlterTable
ALTER TABLE "Report" DROP COLUMN "location";
