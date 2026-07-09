CREATE TABLE colaborador_nao_trabalhar_com (
    colaborador_id BIGINT NOT NULL,
    outro_colaborador_id BIGINT NOT NULL,
    PRIMARY KEY (colaborador_id, outro_colaborador_id),
    FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE,
    FOREIGN KEY (outro_colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE
);

CREATE TABLE colaborador_preferencia_trabalhar_com (
    colaborador_id BIGINT NOT NULL,
    outro_colaborador_id BIGINT NOT NULL,
    PRIMARY KEY (colaborador_id, outro_colaborador_id),
    FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE,
    FOREIGN KEY (outro_colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE
);
