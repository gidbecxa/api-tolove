-- DropIndex
DROP INDEX `User_email_key` ON `User`;

-- AlterTable
ALTER TABLE `User` MODIFY `email` VARCHAR(191) NULL;
