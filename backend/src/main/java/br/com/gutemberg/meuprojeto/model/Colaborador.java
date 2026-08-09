package br.com.gutemberg.meuprojeto.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.FetchType;
import jakarta.persistence.ManyToOne;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "colaboradores")
public class Colaborador {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    private String telefone;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "colaborador_nao_trabalhar_com", joinColumns = @JoinColumn(name = "colaborador_id"))
    @Column(name = "outro_colaborador_id")
    private List<Long> naoTrabalharCom = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "colaborador_preferencia_trabalhar_com", joinColumns = @JoinColumn(name = "colaborador_id"))
    @Column(name = "outro_colaborador_id")
    private List<Long> preferenciaTrabalharCom = new ArrayList<>();

    @ManyToOne(optional = false)
    @JoinColumn(name = "organizacao_id", nullable = false)
    private Organizacao organizacao;

    public Colaborador() {
    }

    public Colaborador(Long id, String nome, String telefone) {
        this.id = id;
        this.nome = nome;
        this.telefone = telefone;
    }

    public Colaborador(Long id, String nome, String telefone, List<Long> naoTrabalharCom, List<Long> preferenciaTrabalharCom, Organizacao organizacao) {
        this.id = id;
        this.nome = nome;
        this.telefone = telefone;
        this.naoTrabalharCom = naoTrabalharCom != null ? naoTrabalharCom : new ArrayList<>();
        this.preferenciaTrabalharCom = preferenciaTrabalharCom != null ? preferenciaTrabalharCom : new ArrayList<>();
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

    public String getTelefone() {
        return telefone;
    }

    public void setTelefone(String telefone) {
        this.telefone = telefone;
    }

    public List<Long> getNaoTrabalharCom() {
        return naoTrabalharCom;
    }

    public void setNaoTrabalharCom(List<Long> naoTrabalharCom) {
        this.naoTrabalharCom = naoTrabalharCom != null ? naoTrabalharCom : new ArrayList<>();
    }

    public List<Long> getPreferenciaTrabalharCom() {
        return preferenciaTrabalharCom;
    }

    public void setPreferenciaTrabalharCom(List<Long> preferenciaTrabalharCom) {
        this.preferenciaTrabalharCom = preferenciaTrabalharCom != null ? preferenciaTrabalharCom : new ArrayList<>();
    }

    public Organizacao getOrganizacao() {
        return organizacao;
    }

    public void setOrganizacao(Organizacao organizacao) {
        this.organizacao = organizacao;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Colaborador that = (Colaborador) o;
        return id != null ? id.equals(that.id) : that.id == null;
    }

    @Override
    public int hashCode() {
        return id != null ? id.hashCode() : 0;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private String nome;
        private String telefone;
        private List<Long> naoTrabalharCom = new ArrayList<>();
        private List<Long> preferenciaTrabalharCom = new ArrayList<>();
        private Organizacao organizacao;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder nome(String nome) {
            this.nome = nome;
            return this;
        }

        public Builder telefone(String telefone) {
            this.telefone = telefone;
            return this;
        }

        public Builder naoTrabalharCom(List<Long> naoTrabalharCom) {
            this.naoTrabalharCom = naoTrabalharCom;
            return this;
        }

        public Builder preferenciaTrabalharCom(List<Long> preferenciaTrabalharCom) {
            this.preferenciaTrabalharCom = preferenciaTrabalharCom;
            return this;
        }

        public Builder organizacao(Organizacao organizacao) {
            this.organizacao = organizacao;
            return this;
        }

        public Colaborador build() {
            return new Colaborador(id, nome, telefone, naoTrabalharCom, preferenciaTrabalharCom, organizacao);
        }
    }
}
