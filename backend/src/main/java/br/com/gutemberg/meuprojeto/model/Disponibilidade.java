package br.com.gutemberg.meuprojeto.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "disponibilidades", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"colaborador_id", "evento_id"})
})
public class Disponibilidade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "colaborador_id", nullable = false)
    private Colaborador colaborador;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evento_id", nullable = false)
    private Evento evento;

    @Column(nullable = false)
    private int mes;

    @Column(nullable = false)
    private int ano;

    @Column(nullable = false)
    private boolean indisponivel;

    @ManyToOne(optional = false)
    @JoinColumn(name = "organizacao_id", nullable = false)
    private Organizacao organizacao;

    public Disponibilidade() {
    }

    public Disponibilidade(Long id, Colaborador colaborador, Evento evento, int mes, int ano, boolean indisponivel) {
        this.id = id;
        this.colaborador = colaborador;
        this.evento = evento;
        this.mes = mes;
        this.ano = ano;
        this.indisponivel = indisponivel;
    }

    public Disponibilidade(Long id, Colaborador colaborador, Evento evento, int mes, int ano, boolean indisponivel, Organizacao organizacao) {
        this.id = id;
        this.colaborador = colaborador;
        this.evento = evento;
        this.mes = mes;
        this.ano = ano;
        this.indisponivel = indisponivel;
        this.organizacao = organizacao;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Colaborador getColaborador() {
        return colaborador;
    }

    public void setColaborador(Colaborador colaborador) {
        this.colaborador = colaborador;
    }

    public Evento getEvento() {
        return evento;
    }

    public void setEvento(Evento evento) {
        this.evento = evento;
    }

    public int getMes() {
        return mes;
    }

    public void setMes(int mes) {
        this.mes = mes;
    }

    public int getAno() {
        return ano;
    }

    public void setAno(int ano) {
        this.ano = ano;
    }

    public boolean isIndisponivel() {
        return indisponivel;
    }

    public void setIndisponivel(boolean indisponivel) {
        this.indisponivel = indisponivel;
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
        private Colaborador colaborador;
        private Evento evento;
        private int mes;
        private int ano;
        private boolean indisponivel;
        private Organizacao organizacao;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder colaborador(Colaborador colaborador) {
            this.colaborador = colaborador;
            return this;
        }

        public Builder evento(Evento evento) {
            this.evento = evento;
            return this;
        }

        public Builder mes(int mes) {
            this.mes = mes;
            return this;
        }

        public Builder ano(int ano) {
            this.ano = ano;
            return this;
        }

        public Builder indisponivel(boolean indisponivel) {
            this.indisponivel = indisponivel;
            return this;
        }

        public Builder organizacao(Organizacao organizacao) {
            this.organizacao = organizacao;
            return this;
        }

        public Disponibilidade build() {
            return new Disponibilidade(id, colaborador, evento, mes, ano, indisponivel, organizacao);
        }
    }
}
