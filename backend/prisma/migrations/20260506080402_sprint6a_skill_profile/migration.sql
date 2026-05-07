/*
  Warnings:

  - You are about to drop the column `lastUpdated` on the `SkillProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SkillProfile" DROP COLUMN "lastUpdated",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "memory" SET DEFAULT 0,
ALTER COLUMN "memory" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "attention" SET DEFAULT 0,
ALTER COLUMN "attention" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "logic" SET DEFAULT 0,
ALTER COLUMN "logic" SET DATA TYPE DOUBLE PRECISION;
