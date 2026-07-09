package br.com.gutemberg.meuprojeto.dto;

public class AlocacaoDTO {
    private Long id;
    private Long eventoId;
    private Long colaboradorId;
    private String colaboradorNome;
    private String colaboradorTelefone;

    public AlocacaoDTO() {
    }

    public AlocacaoDTO(Long id, Long eventoId, Long colaboradorId, String colaboradorNome, String colaboradorTelefone) {
        this.id = id;
        this.eventoId = eventoId;
        this.colaboradorId = colaboradorId;
        this.colaboradorNome = colaboradorNome;
        this.colaboradorTelefone = colaboradorTelefone;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getEventoId() {
        return eventoId;
    }

    public void setEventoId(Long eventoId) {
        this.eventoId = eventoId;
    }

    public Long getColaboradorId() {
        return colaboradorId;
    }

    public void setColaboradorId(Long colaboradorId) {
        this.colaboradorId = colaboradorId;
    }

    public String getColaboradorNome() {
        return colaboradorNome;
    }

    public void setColaboradorNome(String colaboradorNome) {
        this.colaboradorNome = colaboradorNome;
    }

    public String getColaboradorTelefone() {
        return colaboradorTelefone;
    }

    public void setColaboradorTelefone(String colaboradorTelefone) {
        this.colaboradorTelefone = colaboradorTelefone;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private Long eventoId;
        private Long colaboradorId;
        private String colaboradorNome;
        private String colaboradorTelefone;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder eventoId(Long eventoId) {
            this.eventoId = eventoId;
            return this;
        }

        public Builder colaboradorId(Long colaboradorId) {
            this.colaboradorId = colaboradorId;
            return this;
        }

        public Builder colaboradorNome(String colaboradorNome) {
            this.colaboradorNome = colaboradorNome;
            return this;
        }

        public Builder colaboradorTelefone(String colaboradorTelefone) {
            this.colaboradorTelefone = colaboradorTelefone;
            return this;
        }

        public AlocacaoDTO build() {
            return new AlocacaoDTO(id, eventoId, colaboradorId, colaboradorNome, colaboradorTelefone);
        }
    }
}
