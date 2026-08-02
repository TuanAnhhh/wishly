-- AlterEnum
ALTER TYPE "EventType" ADD VALUE 'CORPORATE';

-- AlterTable Invitation
ALTER TABLE "Invitation" ADD COLUMN "brandColor" TEXT;

-- AlterTable Guest
ALTER TABLE "Guest" ADD COLUMN "mealChoice" TEXT;
ALTER TABLE "Guest" ADD COLUMN "allergyNote" TEXT;
ALTER TABLE "Guest" ADD COLUMN "lang" TEXT;
ALTER TABLE "Guest" ADD COLUMN "title" TEXT;
