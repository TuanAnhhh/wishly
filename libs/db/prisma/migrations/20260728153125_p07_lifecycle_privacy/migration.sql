-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_invitationId_fkey";

-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN     "consentAt" TIMESTAMP(3),
ADD COLUMN     "consentBy" TEXT,
ADD COLUMN     "hideGift" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "publicGuestbook" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "purgeAt" TIMESTAMP(3),
ADD COLUMN     "purgedAt" TIMESTAMP(3),
ADD COLUMN     "retentionMonths" INTEGER NOT NULL DEFAULT 6;

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "invitationId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
