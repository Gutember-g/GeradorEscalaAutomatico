-- G7: Índice para busca reversa na coluna outro_colaborador_id
-- Sem esse índice, a query de reciprocidade faz Seq Scan em ambas as tabelas.
-- Com ele, o lookup reverso "quem tem X na lista NTC/PTC" passa de O(N) para O(log N).

-- Índice reverso em colaborador_nao_trabalhar_com
CREATE INDEX IF NOT EXISTS idx_ntc_outro_colaborador
ON colaborador_nao_trabalhar_com(outro_colaborador_id);

-- Índice reverso em colaborador_preferencia_trabalhar_com
CREATE INDEX IF NOT EXISTS idx_ptc_outro_colaborador
ON colaborador_preferencia_trabalhar_com(outro_colaborador_id);

-- Índice adicional para o endpoint GET /api/alocacoes?mes=&ano=
-- Permite filtrar alocações por organizacao_id + data do evento sem Seq Scan
CREATE INDEX IF NOT EXISTS idx_eventos_org_id
ON eventos(organizacao_id);
