-- AlterTable
ALTER TABLE "Guest" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "GuestbookEntry_invitationId_status_idx" ON "GuestbookEntry"("invitationId", "status");

-- CreateTable
CREATE TABLE IF NOT EXISTS "GiftEntry" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "guestId" TEXT,
    "giverName" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "side" TEXT NOT NULL,
    "note" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GiftEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "GiftEntry_invitationId_idx" ON "GiftEntry"("invitationId");
CREATE INDEX IF NOT EXISTS "GiftEntry_guestId_idx" ON "GiftEntry"("guestId");

DO $$ BEGIN
  ALTER TABLE "GiftEntry" ADD CONSTRAINT "GiftEntry_guestId_fkey"
    FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "Rsvp_guestId_idx" ON "Rsvp"("guestId");

DO $$ BEGIN
  ALTER TABLE "Rsvp" ADD CONSTRAINT "Rsvp_guestId_fkey"
    FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
