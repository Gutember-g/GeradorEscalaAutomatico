package br.com.gutemberg.meuprojeto.security;

import br.com.gutemberg.meuprojeto.model.Usuario;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

public class UsuarioPrincipal implements UserDetails {

    private final Long id;
    private final String nome;
    private final String email;
    private final String senha;
    private final Long organizacaoId;
    private final boolean tenantAtivo;
    private final int tokenVersion;
    private final Collection<? extends GrantedAuthority> authorities;

    public UsuarioPrincipal(Long id, String nome, String email, String senha, Long organizacaoId, boolean tenantAtivo, int tokenVersion, Collection<? extends GrantedAuthority> authorities) {
        this.id = id;
        this.nome = nome;
        this.email = email;
        this.senha = senha;
        this.organizacaoId = organizacaoId;
        this.tenantAtivo = tenantAtivo;
        this.tokenVersion = tokenVersion;
        this.authorities = authorities;
    }

    public static UsuarioPrincipal build(Usuario usuario) {
        List<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority("ROLE_" + usuario.getRole().name()));
        
        Long orgId = usuario.getOrganizacao() != null ? usuario.getOrganizacao().getId() : null;
        boolean orgAtiva = usuario.getOrganizacao() != null ? usuario.getOrganizacao().isAtivo() : true;

        return new UsuarioPrincipal(
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getSenha(),
                orgId,
                orgAtiva,
                usuario.getTokenVersion(),
                authorities
        );
    }

    public Long getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public Long getOrganizacaoId() {
        return organizacaoId;
    }

    public boolean isTenantAtivo() {
        return tenantAtivo;
    }

    public int getTokenVersion() {
        return tokenVersion;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return senha;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
