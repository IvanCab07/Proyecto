-- Vencimiento de receta obligatorio.
--
-- Hasta ahora `validoHasta` era NULL-able y una receta emitida sin fecha no vencía nunca,
-- así que el paciente no tenía forma de saber si todavía servía. El backfill le da 30 días
-- desde la emisión a las recetas históricas: es el mismo default que aplica el controller
-- cuando el emisor no manda la fecha.
--
-- El UPDATE tiene que ir ANTES del MODIFY: si quedara una sola fila en NULL, el NOT NULL falla.

-- Backfill
UPDATE `recetas`
  SET `validoHasta` = DATE_ADD(`fechaEmision`, INTERVAL 30 DAY)
  WHERE `validoHasta` IS NULL;

-- AlterTable
ALTER TABLE `recetas` MODIFY `validoHasta` DATETIME(3) NOT NULL;
