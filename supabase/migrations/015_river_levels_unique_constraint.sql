-- Migration 015: Add UNIQUE constraint on river_levels (station_id, recorded_at)
-- Purpose: Deduplicate historical readings and enforce strict idempotency at database level

-- 1. Deduplicar registros existentes mantendo apenas a leitura mais antiga/original
DELETE FROM river_levels r1
USING river_levels r2
WHERE r1.station_id = r2.station_id
  AND r1.recorded_at = r2.recorded_at
  AND r1.id > r2.id;

-- 2. Adicionar constraint UNIQUE se ainda não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'river_levels_station_recorded_unique'
    ) THEN
        ALTER TABLE river_levels
        ADD CONSTRAINT river_levels_station_recorded_unique UNIQUE (station_id, recorded_at);
        RAISE NOTICE 'Constraint UNIQUE river_levels_station_recorded_unique criada com sucesso.';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Aviso ao criar constraint UNIQUE: %', SQLERRM;
END $$;
