-- Migration: Commission requests + attachments (reemplaza comision_retiros)
-- Fecha: 2025-12-02

BEGIN;

-- 1) Renombrar tabla anterior (si existía) para preservar datos temporales
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'freeler'
      AND table_name = 'comision_retiros'
  ) THEN
    ALTER TABLE freeler.comision_retiros RENAME TO comision_solicitudes_tmp;
  END IF;
END $$;

-- 2) Nueva tabla de solicitudes (una por comisión/lead)
CREATE TABLE IF NOT EXISTS freeler.comision_solicitudes (
  id_solicitud        SERIAL PRIMARY KEY,
  id_comision         INTEGER NOT NULL,
  id_usuario_freeler  INTEGER NOT NULL,
  metodo_pago         VARCHAR(20) NOT NULL CHECK (metodo_pago IN ('yape','transferencia','plin')),
  datos_pago          JSONB,
  estado              VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                      CHECK (estado IN ('pendiente','pagada','rechazada')),
  fecha_solicitud     TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_resolucion    TIMESTAMP WITHOUT TIME ZONE,
  aprobado_por        INTEGER,
  notas_admin         TEXT
);

DO $$
BEGIN
  BEGIN
    ALTER TABLE freeler.comision_solicitudes
      ADD CONSTRAINT comision_solicitudes_id_comision_fkey
      FOREIGN KEY (id_comision)
      REFERENCES freeler.comisiones (id_comision)
      ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER TABLE freeler.comision_solicitudes
      ADD CONSTRAINT comision_solicitudes_id_usuario_freeler_fkey
      FOREIGN KEY (id_usuario_freeler)
      REFERENCES freeler.usuario_freeler (id_usuario_freeler)
      ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER TABLE freeler.comision_solicitudes
      ADD CONSTRAINT comision_solicitudes_aprobado_por_fkey
      FOREIGN KEY (aprobado_por)
      REFERENCES freeler.usuarios_empresa (id_usuario_empresa);
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- 3) Relacionar comisiones con su solicitud
ALTER TABLE freeler.comisiones
  ADD COLUMN IF NOT EXISTS id_solicitud INTEGER;

DO $$
BEGIN
  BEGIN
    ALTER TABLE freeler.comisiones
      ADD CONSTRAINT comisiones_id_solicitud_fkey
        FOREIGN KEY (id_solicitud) REFERENCES freeler.comision_solicitudes (id_solicitud);
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- 4) Tabla para adjuntos/evidencias
CREATE TABLE IF NOT EXISTS freeler.comision_solicitud_adjuntos (
  id_adjunto   SERIAL PRIMARY KEY,
  id_solicitud INTEGER NOT NULL REFERENCES freeler.comision_solicitudes (id_solicitud) ON DELETE CASCADE,
  tipo         VARCHAR(30),
  url_archivo  TEXT,
  codigo_pago  VARCHAR(80),
  descripcion  TEXT,
  subido_por   INTEGER REFERENCES freeler.usuarios_empresa (id_usuario_empresa),
  fecha_subida TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- 5) Migrar datos desde la tabla temporal (solo si existía)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'freeler'
      AND table_name = 'comision_solicitudes_tmp'
  ) THEN
    INSERT INTO freeler.comision_solicitudes (
      id_comision,
      id_usuario_freeler,
      metodo_pago,
      datos_pago,
      estado,
      fecha_solicitud,
      fecha_resolucion
    )
    SELECT
      id_comision,
      id_usuario_freeler,
      metodo_pago,
      detalles,
      CASE
        WHEN estado = 'pagado' THEN 'pagada'
        ELSE estado
      END AS estado,
      fecha_solicitud,
      fecha_resolucion
    FROM freeler.comision_solicitudes_tmp;

    DROP TABLE freeler.comision_solicitudes_tmp;
  END IF;
END $$;

COMMIT;
e