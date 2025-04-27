/*
  Warnings:

  - You are about to drop the column `projectId` on the `PgInstance` table. All the data in the column will be lost.
  - You are about to drop the `Project` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `teamId` to the `PgInstance` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PgInstance" DROP CONSTRAINT "PgInstance_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_teamId_fkey";

-- AlterTable
ALTER TABLE "PgInstance" DROP COLUMN "projectId",
ADD COLUMN     "teamId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "Project";

-- AddForeignKey
ALTER TABLE "PgInstance" ADD CONSTRAINT "PgInstance_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
