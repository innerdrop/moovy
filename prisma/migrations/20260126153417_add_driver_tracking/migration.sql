-- AlterTable
ALTER TABLE "Driver" ADD COLUMN     "currentOrderId" TEXT,
ADD COLUMN     "lastLat" DOUBLE PRECISION,
ADD COLUMN     "lastLng" DOUBLE PRECISION,
ADD COLUMN     "lastLocationUpdate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Merchant" ADD COLUMN     "adminNotes" TEXT,
ADD COLUMN     "bankAccount" TEXT,
ADD COLUMN     "businessName" TEXT,
ADD COLUMN     "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 8,
ADD COLUMN     "cuil" TEXT,
ADD COLUMN     "displayOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "facebookUrl" TEXT,
ADD COLUMN     "instagramUrl" TEXT,
ADD COLUMN     "isPremium" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ownerBirthDate" TIMESTAMP(3),
ADD COLUMN     "ownerDni" TEXT,
ADD COLUMN     "premiumTier" TEXT DEFAULT 'basic',
ADD COLUMN     "premiumUntil" TIMESTAMP(3),
ADD COLUMN     "startedAt" TIMESTAMP(3),
ADD COLUMN     "whatsappNumber" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "commissionPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "driverRating" INTEGER,
ADD COLUMN     "merchantPayout" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "moovyCommission" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "ratedAt" TIMESTAMP(3),
ADD COLUMN     "ratingComment" TEXT;

-- AlterTable
ALTER TABLE "StoreSettings" ADD COLUMN     "promoPopupButtonText" TEXT DEFAULT 'Ver más',
ADD COLUMN     "promoPopupDismissable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "promoPopupEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "promoPopupImage" TEXT,
ADD COLUMN     "promoPopupLink" TEXT,
ADD COLUMN     "promoPopupMessage" TEXT,
ADD COLUMN     "promoPopupTitle" TEXT,
ADD COLUMN     "showComerciosCard" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showRepartidoresCard" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "SupportChat" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "merchantId" TEXT,
    "subject" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportChat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportMessage" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isFromAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderBackup" (
    "id" TEXT NOT NULL,
    "backupName" TEXT NOT NULL,
    "orderData" TEXT NOT NULL,
    "orderId" TEXT,
    "orderNumber" TEXT,
    "total" DOUBLE PRECISION,
    "deletedBy" TEXT,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderBackup_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SupportChat" ADD CONSTRAINT "SupportChat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "SupportChat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
