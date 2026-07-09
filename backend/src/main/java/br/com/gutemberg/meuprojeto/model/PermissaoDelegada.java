package br.com.gutemberg.meuprojeto.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "permissoes_delegadas", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"usuario_id", "modulo"})
})
public class PermissaoDelegada {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ModuloPermissao modulo;

    public PermissaoDelegada() {
    }

    public PermissaoDelegada(Long id, Usuario usuario, ModuloPermissao modulo) {
        this.id = id;
        this.usuario = usuario;
        this.modulo = modulo;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public ModuloPermissao getModulo() {
        return modulo;
    }

    public void setModulo(ModuloPermissao modulo) {
        this.modulo = modulo;
    }
}
