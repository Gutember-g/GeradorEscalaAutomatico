package br.com.gutemberg.meuprojeto.dto;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class EscalaDTO {
    private Long id;
    private String nome;
    private LocalDate dataInicio;
    private LocalDate dataFim;
    private List<EventoDTO> eventos = new ArrayList<>();
    private List<AlocacaoDTO> alocacoes = new ArrayList<>();
    private List<String> avisos = new ArrayList<>();

    public EscalaDTO() {
    }

    public EscalaDTO(Long id, String nome, LocalDate dataInicio, LocalDate dataFim, List<EventoDTO> eventos, List<AlocacaoDTO> alocacoes) {
        this.id = id;
        this.nome = nome;
        this.dataInicio = dataInicio;
        this.dataFim = dataFim;
        this.eventos = eventos != null ? eventos : new ArrayList<>();
        this.alocacoes = alocacoes != null ? alocacoes : new ArrayList<>();
        this.avisos = new ArrayList<>();
    }

    public EscalaDTO(Long id, String nome, LocalDate dataInicio, LocalDate dataFim, List<EventoDTO> eventos, List<AlocacaoDTO> alocacoes, List<String> avisos) {
        this.id = id;
        this.nome = nome;
        this.dataInicio = dataInicio;
        this.dataFim = dataFim;
        this.eventos = eventos != null ? eventos : new ArrayList<>();
        this.alocacoes = alocacoes != null ? alocacoes : new ArrayList<>();
        this.avisos = avisos != null ? avisos : new ArrayList<>();
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

    public List<EventoDTO> getEventos() {
        return eventos;
    }

    public void setEventos(List<EventoDTO> eventos) {
        this.eventos = eventos != null ? eventos : new ArrayList<>();
    }

    public List<AlocacaoDTO> getAlocacoes() {
        return alocacoes;
    }

    public void setAlocacoes(List<AlocacaoDTO> alocacoes) {
        this.alocacoes = alocacoes != null ? alocacoes : new ArrayList<>();
    }

    public List<String> getAvisos() {
        return avisos;
    }

    public void setAvisos(List<String> avisos) {
        this.avisos = avisos != null ? avisos : new ArrayList<>();
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private String nome;
        private LocalDate dataInicio;
        private LocalDate dataFim;
        private List<EventoDTO> eventos = new ArrayList<>();
        private List<AlocacaoDTO> alocacoes = new ArrayList<>();
        private List<String> avisos = new ArrayList<>();

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder nome(String nome) {
            this.nome = nome;
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

        public Builder eventos(List<EventoDTO> eventos) {
            this.eventos = eventos;
            return this;
        }

        public Builder alocacoes(List<AlocacaoDTO> alocacoes) {
            this.alocacoes = alocacoes;
            return this;
        }

        public Builder avisos(List<String> avisos) {
            this.avisos = avisos;
            return this;
        }

        public EscalaDTO build() {
            return new EscalaDTO(id, nome, dataInicio, dataFim, eventos, alocacoes, avisos);
        }
    }
}
