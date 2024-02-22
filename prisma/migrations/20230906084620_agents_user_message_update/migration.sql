-- AlterTable
ALTER TABLE `Message` ADD COLUMN `isSentByAgent` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `assignedAgent` INTEGER NULL;
