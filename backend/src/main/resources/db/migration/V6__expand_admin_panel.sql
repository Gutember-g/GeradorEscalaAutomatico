-- 1. Colunas adicionais para Organizacoes e Usuarios (Soft Delete, Planos e Session Control)
ALTER TABLE organizacoes ADD COLUMN deletado_em TIMESTAMP;
ALTER TABLE organizacoes ADD COLUMN plano VARCHAR(50) NOT NULL DEFAULT 'GRATUITO';
ALTER TABLE organizacoes ADD COLUMN observacoes TEXT;

ALTER TABLE usuarios ADD COLUMN deletado_em TIMESTAMP;
ALTER TABLE usuarios ADD COLUMN token_version INT NOT NULL DEFAULT 1;

-- 2. Tabela para Permissões Delegadas (ROLE_ADMIN_DELEGADO)
CREATE TABLE permissoes_delegadas (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    modulo VARCHAR(50) NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT unique_usuario_modulo UNIQUE (usuario_id, modulo)
);

-- 3. Tabela para Logs de Auditoria
CREATE TABLE logs_auditoria (
    id BIGSERIAL PRIMARY KEY,
    admin_id BIGINT,
    admin_nome VARCHAR(255) NOT NULL,
    acao VARCHAR(255) NOT NULL,
    entidade_afetada VARCHAR(255) NOT NULL,
    entidade_id BIGINT,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    detalhes TEXT
);

-- Criar índices de busca rápida
CREATE INDEX idx_logs_auditoria_admin ON logs_auditoria(admin_id);
CREATE INDEX idx_logs_auditoria_timestamp ON logs_auditoria(timestamp);
CREATE INDEX idx_permissoes_delegadas_user ON permissoes_delegadas(usuario_id);
