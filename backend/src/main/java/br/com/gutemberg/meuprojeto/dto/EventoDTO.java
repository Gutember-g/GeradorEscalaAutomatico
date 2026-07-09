package br.com.gutemberg.meuprojeto.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class EventoDTO {
    private Long id;

    @NotBlank(message = "Nome do evento é obrigatório")
    private String nome;

    @NotNull(message = "Data do evento é obrigatória")
    private LocalDate data;

    @NotNull(message = "Horário de início é obrigatório")
    private LocalTime horaInicio;

    private Integer vagasNecessarias = 1;

    private String corLiturgica;

    public EventoDTO() {
    }

    public EventoDTO(Long id, String nome, LocalDate data, LocalTime horaInicio, Integer vagasNecessarias, String corLiturgica) {
        this.id = id;
        this.nome = nome;
        this.data = data;
        this.horaInicio = horaInicio;
        this.vagasNecessarias = vagasNecessarias != null ? vagasNecessarias : 1;
        this.corLiturgica = corLiturgica;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public Integer getVagasNecessarias() {
        return vagasNecessarias;
    }

    public void setVagasNecessarias(Integer vagasNecessarias) {
        this.vagasNecessarias = vagasNecessarias != null ? vagasNecessarias : 1;
    }

    public String getCorLiturgica() {
        return corLiturgica;
    }

    public void setCorLiturgica(String corLiturgica) {
        this.corLiturgica = corLiturgica;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private String nome;
        private LocalDate data;
        private LocalTime horaInicio;
        private Integer vagasNecessarias = 1;
        private String corLiturgica;

        public Builder id(Long id) {
            this.id = id;
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

        public Builder vagasNecessarias(Integer vagasNecessarias) {
            this.vagasNecessarias = vagasNecessarias;
            return this;
        }

        public Builder corLiturgica(String corLiturgica) {
            this.corLiturgica = corLiturgica;
            return this;
        }

        public EventoDTO build() {
            return new EventoDTO(id, nome, data, horaInicio, vagasNecessarias, corLiturgica);
        }
    }
}
