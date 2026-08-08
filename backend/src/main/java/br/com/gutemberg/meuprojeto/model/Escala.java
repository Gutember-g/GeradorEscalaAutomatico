package br.com.gutemberg.meuprojeto.model;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.JoinColumn;

import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;

@Entity
@Table(name = "escalas")
public class Escala {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    @Column(name = "data_inicio", nullable = false)
    private LocalDate dataInicio;

    @Column(name = "data_fim", nullable = false)
    private LocalDate dataFim;

    @OneToMany(mappedBy = "escala", cascade = CascadeType.ALL, orphanRemoval = true)
    @Fetch(FetchMode.SUBSELECT)
    private List<Evento> eventos = new ArrayList<>();

    @OneToMany(mappedBy = "escala", cascade = CascadeType.ALL, orphanRemoval = true)
    @Fetch(FetchMode.SUBSELECT)
    private List<Alocacao> alocacoes = new ArrayList<>();

    @ManyToOne(optional = false)
    @JoinColumn(name = "organizacao_id", nullable = false)
    private Organizacao organizacao;

    public Escala() {
    }

    public Escala(Long id, String nome, LocalDate dataInicio, LocalDate dataFim, List<Evento> eventos, List<Alocacao> alocacoes) {
        this.id = id;
        this.nome = nome;
        this.dataInicio = dataInicio;
        this.dataFim = dataFim;
        this.eventos = eventos != null ? eventos : new ArrayList<>();
        this.alocacoes = alocacoes != null ? alocacoes : new ArrayList<>();
    }

    public Escala(Long id, String nome, LocalDate dataInicio, LocalDate dataFim, List<Evento> eventos, List<Alocacao> alocacoes, Organizacao organizacao) {
        this.id = id;
        this.nome = nome;
        this.dataInicio = dataInicio;
        this.dataFim = dataFim;
        this.eventos = eventos != null ? eventos : new ArrayList<>();
        this.alocacoes = alocacoes != null ? alocacoes : new ArrayList<>();
        this.organizacao = organizacao;
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

    public List<Evento> getEventos() {
        return eventos;
    }

    public void setEventos(List<Evento> eventos) {
        this.eventos = eventos != null ? eventos : new ArrayList<>();
    }

    public List<Alocacao> getAlocacoes() {
        return alocacoes;
    }

    public void setAlocacoes(List<Alocacao> alocacoes) {
        this.alocacoes = alocacoes != null ? alocacoes : new ArrayList<>();
    }

    public Organizacao getOrganizacao() {
        return organizacao;
    }

    public void setOrganizacao(Organizacao organizacao) {
        this.organizacao = organizacao;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private String nome;
        private LocalDate dataInicio;
        private LocalDate dataFim;
        private List<Evento> eventos = new ArrayList<>();
        private List<Alocacao> alocacoes = new ArrayList<>();
        private Organizacao organizacao;

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

        public Builder eventos(List<Evento> eventos) {
            this.eventos = eventos;
            return this;
        }

        public Builder alocacoes(List<Alocacao> alocacoes) {
            this.alocacoes = alocacoes;
            return this;
        }

        public Builder organizacao(Organizacao organizacao) {
            this.organizacao = organizacao;
            return this;
        }

        public Escala build() {
            return new Escala(id, nome, dataInicio, dataFim, eventos, alocacoes, organizacao);
        }
    }
}
