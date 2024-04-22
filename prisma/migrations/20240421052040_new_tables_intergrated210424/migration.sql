/*
  Warnings:

  - You are about to alter the column `coins` on the `User` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to drop the `Hostel` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `HostelReservation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LikedHostel` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LikedResto` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Resto` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RestoReservation` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('HOTEL', 'RESTAURANT', 'TRANSPORT', 'EVENEMENT');

-- DropForeignKey
ALTER TABLE "Hostel" DROP CONSTRAINT "Hostel_cityId_fkey";

-- DropForeignKey
ALTER TABLE "Hostel" DROP CONSTRAINT "Hostel_countryId_fkey";

-- DropForeignKey
ALTER TABLE "HostelReservation" DROP CONSTRAINT "HostelReservation_hostelId_fkey";

-- DropForeignKey
ALTER TABLE "HostelReservation" DROP CONSTRAINT "HostelReservation_userId_fkey";

-- DropForeignKey
ALTER TABLE "LikedHostel" DROP CONSTRAINT "LikedHostel_hostelId_fkey";

-- DropForeignKey
ALTER TABLE "LikedHostel" DROP CONSTRAINT "LikedHostel_userId_fkey";

-- DropForeignKey
ALTER TABLE "LikedResto" DROP CONSTRAINT "LikedResto_restoId_fkey";

-- DropForeignKey
ALTER TABLE "LikedResto" DROP CONSTRAINT "LikedResto_userId_fkey";

-- DropForeignKey
ALTER TABLE "Resto" DROP CONSTRAINT "Resto_cityId_fkey";

-- DropForeignKey
ALTER TABLE "Resto" DROP CONSTRAINT "Resto_countryId_fkey";

-- DropForeignKey
ALTER TABLE "RestoReservation" DROP CONSTRAINT "RestoReservation_restoId_fkey";

-- DropForeignKey
ALTER TABLE "RestoReservation" DROP CONSTRAINT "RestoReservation_userId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "coins" SET DEFAULT 0,
ALTER COLUMN "coins" SET DATA TYPE INTEGER;

-- DropTable
DROP TABLE "Hostel";

-- DropTable
DROP TABLE "HostelReservation";

-- DropTable
DROP TABLE "LikedHostel";

-- DropTable
DROP TABLE "LikedResto";

-- DropTable
DROP TABLE "Resto";

-- DropTable
DROP TABLE "RestoReservation";

-- CreateTable
CREATE TABLE "Subscription" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "SubscriptionStatus" NOT NULL,
    "price" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" SERIAL NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "username" TEXT,
    "email" TEXT,
    "category" TEXT,
    "logo" TEXT,
    "description" TEXT,
    "country" TEXT,
    "city" TEXT,
    "location" TEXT,
    "mapAddress" TEXT,
    "solde" INTEGER,
    "subscriptionId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanySubscription" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "subscriptionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanySubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Carte" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mapAddress" TEXT,
    "description" TEXT,
    "location" TEXT,
    "OpenDaysTime" TEXT NOT NULL,
    "countryId" INTEGER NOT NULL,
    "cityId" INTEGER NOT NULL,
    "image" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,
    "typeCarte" "SubscriptionStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Carte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarteOthersPhoto" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "path_url" TEXT NOT NULL,
    "carteId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarteOthersPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LikedCarte" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "carteId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LikedCarte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarteReservation" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "carteId" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalPrice" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CarteReservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_phoneNumber_key" ON "Company"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Company_username_key" ON "Company"("username");

-- AddForeignKey
ALTER TABLE "CompanySubscription" ADD CONSTRAINT "CompanySubscription_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanySubscription" ADD CONSTRAINT "CompanySubscription_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Carte" ADD CONSTRAINT "Carte_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Carte" ADD CONSTRAINT "Carte_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Carte" ADD CONSTRAINT "Carte_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarteOthersPhoto" ADD CONSTRAINT "CarteOthersPhoto_carteId_fkey" FOREIGN KEY ("carteId") REFERENCES "Carte"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LikedCarte" ADD CONSTRAINT "LikedCarte_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LikedCarte" ADD CONSTRAINT "LikedCarte_carteId_fkey" FOREIGN KEY ("carteId") REFERENCES "Carte"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarteReservation" ADD CONSTRAINT "CarteReservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarteReservation" ADD CONSTRAINT "CarteReservation_carteId_fkey" FOREIGN KEY ("carteId") REFERENCES "Carte"("id") ON DELETE CASCADE ON UPDATE CASCADE;
