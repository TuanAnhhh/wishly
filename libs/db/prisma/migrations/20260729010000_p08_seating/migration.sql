-- AlterTable Invitation
ALTER TABLE "Invitation" ADD COLUMN "seatingLockedAt" TIMESTAMP(3);
ALTER TABLE "Invitation" ADD COLUMN "seatingLog" JSONB;

-- CreateTable
CREATE TABLE "SeatingTable" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeatingTable_pkey" PRIMARY KEY ("id")
);

-- AlterTable Guest
ALTER TABLE "Guest" ADD COLUMN "partySize" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Guest" ADD COLUMN "partySizeManual" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Guest" ADD COLUMN "tableId" TEXT;

-- CreateIndex
CREATE INDEX "SeatingTable_invitationId_idx" ON "SeatingTable"("invitationId");
CREATE INDEX "Guest_tableId_idx" ON "Guest"("tableId");

-- AddForeignKey
ALTER TABLE "SeatingTable" ADD CONSTRAINT "SeatingTable_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "SeatingTable"("id") ON DELETE SET NULL ON UPDATE CASCADE;
