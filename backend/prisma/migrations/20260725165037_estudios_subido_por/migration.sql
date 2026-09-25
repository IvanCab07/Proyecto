-- AlterTable
ALTER TABLE `estudios` ADD COLUMN `subidoPorId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `estudios` ADD CONSTRAINT `estudios_subidoPorId_fkey` FOREIGN KEY (`subidoPorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
