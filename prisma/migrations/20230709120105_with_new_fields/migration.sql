-- AlterTable
ALTER TABLE `User` ADD COLUMN `firstOtherPhoto` VARCHAR(191) NULL,
    ADD COLUMN `isLockEnabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isVideoEnabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `secondOtherPhoto` VARCHAR(191) NULL,
    ADD COLUMN `thirdOtherPhoto` VARCHAR(191) NULL;
