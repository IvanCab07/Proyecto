-- AlterTable
ALTER TABLE `users` ADD COLUMN `numeroAfiliado` VARCHAR(191) NULL,
    ADD COLUMN `obraSocialId` VARCHAR(191) NULL,
    ADD COLUMN `vencimientoObraSocial` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `obras_sociales` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `obras_sociales_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cobertura_especialidades` (
    `id` VARCHAR(191) NOT NULL,
    `obraSocialId` VARCHAR(191) NOT NULL,
    `especialidadId` VARCHAR(191) NOT NULL,
    `porcentajeCobertura` INTEGER NULL,

    UNIQUE INDEX `cobertura_especialidades_obraSocialId_especialidadId_key`(`obraSocialId`, `especialidadId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_obraSocialId_fkey` FOREIGN KEY (`obraSocialId`) REFERENCES `obras_sociales`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cobertura_especialidades` ADD CONSTRAINT `cobertura_especialidades_obraSocialId_fkey` FOREIGN KEY (`obraSocialId`) REFERENCES `obras_sociales`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cobertura_especialidades` ADD CONSTRAINT `cobertura_especialidades_especialidadId_fkey` FOREIGN KEY (`especialidadId`) REFERENCES `especialidades`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
