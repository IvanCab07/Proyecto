-- AlterTable
ALTER TABLE `medicos` ADD COLUMN `userId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `activo` BOOLEAN NOT NULL DEFAULT true,
    MODIFY `role` ENUM('PATIENT', 'ADMIN', 'MEDICO') NOT NULL DEFAULT 'PATIENT';

-- CreateIndex
CREATE UNIQUE INDEX `medicos_userId_key` ON `medicos`(`userId`);

-- AddForeignKey
ALTER TABLE `medicos` ADD CONSTRAINT `medicos_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
