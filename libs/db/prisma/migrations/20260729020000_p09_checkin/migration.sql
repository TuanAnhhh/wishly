-- AlterTable Guest
ALTER TABLE "Guest" ADD COLUMN "passCode" TEXT;
ALTER TABLE "Guest" ADD COLUMN "checkedInAt" TIMESTAMP(3);
ALTER TABLE "Guest" ADD COLUMN "checkedInBy" TEXT;
ALTER TABLE "Guest" ADD COLUMN "walkIn" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Guest_passCode_key" ON "Guest"("passCode");

-- CreateTable
CREATE TABLE "StaffAccess" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffAccess_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StaffAccess_token_key" ON "StaffAccess"("token");
CREATE INDEX "StaffAccess_invitationId_idx" ON "StaffAccess"("invitationId");

ALTER TABLE "StaffAccess" ADD CONSTRAINT "StaffAccess_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
