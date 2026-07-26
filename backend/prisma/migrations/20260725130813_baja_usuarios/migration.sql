-- AlterTable
ALTER TABLE `users` ADD COLUMN `desactivadoAt` DATETIME(3) NULL,
    ADD COLUMN `motivoBaja` VARCHAR(191) NULL;
