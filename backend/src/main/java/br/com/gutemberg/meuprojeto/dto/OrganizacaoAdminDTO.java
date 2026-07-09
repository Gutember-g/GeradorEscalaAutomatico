package br.com.gutemberg.meuprojeto.dto;

import java.time.LocalDateTime;

public class OrganizacaoAdminDTO {
    private Long id;
    private String nome;
    private LocalDateTime dataCriacao;
    private boolean ativo;
    private String emailResponsavel;
    private String nomeResponsavel;
    private long totalColaboradores;
    private long totalEventos;
    private long totalEscalas;
    private String plano;
    private String observacoes;

    public OrganizacaoAdminDTO() {
    }

    public OrganizacaoAdminDTO(Long id, String nome, LocalDateTime dataCriacao, boolean ativo, String emailResponsavel, String nomeResponsavel, long totalColaboradores, long totalEventos, long totalEscalas, String plano, String observacoes) {
        this.id = id;
        this.nome = nome;
        this.dataCriacao = dataCriacao;
        this.ativo = ativo;
        this.emailResponsavel = emailResponsavel;
        this.nomeResponsavel = nomeResponsavel;
        this.totalColaboradores = totalColaboradores;
        this.totalEventos = totalEventos;
        this.totalEscalas = totalEscalas;
        this.plano = plano;
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

    public String getEmailResponsavel() {
        return emailResponsavel;
    }

    public void setEmailResponsavel(String emailResponsavel) {
        this.emailResponsavel = emailResponsavel;
    }

    public String getNomeResponsavel() {
        return nomeResponsavel;
    }

    public void setNomeResponsavel(String nomeResponsavel) {
        this.nomeResponsavel = nomeResponsavel;
    }

    public long getTotalColaboradores() {
        return totalColaboradores;
    }

    public void setTotalColaboradores(long totalColaboradores) {
        this.totalColaboradores = totalColaboradores;
    }

    public long getTotalEventos() {
        return totalEventos;
    }

    public void setTotalEventos(long totalEventos) {
        this.totalEventos = totalEventos;
    }

    public long getTotalEscalas() {
        return totalEscalas;
    }

    public void setTotalEscalas(long totalEscalas) {
        this.totalEscalas = totalEscalas;
    }

    public String getPlano() {
        return plano;
    }

    public void setPlano(String plano) {
        this.plano = plano;
    }

    public String getObservacoes() {
        return observacoes;
    }

    public void setObservacoes(String observacoes) {
        this.observacoes = observacoes;
    }
}
