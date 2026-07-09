-- 1. Criar a tabela de organizações
CREATE TABLE organizacoes (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    data_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ativo BOOLEAN NOT NULL DEFAULT TRUE
);

-- 2. Criar a tabela de usuários
CREATE TABLE usuarios (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    organizacao_id BIGINT,
    FOREIGN KEY (organizacao_id) REFERENCES organizacoes(id) ON DELETE SET NULL
);

-- 3. Inserir uma organização legado padrão
INSERT INTO organizacoes (nome, ativo) VALUES ('Paróquia Legada', TRUE);

-- 4. Adicionar coluna organizacao_id nas tabelas existentes como opcional
ALTER TABLE colaboradores ADD COLUMN organizacao_id BIGINT;
ALTER TABLE eventos ADD COLUMN organizacao_id BIGINT;
ALTER TABLE escalas ADD COLUMN organizacao_id BIGINT;
ALTER TABLE disponibilidades ADD COLUMN organizacao_id BIGINT;

-- 5. Vincular registros existentes à organização legado
UPDATE colaboradores SET organizacao_id = (SELECT MIN(id) FROM organizacoes);
UPDATE eventos SET organizacao_id = (SELECT MIN(id) FROM organizacoes);
UPDATE escalas SET organizacao_id = (SELECT MIN(id) FROM organizacoes);
UPDATE disponibilidades SET organizacao_id = (SELECT MIN(id) FROM organizacoes);

-- 6. Tornar a coluna NOT NULL e adicionar FK com índice para performance
ALTER TABLE colaboradores ALTER COLUMN organizacao_id SET NOT NULL;
ALTER TABLE colaboradores ADD FOREIGN KEY (organizacao_id) REFERENCES organizacoes(id) ON DELETE CASCADE;
CREATE INDEX idx_colaboradores_org ON colaboradores(organizacao_id);

ALTER TABLE eventos ALTER COLUMN organizacao_id SET NOT NULL;
ALTER TABLE eventos ADD FOREIGN KEY (organizacao_id) REFERENCES organizacoes(id) ON DELETE CASCADE;
CREATE INDEX idx_eventos_org ON eventos(organizacao_id);

ALTER TABLE escalas ALTER COLUMN organizacao_id SET NOT NULL;
ALTER TABLE escalas ADD FOREIGN KEY (organizacao_id) REFERENCES organizacoes(id) ON DELETE CASCADE;
CREATE INDEX idx_escalas_org ON escalas(organizacao_id);

ALTER TABLE disponibilidades ALTER COLUMN organizacao_id SET NOT NULL;
ALTER TABLE disponibilidades ADD FOREIGN KEY (organizacao_id) REFERENCES organizacoes(id) ON DELETE CASCADE;
CREATE INDEX idx_disponibilidades_org ON disponibilidades(organizacao_id);

-- 7. Inserir super admin default (senha: admin123)
INSERT INTO usuarios (nome, email, senha, role, organizacao_id) 
VALUES ('Super Admin', 'admin@escalafacil.com', '$2a$10$SiKH4dwFSfU/wQFTKxG0M.5a8APF8mAYHNBgp6ko2xu8SF./FcgHq', 'SUPER_ADMIN', NULL);
