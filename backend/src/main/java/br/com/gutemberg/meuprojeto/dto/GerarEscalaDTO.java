package br.com.gutemberg.meuprojeto.dto;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class GerarEscalaDTO {
    @NotBlank(message = "Nome da escala é obrigatório")
    private String nomeEscala;

    @NotNull(message = "Data de início da escala é obrigatória")
    private LocalDate dataInicio;

    @NotNull(message = "Data de fim da escala é obrigatória")
    private LocalDate dataFim;

    private List<Long> colaboradorIds = new ArrayList<>();

    @NotNull(message = "Lista de eventos a preencher não pode ser nula")
    @Valid
    private List<EventoDTO> eventos = new ArrayList<>();

    public GerarEscalaDTO() {
    }

    public GerarEscalaDTO(String nomeEscala, LocalDate dataInicio, LocalDate dataFim, List<Long> colaboradorIds, List<EventoDTO> eventos) {
        this.nomeEscala = nomeEscala;
        this.dataInicio = dataInicio;
        this.dataFim = dataFim;
        this.colaboradorIds = colaboradorIds != null ? colaboradorIds : new ArrayList<>();
        this.eventos = eventos != null ? eventos : new ArrayList<>();
    }

    public String getNomeEscala() {
        return nomeEscala;
    }

    public void setNomeEscala(String nomeEscala) {
        this.nomeEscala = nomeEscala;
    }

    public LocalDate getDataInicio() {
        return dataInicio;
    }

    public void setDataInicio(LocalDate dataInicio) {
        this.dataInicio = dataInicio;
    }

    public LocalDate getDataFim() {
        return dataFim;
    }

    public void setDataFim(LocalDate dataFim) {
        this.dataFim = dataFim;
    }

    public List<Long> getColaboradorIds() {
        return colaboradorIds;
    }

    public void setColaboradorIds(List<Long> colaboradorIds) {
        this.colaboradorIds = colaboradorIds != null ? colaboradorIds : new ArrayList<>();
    }

    public List<EventoDTO> getEventos() {
        return eventos;
    }

    public void setEventos(List<EventoDTO> eventos) {
        this.eventos = eventos != null ? eventos : new ArrayList<>();
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String nomeEscala;
        private LocalDate dataInicio;
        private LocalDate dataFim;
        private List<Long> colaboradorIds = new ArrayList<>();
        private List<EventoDTO> eventos = new ArrayList<>();

        public Builder nomeEscala(String nomeEscala) {
            this.nomeEscala = nomeEscala;
            return this;
        }

        public Builder dataInicio(LocalDate dataInicio) {
            this.dataInicio = dataInicio;
            return this;
        }

        public Builder dataFim(LocalDate dataFim) {
            this.dataFim = dataFim;
            return this;
        }

        public Builder colaboradorIds(List<Long> colaboradorIds) {
            this.colaboradorIds = colaboradorIds;
            return this;
        }

        public Builder eventos(List<EventoDTO> eventos) {
            this.eventos = eventos;
            return this;
        }

        public GerarEscalaDTO build() {
            return new GerarEscalaDTO(nomeEscala, dataInicio, dataFim, colaboradorIds, eventos);
        }
    }
}
