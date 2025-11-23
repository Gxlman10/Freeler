-- Migration: Commission payout workflow + catalog refresh
-- Fecha: 2025-11-09
-- Nota: No elimina ni altera datos existentes de usuarios, campañas o leads.

BEGIN;

-- 1) Semillas/actualización del catálogo de estados de comisión
INSERT INTO freeler.estado_comisiones (id_estado_comision, nombre, descripcion)
VALUES
  (1, 'Pendiente', 'Comisión generada automáticamente (saldo disponible).'),
  (2, 'Solicitada', 'El freeler solicitó el retiro por algún medio de pago.'),
  (3, 'Pagada', 'La comisión fue liquidada por el equipo administrativo.')
ON CONFLICT (id_estado_comision)
DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion;

-- Garantiza que las comisiones históricas sin estado definido queden en “Pendiente”.
UPDATE freeler.comisiones
SET id_estado_comision = 1
WHERE id_estado_comision IS NULL;

-- 2) Tabla para solicitudes de retiro / pagos planificados
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'freeler'
      AND table_name = 'comision_retiros'
  ) THEN
    CREATE TABLE freeler.comision_retiros (
      id_retiro            SERIAL PRIMARY KEY,
      id_comision          INTEGER NOT NULL,
      id_usuario_freeler   INTEGER NOT NULL,
      monto                NUMERIC(10,2) NOT NULL,
      metodo_pago          VARCHAR(20) NOT NULL,
      detalles             JSONB,
      estado               VARCHAR(20) NOT NULL DEFAULT 'pendiente',
      fecha_solicitud      TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      fecha_resolucion     TIMESTAMP WITHOUT TIME ZONE,
      CONSTRAINT comision_retiros_metodo_chk
        CHECK (metodo_pago IN ('yape', 'transferencia')),
      CONSTRAINT comision_retiros_estado_chk
        CHECK (estado IN ('pendiente', 'pagado', 'cancelado'))
    );
  END IF;
END $$;

-- 3) Llaves foráneas (condicionales para evitar duplicados al re-ejecutar)
DO $$
BEGIN
  BEGIN
    ALTER TABLE freeler.comision_retiros
      ADD CONSTRAINT comision_retiros_id_comision_fkey
      FOREIGN KEY (id_comision)
      REFERENCES freeler.comisiones (id_comision);
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER TABLE freeler.comision_retiros
      ADD CONSTRAINT comision_retiros_id_usuario_freeler_fkey
      FOREIGN KEY (id_usuario_freeler)
      REFERENCES freeler.usuario_freeler (id_usuario_freeler);
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;

COMMIT;
