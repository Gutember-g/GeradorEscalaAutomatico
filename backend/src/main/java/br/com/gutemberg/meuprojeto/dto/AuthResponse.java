package br.com.gutemberg.meuprojeto.dto;

import br.com.gutemberg.meuprojeto.model.Role;

public class AuthResponse {
    private String token;
    private String nome;
    private String email;
    private Role role;
    private String nomeOrganizacao;

    public AuthResponse() {
    }

    public AuthResponse(String token, String nome, String email, Role role, String nomeOrganizacao) {
        this.token = token;
        this.nome = nome;
        this.email = email;
        this.role = role;
        this.nomeOrganizacao = nomeOrganizacao;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
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

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public String getNomeOrganizacao() {
        return nomeOrganizacao;
    }

    public void setNomeOrganizacao(String nomeOrganizacao) {
        this.nomeOrganizacao = nomeOrganizacao;
    }
}
