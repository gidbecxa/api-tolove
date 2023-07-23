-- CreateTable
CREATE TABLE `SocketMapping` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `socketId` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,

    UNIQUE INDEX `SocketMapping_socketId_key`(`socketId`),
    UNIQUE INDEX `SocketMapping_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SocketMapping` ADD CONSTRAINT `SocketMapping_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
