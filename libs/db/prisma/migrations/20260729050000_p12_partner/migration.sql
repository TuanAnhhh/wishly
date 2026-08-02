-- AlterTable Invitation
ALTER TABLE "Invitation" ADD COLUMN "partnerId" TEXT;
ALTER TABLE "Invitation" ADD COLUMN "assignedMemberId" TEXT;
ALTER TABLE "Invitation" ADD COLUMN "clientCode" TEXT;
CREATE INDEX "Invitation_partnerId_idx" ON "Invitation"("partnerId");

-- CreateTable Partner
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "planTier" TEXT NOT NULL DEFAULT 'studio',
    "slotLimit" INTEGER NOT NULL DEFAULT 20,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Partner_slug_key" ON "Partner"("slug");

-- CreateTable PartnerBrand
CREATE TABLE "PartnerBrand" (
    "partnerId" TEXT NOT NULL,
    "logoKey" TEXT,
    "color" TEXT,
    "subdomain" TEXT,
    "domainStatus" TEXT NOT NULL DEFAULT 'none',
    "signature" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PartnerBrand_pkey" PRIMARY KEY ("partnerId")
);
CREATE UNIQUE INDEX "PartnerBrand_subdomain_key" ON "PartnerBrand"("subdomain");
ALTER TABLE "PartnerBrand" ADD CONSTRAINT "PartnerBrand_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable PartnerMember
CREATE TABLE "PartnerMember" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "inviteToken" TEXT,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joinedAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3),
    CONSTRAINT "PartnerMember_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PartnerMember_inviteToken_key" ON "PartnerMember"("inviteToken");
CREATE UNIQUE INDEX "PartnerMember_partnerId_email_key" ON "PartnerMember"("partnerId", "email");
CREATE INDEX "PartnerMember_userId_idx" ON "PartnerMember"("userId");
CREATE INDEX "PartnerMember_partnerId_idx" ON "PartnerMember"("partnerId");
ALTER TABLE "PartnerMember" ADD CONSTRAINT "PartnerMember_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable PartnerTemplate
CREATE TABLE "PartnerTemplate" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL,
    "theme" JSONB NOT NULL,
    "blocks" JSONB NOT NULL,
    "content" JSONB NOT NULL,
    "thumbKey" TEXT,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PartnerTemplate_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PartnerTemplate_partnerId_idx" ON "PartnerTemplate"("partnerId");
ALTER TABLE "PartnerTemplate" ADD CONSTRAINT "PartnerTemplate_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable PartnerSubscription
CREATE TABLE "PartnerSubscription" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "planTier" TEXT NOT NULL,
    "amountMonthly" INTEGER NOT NULL,
    "slotLimit" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'bank_manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PartnerSubscription_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PartnerSubscription_partnerId_idx" ON "PartnerSubscription"("partnerId");
ALTER TABLE "PartnerSubscription" ADD CONSTRAINT "PartnerSubscription_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable PartnerInvoice
CREATE TABLE "PartnerInvoice" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3),
    "pdfKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PartnerInvoice_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PartnerInvoice_code_key" ON "PartnerInvoice"("code");
CREATE INDEX "PartnerInvoice_subscriptionId_idx" ON "PartnerInvoice"("subscriptionId");
ALTER TABLE "PartnerInvoice" ADD CONSTRAINT "PartnerInvoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "PartnerSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
