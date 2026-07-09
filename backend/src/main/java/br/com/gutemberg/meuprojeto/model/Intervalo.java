package br.com.gutemberg.meuprojeto.model;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import jakarta.persistence.Embeddable;

@Embeddable
public class Intervalo {

    private LocalDate dataInicio;
    private LocalDate dataFim;

    public Intervalo() {
    }

    public Intervalo(LocalDate dataInicio, LocalDate dataFim) {
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

    public List<LocalDate> getDias() {
        if (dataInicio == null || dataFim == null) {
            return List.of();
        }
        if (dataInicio.isAfter(dataFim)) {
            throw new IllegalArgumentException("A data de início não pode ser após a data de fim.");
        }
        List<LocalDate> dias = new ArrayList<>();
        LocalDate diaAtual = dataInicio;
        while (!diaAtual.isAfter(dataFim)) {
            dias.add(diaAtual);
            diaAtual = diaAtual.plusDays(1);
        }
        return dias;
    }

    public boolean contem(LocalDate data) {
        if (data == null || dataInicio == null || dataFim == null) {
            return false;
        }
        return !data.isBefore(dataInicio) && !data.isAfter(dataFim);
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

        public Intervalo build() {
            return new Intervalo(dataInicio, dataFim);
        }
    }
}
