/*
  Warnings:

  - You are about to drop the column `giftId` on the `Message` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `Message` DROP FOREIGN KEY `Message_giftId_fkey`;

-- AlterTable
ALTER TABLE `Message` DROP COLUMN `giftId`;
