-- AlterTable
ALTER TABLE `Message` ADD COLUMN `title` VARCHAR(191) NULL,
    MODIFY `typeMessage` ENUM('image', 'gift', 'text', 'custom') NOT NULL DEFAULT 'text';

-- CreateTable
CREATE TABLE `LockedConversation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `initiatorId` INTEGER NOT NULL,
    `receiverId` INTEGER NOT NULL,

    UNIQUE INDEX `LockedConversation_initiatorId_receiverId_key`(`initiatorId`, `receiverId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LockedConversation` ADD CONSTRAINT `LockedConversation_initiatorId_fkey` FOREIGN KEY (`initiatorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LockedConversation` ADD CONSTRAINT `LockedConversation_receiverId_fkey` FOREIGN KEY (`receiverId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
