-- AlterTable Invitation
ALTER TABLE "Invitation" ADD COLUMN "recapToken" TEXT;
ALTER TABLE "Invitation" ADD COLUMN "showGiftOnRecap" BOOLEAN NOT NULL DEFAULT false;
CREATE UNIQUE INDEX "Invitation_recapToken_key" ON "Invitation"("recapToken");

-- AlterTable Guest
ALTER TABLE "Guest" ADD COLUMN "thanksPersona" TEXT;

-- CreateTable Album
CREATE TABLE "Album" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Album',
    "opensAt" TIMESTAMP(3) NOT NULL,
    "closesAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Album_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Album_invitationId_key" ON "Album"("invitationId");

ALTER TABLE "Album" ADD CONSTRAINT "Album_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable AlbumPhoto
CREATE TABLE "AlbumPhoto" (
    "id" TEXT NOT NULL,
    "albumId" TEXT NOT NULL,
    "mediaKey" TEXT NOT NULL,
    "uploaderName" TEXT NOT NULL,
    "guestId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "byteSize" INT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AlbumPhoto_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AlbumPhoto_albumId_status_idx" ON "AlbumPhoto"("albumId", "status");

ALTER TABLE "AlbumPhoto" ADD CONSTRAINT "AlbumPhoto_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable ThankYouSend
CREATE TABLE "ThankYouSend" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "persona" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ThankYouSend_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ThankYouSend_invitationId_guestId_key" ON "ThankYouSend"("invitationId", "guestId");
CREATE INDEX "ThankYouSend_invitationId_idx" ON "ThankYouSend"("invitationId");

ALTER TABLE "ThankYouSend" ADD CONSTRAINT "ThankYouSend_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable AlbumUploadQuota
CREATE TABLE "AlbumUploadQuota" (
    "id" TEXT NOT NULL,
    "albumId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AlbumUploadQuota_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AlbumUploadQuota_albumId_sessionId_key" ON "AlbumUploadQuota"("albumId", "sessionId");
CREATE INDEX "AlbumUploadQuota_albumId_idx" ON "AlbumUploadQuota"("albumId");
