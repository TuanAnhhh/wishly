-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('WEDDING', 'BIRTHDAY', 'BABY_MONTH');

-- CreateEnum
CREATE TYPE "Tier" AS ENUM ('FREE', 'BASIC', 'PREMIUM');

-- CreateEnum
CREATE TYPE "InvStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ENDED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "provider" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "priceByEvent" JSONB,
    "guestLimit" INTEGER,
    "features" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT,
    "anonSessionId" TEXT,
    "claimedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "slug" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL,
    "eventDate" TIMESTAMP(3),
    "status" "InvStatus" NOT NULL DEFAULT 'DRAFT',
    "tier" "Tier" NOT NULL DEFAULT 'FREE',
    "content" JSONB NOT NULL,
    "theme" JSONB NOT NULL,
    "blocks" JSONB NOT NULL,
    "ogImageKey" TEXT,
    "guestLimit" INTEGER NOT NULL DEFAULT 30,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "group" TEXT,
    "note" TEXT,
    "token" TEXT NOT NULL,
    "sentVia" TEXT,
    "consentAt" TIMESTAMP(3),

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rsvp" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "guestId" TEXT,
    "name" TEXT NOT NULL,
    "attending" BOOLEAN NOT NULL,
    "plusOnes" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rsvp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestbookEntry" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuestbookEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiftAccount" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "bank" TEXT NOT NULL,
    "accountNo" TEXT NOT NULL,
    "holder" TEXT NOT NULL,

    CONSTRAINT "GiftAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" "Tier" NOT NULL,
    "thumbKey" TEXT NOT NULL,
    "blocks" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "tier" "Tier" NOT NULL,
    "amount" INTEGER NOT NULL,
    "planSnapshot" JSONB NOT NULL,
    "discountCode" TEXT,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "invoiceInfo" JSONB,
    "refundable" BOOLEAN NOT NULL DEFAULT true,
    "paidAt" TIMESTAMP(3),
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_slug_key" ON "Invitation"("slug");

-- CreateIndex
CREATE INDEX "Invitation_ownerId_idx" ON "Invitation"("ownerId");

-- CreateIndex
CREATE INDEX "Invitation_anonSessionId_idx" ON "Invitation"("anonSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Guest_token_key" ON "Guest"("token");

-- CreateIndex
CREATE INDEX "Guest_invitationId_idx" ON "Guest"("invitationId");

-- CreateIndex
CREATE INDEX "Rsvp_invitationId_idx" ON "Rsvp"("invitationId");

-- CreateIndex
CREATE INDEX "GuestbookEntry_invitationId_createdAt_idx" ON "GuestbookEntry"("invitationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Template_slug_key" ON "Template"("slug");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
