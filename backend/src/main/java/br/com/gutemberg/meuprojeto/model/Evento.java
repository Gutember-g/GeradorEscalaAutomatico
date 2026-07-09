package br.com.gutemberg.meuprojeto.model;

import java.time.LocalDate;
import java.time.LocalTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "eventos")
public class Evento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false)
    private LocalDate data;

    @Column(name = "hora_inicio", nullable = false)
    private LocalTime horaInicio;

    @Column(name = "vagas_necessarias", nullable = false)
    private Integer vagasNecessarias = 1;

    @Column(name = "cor_liturgica")
    private String corLiturgica;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "escala_id")
    private Escala escala;

    @ManyToOne(optional = false)
    @JoinColumn(name = "organizacao_id", nullable = false)
    private Organizacao organizacao;

    public Evento() {
    }

    public Evento(Long id, String nome, LocalDate data, LocalTime horaInicio, Integer vagasNecessarias, String corLiturgica, Escala escala) {
        this.id = id;
        this.nome = nome != null ? nome : "Plantão";
        this.data = data;
        this.horaInicio = horaInicio;
        this.vagasNecessarias = vagasNecessarias != null ? vagasNecessarias : 1;
        this.corLiturgica = corLiturgica;
        this.escala = escala;
    }

    public Evento(Long id, String nome, LocalDate data, LocalTime horaInicio, Integer vagasNecessarias, String corLiturgica, Escala escala, Organizacao organizacao) {
        this.id = id;
        this.nome = nome != null ? nome : "Plantão";
        this.data = data;
        this.horaInicio = horaInicio;
        this.vagasNecessarias = vagasNecessarias != null ? vagasNecessarias : 1;
        this.corLiturgica = corLiturgica;
        this.escala = escala;
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
        this.nome = nome != null ? nome : "Plantão";
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

    public Escala getEscala() {
        return escala;
    }

    public void setEscala(Escala escala) {
        this.escala = escala;
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
        private LocalDate data;
        private LocalTime horaInicio;
        private Integer vagasNecessarias = 1;
        private String corLiturgica;
        private Escala escala;
        private Organizacao organizacao;

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

        public Builder escala(Escala escala) {
            this.escala = escala;
            return this;
        }

        public Builder organizacao(Organizacao organizacao) {
            this.organizacao = organizacao;
            return this;
        }

        public Evento build() {
            return new Evento(id, nome, data, horaInicio, vagasNecessarias, corLiturgica, escala, organizacao);
        }
    }
}
