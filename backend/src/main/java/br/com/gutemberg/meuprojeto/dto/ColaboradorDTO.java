package br.com.gutemberg.meuprojeto.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.ArrayList;
import java.util.List;

public class ColaboradorDTO {
    private Long id;
    
    @NotBlank(message = "Nome é obrigatório")
    private String nome;
    
    private String telefone;

    private List<Long> naoTrabalharCom = new ArrayList<>();
    private List<Long> preferenciaTrabalharCom = new ArrayList<>();

    public ColaboradorDTO() {
    }

    public ColaboradorDTO(Long id, String nome, String telefone) {
        this.id = id;
        this.nome = nome;
        this.telefone = telefone;
    }

    public ColaboradorDTO(Long id, String nome, String telefone, List<Long> naoTrabalharCom, List<Long> preferenciaTrabalharCom) {
        this.id = id;
        this.nome = nome;
        this.telefone = telefone;
        this.naoTrabalharCom = naoTrabalharCom != null ? naoTrabalharCom : new ArrayList<>();
        this.preferenciaTrabalharCom = preferenciaTrabalharCom != null ? preferenciaTrabalharCom : new ArrayList<>();
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

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private String nome;
        private String telefone;
        private List<Long> naoTrabalharCom = new ArrayList<>();
        private List<Long> preferenciaTrabalharCom = new ArrayList<>();

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

        public ColaboradorDTO build() {
            return new ColaboradorDTO(id, nome, telefone, naoTrabalharCom, preferenciaTrabalharCom);
        }
    }
}
