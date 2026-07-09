-- 1. Remover tabelas antigas de indisponibilidade
DROP TABLE IF EXISTS colaborador_indisponibilidades CASCADE;
DROP TABLE IF EXISTS colaborador_indisponibilidade_intervalos CASCADE;

-- 2. Limpar colunas em colaboradores
ALTER TABLE colaboradores DROP COLUMN IF EXISTS email;
ALTER TABLE colaboradores DROP COLUMN IF EXISTS cargo;

-- 3. Ajustar colunas em eventos
ALTER TABLE eventos DROP COLUMN IF EXISTS hora_fim;
ALTER TABLE eventos ADD COLUMN nome VARCHAR(255) NOT NULL DEFAULT 'Plantão';

-- 4. Criar tabela de disponibilidades por colaborador + evento
CREATE TABLE disponibilidades (
    id BIGSERIAL PRIMARY KEY,
    colaborador_id BIGINT NOT NULL,
    evento_id BIGINT NOT NULL,
    mes INT NOT NULL,
    ano INT NOT NULL,
    indisponivel BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE,
    FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE,
    CONSTRAINT unique_colaborador_evento UNIQUE (colaborador_id, evento_id)
);
