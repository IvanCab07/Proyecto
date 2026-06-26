-- AlterTable
ALTER TABLE `recetas` ADD COLUMN `validoHasta` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `turnos` ADD COLUMN `diagnostico` VARCHAR(191) NULL,
    ADD COLUMN `razonCancelacion` VARCHAR(191) NULL;
