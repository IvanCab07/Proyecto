-- AlterTable
ALTER TABLE `notifications` MODIFY `type` ENUM('TURNO_SOLICITADO', 'TURNO_CONFIRMADO', 'TURNO_CANCELADO', 'TURNO_COMPLETADO', 'RECETA_NUEVA', 'SOBRETURNO_SOLICITADO', 'SOBRETURNO_ASIGNADO') NOT NULL;

-- AlterTable
ALTER TABLE `turnos` ADD COLUMN `esSobreturno` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `status` ENUM('PENDIENTE', 'CONFIRMADO', 'CANCELADO', 'COMPLETADO', 'EN_ESPERA', 'AUSENTE') NOT NULL DEFAULT 'PENDIENTE';

-- AlterTable
ALTER TABLE `users` ADD COLUMN `puedeCalificar` BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE `calificaciones` (
    `id` VARCHAR(191) NOT NULL,
    `turnoId` VARCHAR(191) NOT NULL,
    `pacienteId` VARCHAR(191) NOT NULL,
    `medicoId` VARCHAR(191) NOT NULL,
    `estrellas` INTEGER NOT NULL,
    `comentario` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `calificaciones_turnoId_key`(`turnoId`),
    INDEX `calificaciones_medicoId_idx`(`medicoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `calificaciones` ADD CONSTRAINT `calificaciones_turnoId_fkey` FOREIGN KEY (`turnoId`) REFERENCES `turnos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `calificaciones` ADD CONSTRAINT `calificaciones_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `calificaciones` ADD CONSTRAINT `calificaciones_medicoId_fkey` FOREIGN KEY (`medicoId`) REFERENCES `medicos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
