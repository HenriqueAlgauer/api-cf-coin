-- DropForeignKey
ALTER TABLE `Coin` DROP FOREIGN KEY `Coin_taskId_fkey`;

-- DropForeignKey
ALTER TABLE `Coin` DROP FOREIGN KEY `Coin_userId_fkey`;

-- DropIndex
DROP INDEX `Coin_taskId_fkey` ON `Coin`;

-- DropIndex
DROP INDEX `Coin_userId_fkey` ON `Coin`;

-- AlterTable
ALTER TABLE `Coin` MODIFY `taskId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Coin` ADD CONSTRAINT `Coin_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Coin` ADD CONSTRAINT `Coin_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `Task`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
