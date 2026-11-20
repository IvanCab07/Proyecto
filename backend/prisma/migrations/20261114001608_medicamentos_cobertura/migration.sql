-- AlterTable
ALTER TABLE `recetas` ADD COLUMN `coberturaObraSocial` VARCHAR(191) NULL,
    ADD COLUMN `coberturaPorcentaje` INTEGER NULL,
    ADD COLUMN `medicamentoId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `medicamentos` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `medicamentos_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cobertura_medicamentos` (
    `id` VARCHAR(191) NOT NULL,
    `obraSocialId` VARCHAR(191) NOT NULL,
    `medicamentoId` VARCHAR(191) NOT NULL,
    `porcentaje` INTEGER NOT NULL,

    UNIQUE INDEX `cobertura_medicamentos_obraSocialId_medicamentoId_key`(`obraSocialId`, `medicamentoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `recetas` ADD CONSTRAINT `recetas_medicamentoId_fkey` FOREIGN KEY (`medicamentoId`) REFERENCES `medicamentos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cobertura_medicamentos` ADD CONSTRAINT `cobertura_medicamentos_obraSocialId_fkey` FOREIGN KEY (`obraSocialId`) REFERENCES `obras_sociales`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cobertura_medicamentos` ADD CONSTRAINT `cobertura_medicamentos_medicamentoId_fkey` FOREIGN KEY (`medicamentoId`) REFERENCES `medicamentos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
