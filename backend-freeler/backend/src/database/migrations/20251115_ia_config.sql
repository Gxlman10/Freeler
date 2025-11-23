-- Migration: Tabla de configuración para IA y valores por defecto
-- Fecha: 2025-11-15

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'freeler'
      AND table_name = 'ia_config'
  ) THEN
    CREATE TABLE freeler.ia_config (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      api_key text,
      provider varchar(50) NOT NULL DEFAULT 'openai',
      model varchar(120) NOT NULL DEFAULT 'gpt-3.5-turbo',
      base_prompt text NOT NULL,
      temperature numeric(4,2) NOT NULL DEFAULT 0.35,
      guidance numeric(4,2) NOT NULL DEFAULT 0.60,
      max_tokens int NOT NULL DEFAULT 600,
      updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    INSERT INTO freeler.ia_config (api_key, base_prompt)
    VALUES (
      NULL,
      'Eres Freeler Coach, un asistente especializado en capacitar a usuarias y usuarios referidores para atraer leads de calidad y aprender a vender las campañas disponibles.'
    );
  END IF;
END $$;

COMMIT;
