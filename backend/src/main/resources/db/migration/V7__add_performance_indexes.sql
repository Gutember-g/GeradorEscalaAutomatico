-- 1. Índice composto para busca rápida de disponibilidade por colaborador, mês e ano
CREATE INDEX IF NOT EXISTS idx_disponibilidades_lookup 
ON disponibilidades(organizacao_id, colaborador_id, mes, ano);

-- 2. Índice composto para busca de eventos por organização e faixa de datas
CREATE INDEX IF NOT EXISTS idx_eventos_org_data 
ON eventos(organizacao_id, data);

-- 3. Índices diretos para alocações por evento e colaborador
CREATE INDEX IF NOT EXISTS idx_alocacoes_evento 
ON alocacoes(evento_id);

CREATE INDEX IF NOT EXISTS idx_alocacoes_colab 
ON alocacoes(colaborador_id);
