package br.com.gutemberg.meuprojeto.dto;

import java.util.ArrayList;
import java.util.List;

public class RelatorioGeracao {
    private Long escalaId;
    private String nomeEscala;
    private int totalVagas;
    private int vagasPreenchidas;
    private int vagasRestantes;
    private List<StatusEvento> statusEventos = new ArrayList<>();

    public RelatorioGeracao() {
    }

    public RelatorioGeracao(Long escalaId, String nomeEscala, int totalVagas, int vagasPreenchidas, int vagasRestantes, List<StatusEvento> statusEventos) {
        this.escalaId = escalaId;
        this.nomeEscala = nomeEscala;
        this.totalVagas = totalVagas;
        this.vagasPreenchidas = vagasPreenchidas;
        this.vagasRestantes = vagasRestantes;
        this.statusEventos = statusEventos != null ? statusEventos : new ArrayList<>();
    }

    public Long getEscalaId() {
        return escalaId;
    }

    public void setEscalaId(Long escalaId) {
        this.escalaId = escalaId;
    }

    public String getNomeEscala() {
        return nomeEscala;
    }

    public void setNomeEscala(String nomeEscala) {
        this.nomeEscala = nomeEscala;
    }

    public int getTotalVagas() {
        return totalVagas;
    }

    public void setTotalVagas(int totalVagas) {
        this.totalVagas = totalVagas;
    }

    public int getVagasPreenchidas() {
        return vagasPreenchidas;
    }

    public void setVagasPreenchidas(int vagasPreenchidas) {
        this.vagasPreenchidas = vagasPreenchidas;
    }

    public int getVagasRestantes() {
        return vagasRestantes;
    }

    public void setVagasRestantes(int vagasRestantes) {
        this.vagasRestantes = vagasRestantes;
    }

    public List<StatusEvento> getStatusEventos() {
        return statusEventos;
    }

    public void setStatusEventos(List<StatusEvento> statusEventos) {
        this.statusEventos = statusEventos != null ? statusEventos : new ArrayList<>();
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long escalaId;
        private String nomeEscala;
        private int totalVagas;
        private int vagasPreenchidas;
        private int vagasRestantes;
        private List<StatusEvento> statusEventos = new ArrayList<>();

        public Builder escalaId(Long escalaId) {
            this.escalaId = escalaId;
            return this;
        }

        public Builder nomeEscala(String nomeEscala) {
            this.nomeEscala = nomeEscala;
            return this;
        }

        public Builder totalVagas(int totalVagas) {
            this.totalVagas = totalVagas;
            return this;
        }

        public Builder vagasPreenchidas(int vagasPreenchidas) {
            this.vagasPreenchidas = vagasPreenchidas;
            return this;
        }

        public Builder vagasRestantes(int vagasRestantes) {
            this.vagasRestantes = vagasRestantes;
            return this;
        }

        public Builder statusEventos(List<StatusEvento> statusEventos) {
            this.statusEventos = statusEventos;
            return this;
        }

        public RelatorioGeracao build() {
            return new RelatorioGeracao(escalaId, nomeEscala, totalVagas, vagasPreenchidas, vagasRestantes, statusEventos);
        }
    }
}
