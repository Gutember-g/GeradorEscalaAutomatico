package br.com.gutemberg.meuprojeto.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public class DisponibilidadeDTO {
    private Long eventoId;
    private String nomeEvento;
    private LocalDate data;
    private LocalTime horaInicio;
    private boolean indisponivel;

    public DisponibilidadeDTO() {
    }

    public DisponibilidadeDTO(Long eventoId, String nomeEvento, LocalDate data, LocalTime horaInicio, boolean indisponivel) {
        this.eventoId = eventoId;
        this.nomeEvento = nomeEvento;
        this.data = data;
        this.horaInicio = horaInicio;
        this.indisponivel = indisponivel;
    }

    public Long getEventoId() {
        return eventoId;
    }

    public void setEventoId(Long eventoId) {
        this.eventoId = eventoId;
    }

    public String getNomeEvento() {
        return nomeEvento;
    }

    public void setNomeEvento(String nomeEvento) {
        this.nomeEvento = nomeEvento;
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

    public boolean isIndisponivel() {
        return indisponivel;
    }

    public void setIndisponivel(boolean indisponivel) {
        this.indisponivel = indisponivel;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long eventoId;
        private String nomeEvento;
        private LocalDate data;
        private LocalTime horaInicio;
        private boolean indisponivel;

        public Builder eventoId(Long eventoId) {
            this.eventoId = eventoId;
            return this;
        }

        public Builder nomeEvento(String nomeEvento) {
            this.nomeEvento = nomeEvento;
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

        public Builder indisponivel(boolean indisponivel) {
            this.indisponivel = indisponivel;
            return this;
        }

        public DisponibilidadeDTO build() {
            return new DisponibilidadeDTO(eventoId, nomeEvento, data, horaInicio, indisponivel);
        }
    }
}
