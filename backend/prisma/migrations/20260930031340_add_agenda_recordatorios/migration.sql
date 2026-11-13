-- CreateTable
CREATE TABLE `recordatorios_salud` (
    `id` VARCHAR(191) NOT NULL,
    `pacienteId` VARCHAR(191) NOT NULL,
    `recetaId` VARCHAR(191) NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `tipo` ENUM('MEDICAMENTO', 'TRATAMIENTO') NOT NULL DEFAULT 'MEDICAMENTO',
    `dosis` VARCHAR(191) NULL,
    `instrucciones` TEXT NULL,
    `horarios` JSON NOT NULL,
    `fechaInicio` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fechaFin` DATETIME(3) NULL,
    `diasSemana` JSON NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `recordatorios_salud_pacienteId_activo_idx`(`pacienteId`, `activo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `registros_tomas` (
    `id` VARCHAR(191) NOT NULL,
    `recordatorioId` VARCHAR(191) NOT NULL,
    `pacienteId` VARCHAR(191) NOT NULL,
    `fechaProgramada` DATETIME(3) NOT NULL,
    `fechaRealizada` DATETIME(3) NULL,
    `estado` ENUM('PENDIENTE', 'TOMADO', 'OMITIDO', 'POSPUESTO') NOT NULL DEFAULT 'PENDIENTE',
    `notas` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `registros_tomas_pacienteId_fechaProgramada_idx`(`pacienteId`, `fechaProgramada`),
    INDEX `registros_tomas_recordatorioId_fechaProgramada_idx`(`recordatorioId`, `fechaProgramada`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `recordatorios_salud` ADD CONSTRAINT `recordatorios_salud_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recordatorios_salud` ADD CONSTRAINT `recordatorios_salud_recetaId_fkey` FOREIGN KEY (`recetaId`) REFERENCES `recetas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registros_tomas` ADD CONSTRAINT `registros_tomas_recordatorioId_fkey` FOREIGN KEY (`recordatorioId`) REFERENCES `recordatorios_salud`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registros_tomas` ADD CONSTRAINT `registros_tomas_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
