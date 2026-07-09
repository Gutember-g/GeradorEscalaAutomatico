CREATE TABLE colaboradores (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(50),
    email VARCHAR(255),
    cargo VARCHAR(100)
);

CREATE TABLE colaborador_indisponibilidades (
    colaborador_id BIGINT NOT NULL,
    data DATE NOT NULL,
    FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE,
    PRIMARY KEY (colaborador_id, data)
);

CREATE TABLE colaborador_indisponibilidade_intervalos (
    id BIGSERIAL PRIMARY KEY,
    colaborador_id BIGINT NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE
);

CREATE TABLE escalas (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL
);

CREATE TABLE eventos (
    id BIGSERIAL PRIMARY KEY,
    escala_id BIGINT,
    data DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    vagas_necessarias INT NOT NULL DEFAULT 1,
    local_setor VARCHAR(100),
    FOREIGN KEY (escala_id) REFERENCES escalas(id) ON DELETE SET NULL
);

CREATE TABLE alocacoes (
    id BIGSERIAL PRIMARY KEY,
    escala_id BIGINT NOT NULL,
    evento_id BIGINT NOT NULL,
    colaborador_id BIGINT NOT NULL,
    FOREIGN KEY (escala_id) REFERENCES escalas(id) ON DELETE CASCADE,
    FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE,
    FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE,
    CONSTRAINT unique_alocacao UNIQUE (escala_id, evento_id, colaborador_id)
);
