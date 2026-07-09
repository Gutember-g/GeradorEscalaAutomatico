package br.com.gutemberg.meuprojeto.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "logs_auditoria")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "admin_id")
    private Long adminId;

    @Column(name = "admin_nome", nullable = false)
    private String adminNome;

    @Column(nullable = false)
    private String acao;

    @Column(name = "entidade_afetada", nullable = false)
    private String entidadeAfetada;

    @Column(name = "entidade_id")
    private Long entidadeId;

    @Column(nullable = false)
    private LocalDateTime timestamp = LocalDateTime.now();

    private String detalhes;

    public AuditLog() {
    }

    public AuditLog(Long id, Long adminId, String adminNome, String acao, String entidadeAfetada, Long entidadeId, LocalDateTime timestamp, String detalhes) {
        this.id = id;
        this.adminId = adminId;
        this.adminNome = adminNome;
        this.acao = acao;
        this.entidadeAfetada = entidadeAfetada;
        this.entidadeId = entidadeId;
        this.timestamp = timestamp != null ? timestamp : LocalDateTime.now();
        this.detalhes = detalhes;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getAdminId() {
        return adminId;
    }

    public void setAdminId(Long adminId) {
        this.adminId = adminId;
    }

    public String getAdminNome() {
        return adminNome;
    }

    public void setAdminNome(String adminNome) {
        this.adminNome = adminNome;
    }

    public String getAcao() {
        return acao;
    }

    public void setAcao(String acao) {
        this.acao = acao;
    }

    public String getEntidadeAfetada() {
        return entidadeAfetada;
    }

    public void setEntidadeAfetada(String entidadeAfetada) {
        this.entidadeAfetada = entidadeAfetada;
    }

    public Long getEntidadeId() {
        return entidadeId;
    }

    public void setEntidadeId(Long entidadeId) {
        this.entidadeId = entidadeId;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getDetalhes() {
        return detalhes;
    }

    public void setDetalhes(String detalhes) {
        this.detalhes = detalhes;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private Long adminId;
        private String adminNome;
        private String acao;
        private String entidadeAfetada;
        private Long entidadeId;
        private LocalDateTime timestamp;
        private String detalhes;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder adminId(Long adminId) {
            this.adminId = adminId;
            return this;
        }

        public Builder adminNome(String adminNome) {
            this.adminNome = adminNome;
            return this;
        }

        public Builder acao(String acao) {
            this.acao = acao;
            return this;
        }

        public Builder entidadeAfetada(String entidadeAfetada) {
            this.entidadeAfetada = entidadeAfetada;
            return this;
        }

        public Builder entidadeId(Long entidadeId) {
            this.entidadeId = entidadeId;
            return this;
        }

        public Builder timestamp(LocalDateTime timestamp) {
            this.timestamp = timestamp;
            return this;
        }

        public Builder detalhes(String detalhes) {
            this.detalhes = detalhes;
            return this;
        }

        public AuditLog build() {
            return new AuditLog(id, adminId, adminNome, acao, entidadeAfetada, entidadeId, timestamp, detalhes);
        }
    }
}
