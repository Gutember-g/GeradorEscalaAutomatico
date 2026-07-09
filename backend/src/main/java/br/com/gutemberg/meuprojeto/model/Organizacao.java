package br.com.gutemberg.meuprojeto.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "organizacoes")
public class Organizacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    @Column(name = "data_criacao", nullable = false, updatable = false)
    private LocalDateTime dataCriacao = LocalDateTime.now();

    @Column(nullable = false)
    private boolean ativo = true;

    @Column(name = "deletado_em")
    private LocalDateTime deletadoEm;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PlanoType plano = PlanoType.GRATUITO;

    private String observacoes;

    public Organizacao() {
    }

    public Organizacao(Long id, String nome, LocalDateTime dataCriacao, boolean ativo, LocalDateTime deletadoEm, PlanoType plano, String observacoes) {
        this.id = id;
        this.nome = nome;
        this.dataCriacao = dataCriacao != null ? dataCriacao : LocalDateTime.now();
        this.ativo = ativo;
        this.deletadoEm = deletadoEm;
        this.plano = plano != null ? plano : PlanoType.GRATUITO;
        this.observacoes = observacoes;
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

    public LocalDateTime getDataCriacao() {
        return dataCriacao;
    }

    public void setDataCriacao(LocalDateTime dataCriacao) {
        this.dataCriacao = dataCriacao;
    }

    public boolean isAtivo() {
        return ativo;
    }

    public void setAtivo(boolean ativo) {
        this.ativo = ativo;
    }

    public LocalDateTime getDeletadoEm() {
        return deletadoEm;
    }

    public void setDeletadoEm(LocalDateTime deletadoEm) {
        this.deletadoEm = deletadoEm;
    }

    public PlanoType getPlano() {
        return plano;
    }

    public void setPlano(PlanoType plano) {
        this.plano = plano;
    }

    public String getObservacoes() {
        return observacoes;
    }

    public void setObservacoes(String observacoes) {
        this.observacoes = observacoes;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private String nome;
        private LocalDateTime dataCriacao;
        private boolean ativo = true;
        private LocalDateTime deletadoEm;
        private PlanoType plano = PlanoType.GRATUITO;
        private String observacoes;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder nome(String nome) {
            this.nome = nome;
            return this;
        }

        public Builder dataCriacao(LocalDateTime dataCriacao) {
            this.dataCriacao = dataCriacao;
            return this;
        }

        public Builder ativo(boolean ativo) {
            this.ativo = ativo;
            return this;
        }

        public Builder deletadoEm(LocalDateTime deletadoEm) {
            this.deletadoEm = deletadoEm;
            return this;
        }

        public Builder plano(PlanoType plano) {
            this.plano = plano;
            return this;
        }

        public Builder observacoes(String observacoes) {
            this.observacoes = observacoes;
            return this;
        }

        public Organizacao build() {
            return new Organizacao(id, nome, dataCriacao, ativo, deletadoEm, plano, observacoes);
        }
    }
}
