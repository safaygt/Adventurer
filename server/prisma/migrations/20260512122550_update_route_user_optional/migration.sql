/*
  Warnings:

  - A unique constraint covering the columns `[userId,title]` on the table `Route` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Route_userId_title_key" ON "Route"("userId", "title");
