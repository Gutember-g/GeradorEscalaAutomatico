-- Alteração de eventos: trocar local_setor por cor_liturgica
ALTER TABLE eventos DROP COLUMN IF EXISTS local_setor;
ALTER TABLE eventos ADD COLUMN cor_liturgica VARCHAR(50);
