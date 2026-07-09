package br.com.gutemberg.meuprojeto.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "usuarios")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String senha;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @ManyToOne
    @JoinColumn(name = "organizacao_id")
    private Organizacao organizacao;

    @Column(name = "deletado_em")
    private LocalDateTime deletadoEm;

    @Column(name = "token_version", nullable = false)
    private int tokenVersion = 1;

    public Usuario() {
    }

    public Usuario(Long id, String nome, String email, String senha, Role role, Organizacao organizacao, LocalDateTime deletadoEm, int tokenVersion) {
        this.id = id;
        this.nome = nome;
        this.email = email;
        this.senha = senha;
        this.role = role;
        this.organizacao = organizacao;
        this.deletadoEm = deletadoEm;
        this.tokenVersion = tokenVersion;
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

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getSenha() {
        return senha;
    }

    public void setSenha(String senha) {
        this.senha = senha;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public Organizacao getOrganizacao() {
        return organizacao;
    }

    public void setOrganizacao(Organizacao organizacao) {
        this.organizacao = organizacao;
    }

    public LocalDateTime getDeletadoEm() {
        return deletadoEm;
    }

    public void setDeletadoEm(LocalDateTime deletadoEm) {
        this.deletadoEm = deletadoEm;
    }

    public int getTokenVersion() {
        return tokenVersion;
    }

    public void setTokenVersion(int tokenVersion) {
        this.tokenVersion = tokenVersion;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private String nome;
        private String email;
        private String senha;
        private Role role;
        private Organizacao organizacao;
        private LocalDateTime deletadoEm;
        private int tokenVersion = 1;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder nome(String nome) {
            this.nome = nome;
            return this;
        }

        public Builder email(String email) {
            this.email = email;
            return this;
        }

        public Builder senha(String senha) {
            this.senha = senha;
            return this;
        }

        public Builder role(Role role) {
            this.role = role;
            return this;
        }

        public Builder organizacao(Organizacao organizacao) {
            this.organizacao = organizacao;
            return this;
        }

        public Builder deletadoEm(LocalDateTime deletadoEm) {
            this.deletadoEm = deletadoEm;
            return this;
        }

        public Builder tokenVersion(int tokenVersion) {
            this.tokenVersion = tokenVersion;
            return this;
        }

        public Usuario build() {
            return new Usuario(id, nome, email, senha, role, organizacao, deletadoEm, tokenVersion);
        }
    }
}
