-- Migration: Actualiza catálogo de estados de lead con nuevas etapas comerciales
-- Fecha: 2025-12-05

BEGIN;

-- 1) Catálogo definitivo en una tabla temporal para evitar conflictos al reinsertar.
CREATE TEMP TABLE tmp_estado_lead (
  id_estado_lead integer PRIMARY KEY,
  nombre text NOT NULL,
  descripcion text NOT NULL
);

INSERT INTO tmp_estado_lead (id_estado_lead, nombre, descripcion)
VALUES
  (1, 'Pendiente', 'Lead recién registrado, pendiente de revisión.'),
  (2, 'Asignado', 'Lead asignado a un vendedor.'),
  (3, 'Contactado', 'El vendedor logró hacer el primer contacto.'),
  (4, 'En gestion', 'Lead en seguimiento activo por el vendedor.'),
  (5, 'Perdido', 'Lead descartado por falta de interés u otros motivos.'),
  (6, 'Ganado', 'Lead convertido exitosamente en venta.'),
  (7, 'Volver a llamar', 'Lead que requiere reintentar el contacto más adelante.'),
  (8, 'Cita pendiente', 'Lead con una cita o reunión programada.'),
  (9, 'Cita concretada', 'Lead con cita realizada y en evaluación.'),
  (10, 'No contesta', 'Lead que no responde llamadas ni mensajes.'),
  (11, 'Seguimiento', 'Lead que continúa en observación hasta nueva acción.'),
  (12, 'Otro producto', 'Lead interesado en un producto diferente al actual.'),
  (13, 'No desea', 'Lead que indicó que no desea continuar.'),
  (14, 'No califica', 'Lead que no cumple los requisitos mínimos.'),
  (15, 'Otros (no catalogados)', 'Lead con estado especial pendiente de clasificación.');

-- 2) Reasigna estados antiguos a la categoría genérica antes de limpiar el catálogo,
--    evitando errores por llaves foráneas.
UPDATE freeler.leads
SET id_estado_lead = 15
WHERE id_estado_lead IS NOT NULL
  AND id_estado_lead NOT IN (SELECT id_estado_lead FROM tmp_estado_lead);

-- Si existen otras tablas que referencian estado_lead (historial, auditorías, etc.),
-- agregar aquí bloques similares para reasignar a 15 antes de eliminar.

-- 3) Elimina las filas heredadas que no pertenecen al nuevo catálogo.
DELETE FROM freeler.estado_lead
WHERE id_estado_lead NOT IN (SELECT id_estado_lead FROM tmp_estado_lead);

-- 4) Inserta o actualiza los registros definitivos.
INSERT INTO freeler.estado_lead (id_estado_lead, nombre, descripcion)
SELECT id_estado_lead, nombre, descripcion
FROM tmp_estado_lead
ON CONFLICT (id_estado_lead)
DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion;

DROP TABLE IF EXISTS tmp_estado_lead;

COMMIT;
