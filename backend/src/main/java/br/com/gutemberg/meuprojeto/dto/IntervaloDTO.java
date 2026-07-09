package br.com.gutemberg.meuprojeto.dto;

import java.time.LocalDate;
import jakarta.validation.constraints.NotNull;

public class IntervaloDTO {
    @NotNull(message = "Data de início é obrigatória")
    private LocalDate dataInicio;
    
    @NotNull(message = "Data de fim é obrigatória")
    private LocalDate dataFim;

    public IntervaloDTO() {
    }

    public IntervaloDTO(LocalDate dataInicio, LocalDate dataFim) {
        this.dataInicio = dataInicio;
        this.dataFim = dataFim;
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

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private LocalDate dataInicio;
        private LocalDate dataFim;

        public Builder dataInicio(LocalDate dataInicio) {
            this.dataInicio = dataInicio;
            return this;
        }

        public Builder dataFim(LocalDate dataFim) {
            this.dataFim = dataFim;
            return this;
        }

        public IntervaloDTO build() {
            return new IntervaloDTO(dataInicio, dataFim);
        }
    }
}
