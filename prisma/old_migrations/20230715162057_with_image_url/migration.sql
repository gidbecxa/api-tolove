/*
  Warnings:

  - The values [file] on the enum `Message_typeMessage` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `Message` ADD COLUMN `mediaUrl` VARCHAR(191) NULL,
    MODIFY `typeMessage` ENUM('image', 'gift', 'text') NOT NULL DEFAULT 'text';
