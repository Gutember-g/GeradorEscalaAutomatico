package br.com.gutemberg.meuprojeto.model;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "alocacoes")
public class Alocacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "escala_id", nullable = false)
    private Escala escala;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evento_id", nullable = false)
    private Evento evento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "colaborador_id", nullable = false)
    private Colaborador colaborador;

    public Alocacao() {
    }

    public Alocacao(Long id, Escala escala, Evento evento, Colaborador colaborador) {
        this.id = id;
        this.escala = escala;
        this.evento = evento;
        this.colaborador = colaborador;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Escala getEscala() {
        return escala;
    }

    public void setEscala(Escala escala) {
        this.escala = escala;
    }

    public Evento getEvento() {
        return evento;
    }

    public void setEvento(Evento evento) {
        this.evento = evento;
    }

    public Colaborador getColaborador() {
        return colaborador;
    }

    public void setColaborador(Colaborador colaborador) {
        this.colaborador = colaborador;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private Escala escala;
        private Evento evento;
        private Colaborador colaborador;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder escala(Escala escala) {
            this.escala = escala;
            return this;
        }

        public Builder evento(Evento evento) {
            this.evento = evento;
            return this;
        }

        public Builder colaborador(Colaborador colaborador) {
            this.colaborador = colaborador;
            return this;
        }

        public Alocacao build() {
            return new Alocacao(id, escala, evento, colaborador);
        }
    }
}
