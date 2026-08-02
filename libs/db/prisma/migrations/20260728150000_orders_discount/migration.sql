-- AlterTable Invitation
ALTER TABLE "Invitation" ADD COLUMN IF NOT EXISTS "bulkSentAt" TIMESTAMP(3);

-- AlterTable Order
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "planId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shortCode" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "claimedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "confirmedBy" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "confirmedAt" TIMESTAMP(3);

-- Backfill planId / shortCode for any existing rows
UPDATE "Order" SET "planId" = CASE
  WHEN "tier" = 'BASIC' THEN 'basic'
  WHEN "tier" = 'PREMIUM' THEN 'premium'
  ELSE 'free'
END
WHERE "planId" IS NULL;

UPDATE "Order" SET "shortCode" = 'TV-' || UPPER(SUBSTRING("id" FROM 1 FOR 4))
WHERE "shortCode" IS NULL;

ALTER TABLE "Order" ALTER COLUMN "planId" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "shortCode" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Order_shortCode_key" ON "Order"("shortCode");
CREATE INDEX IF NOT EXISTS "Order_invitationId_idx" ON "Order"("invitationId");
CREATE INDEX IF NOT EXISTS "Order_status_idx" ON "Order"("status");

-- FK (ignore if already present)
DO $$ BEGIN
  ALTER TABLE "Order" ADD CONSTRAINT "Order_invitationId_fkey"
    FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable Discount
CREATE TABLE IF NOT EXISTS "Discount" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "percent" INTEGER NOT NULL,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Discount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Discount_code_key" ON "Discount"("code");
