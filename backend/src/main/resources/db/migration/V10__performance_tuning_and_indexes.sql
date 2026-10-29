-- V10: Índices adicionais e tuning para redução de latência
-- Otimiza busca de eventos por período, listagem de escalas e junções de disponibilidade/alocações

-- 1. Índice composto para eventos por organização, data e horaInicio
CREATE INDEX IF NOT EXISTS idx_eventos_org_data_hora 
ON eventos(organizacao_id, data, hora_inicio);

-- 2. Índice composto para escalas por organização e período
CREATE INDEX IF NOT EXISTS idx_escalas_org_datas 
ON escalas(organizacao_id, data_inicio, data_fim);

-- 3. Índice composto para alocações por evento e colaborador
CREATE INDEX IF NOT EXISTS idx_alocacoes_evento_colab 
ON alocacoes(evento_id, colaborador_id);

-- 4. Índice para busca de disponibilidades por organização e evento
CREATE INDEX IF NOT EXISTS idx_disponibilidades_org_evento 
ON disponibilidades(organizacao_id, evento_id);
