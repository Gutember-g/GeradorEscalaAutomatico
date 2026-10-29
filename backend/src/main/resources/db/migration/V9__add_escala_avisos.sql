CREATE TABLE IF NOT EXISTS escala_avisos (
    escala_id BIGINT NOT NULL,
    aviso VARCHAR(1000) NOT NULL,
    CONSTRAINT fk_escala_avisos_escala FOREIGN KEY (escala_id) REFERENCES escalas (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_escala_avisos_escala_id ON escala_avisos(escala_id);
