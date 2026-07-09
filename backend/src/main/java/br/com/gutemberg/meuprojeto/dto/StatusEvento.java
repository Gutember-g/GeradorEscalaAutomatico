package br.com.gutemberg.meuprojeto.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public class StatusEvento {
    private Long eventoId;
    private String nome; // Nome do evento / programação paroquial
    private LocalDate data;
    private LocalTime horaInicio;
    private String corLiturgica;
    private int vagasNecessarias;
    private int vagasPreenchidas;
    private String status; // TOTALMENTE_PREENCHIDO, PARCIALMENTE_PREENCHIDO, NAO_PREENCHIDO
    private String motivo; // Ex: "Sem colaboradores disponíveis" ou "OK"
    private List<String> ministros; // Lista de nomes dos colaboradores escalados

    public StatusEvento() {
    }

    public StatusEvento(Long eventoId, String nome, LocalDate data, LocalTime horaInicio, String corLiturgica, int vagasNecessarias, int vagasPreenchidas, String status, String motivo, List<String> ministros) {
        this.eventoId = eventoId;
        this.nome = nome;
        this.data = data;
        this.horaInicio = horaInicio;
        this.corLiturgica = corLiturgica;
        this.vagasNecessarias = vagasNecessarias;
        this.vagasPreenchidas = vagasPreenchidas;
        this.status = status;
        this.motivo = motivo;
        this.ministros = ministros;
    }

    public Long getEventoId() {
        return eventoId;
    }

    public void setEventoId(Long eventoId) {
        this.eventoId = eventoId;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public LocalDate getData() {
        return data;
    }

    public void setData(LocalDate data) {
        this.data = data;
    }

    public LocalTime getHoraInicio() {
        return horaInicio;
    }

    public void setHoraInicio(LocalTime horaInicio) {
        this.horaInicio = horaInicio;
    }

    public String getCorLiturgica() {
        return corLiturgica;
    }

    public void setCorLiturgica(String corLiturgica) {
        this.corLiturgica = corLiturgica;
    }

    public int getVagasNecessarias() {
        return vagasNecessarias;
    }

    public void setVagasNecessarias(int vagasNecessarias) {
        this.vagasNecessarias = vagasNecessarias;
    }

    public int getVagasPreenchidas() {
        return vagasPreenchidas;
    }

    public void setVagasPreenchidas(int vagasPreenchidas) {
        this.vagasPreenchidas = vagasPreenchidas;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }

    public List<String> getMinistros() {
        return ministros;
    }

    public void setMinistros(List<String> ministros) {
        this.ministros = ministros;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long eventoId;
        private String nome;
        private LocalDate data;
        private LocalTime horaInicio;
        private String corLiturgica;
        private int vagasNecessarias;
        private int vagasPreenchidas;
        private String status;
        private String motivo;
        private List<String> ministros;

        public Builder eventoId(Long eventoId) {
            this.eventoId = eventoId;
            return this;
        }

        public Builder nome(String nome) {
            this.nome = nome;
            return this;
        }

        public Builder data(LocalDate data) {
            this.data = data;
            return this;
        }

        public Builder horaInicio(LocalTime horaInicio) {
            this.horaInicio = horaInicio;
            return this;
        }

        public Builder corLiturgica(String corLiturgica) {
            this.corLiturgica = corLiturgica;
            return this;
        }

        public Builder vagasNecessarias(int vagasNecessarias) {
            this.vagasNecessarias = vagasNecessarias;
            return this;
        }

        public Builder vagasPreenchidas(int vagasPreenchidas) {
            this.vagasPreenchidas = vagasPreenchidas;
            return this;
        }

        public Builder status(String status) {
            this.status = status;
            return this;
        }

        public Builder motivo(String motivo) {
            this.motivo = motivo;
            return this;
        }

        public Builder ministros(List<String> ministros) {
            this.ministros = ministros;
            return this;
        }

        public StatusEvento build() {
            return new StatusEvento(eventoId, nome, data, horaInicio, corLiturgica, vagasNecessarias, vagasPreenchidas, status, motivo, ministros);
        }
    }
}
