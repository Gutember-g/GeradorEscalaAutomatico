package br.com.gutemberg.meuprojeto.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class SecurityUtils {

    public static Long getCurrentTenantId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UsuarioPrincipal) {
            return ((UsuarioPrincipal) auth.getPrincipal()).getOrganizacaoId();
        }
        return null;
    }

    public static UsuarioPrincipal getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UsuarioPrincipal) {
            return (UsuarioPrincipal) auth.getPrincipal();
        }
        return null;
    }
}
