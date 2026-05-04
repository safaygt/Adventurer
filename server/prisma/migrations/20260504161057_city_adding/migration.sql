/*
  Warnings:

  - Added the required column `city` to the `Route` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Route" ADD COLUMN     "city" TEXT NOT NULL;
