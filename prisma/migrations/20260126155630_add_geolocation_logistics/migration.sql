/*
  Warnings:

  - You are about to drop the column `currentOrderId` on the `Driver` table. All the data in the column will be lost.
  - You are about to drop the column `lastLat` on the `Driver` table. All the data in the column will be lost.
  - You are about to drop the column `lastLng` on the `Driver` table. All the data in the column will be lost.
  - You are about to drop the column `lastLocationUpdate` on the `Driver` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Driver" DROP COLUMN "currentOrderId",
DROP COLUMN "lastLat",
DROP COLUMN "lastLng",
DROP COLUMN "lastLocationUpdate",
ADD COLUMN     "availabilityStatus" TEXT NOT NULL DEFAULT 'FUERA_DE_SERVICIO',
ADD COLUMN     "lastLocationAt" TIMESTAMP(3),
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "assignmentAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "assignmentExpiresAt" TIMESTAMP(3),
ADD COLUMN     "attemptedDriverIds" TEXT,
ADD COLUMN     "lastAssignmentAt" TIMESTAMP(3),
ADD COLUMN     "pendingDriverId" TEXT;
