/*
  Warnings:

  - The values [BREAKFAST,LUNCH,DINNER,SIGHTSEEING,SHOPPING,REST] on the enum `StopType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "StopType_new" AS ENUM ('ACCOMMODATION', 'ATTRACTION', 'RESTAURANT', 'ACTIVITY', 'TRANSPORT', 'OTHER');
ALTER TABLE "Stop" ALTER COLUMN "type" TYPE "StopType_new" USING ("type"::text::"StopType_new");
ALTER TYPE "StopType" RENAME TO "StopType_old";
ALTER TYPE "StopType_new" RENAME TO "StopType";
DROP TYPE "public"."StopType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Stop" ADD COLUMN     "dayNumber" INTEGER NOT NULL DEFAULT 1;
