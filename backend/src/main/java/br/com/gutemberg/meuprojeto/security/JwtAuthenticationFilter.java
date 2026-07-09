package br.com.gutemberg.meuprojeto.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final CustomUserDetailsService customUserDetailsService;

    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider, CustomUserDetailsService customUserDetailsService) {
        this.tokenProvider = tokenProvider;
        this.customUserDetailsService = customUserDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String jwt = obterJwtDaRequisicao(request);

            if (StringUtils.hasText(jwt) && tokenProvider.validarToken(jwt)) {
                String email = tokenProvider.obterEmailDoToken(jwt);
                Integer tokenVersaoNoJwt = tokenProvider.obterVersaoDoToken(jwt);

                UserDetails userDetails = customUserDetailsService.loadUserByUsername(email);
                
                if (userDetails instanceof UsuarioPrincipal) {
                    UsuarioPrincipal principal = (UsuarioPrincipal) userDetails;
                    
                    // 1. Verificar se a organização do inquilino está desativada
                    if (principal.getOrganizacaoId() != null && !principal.isTenantAtivo()) {
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.setContentType("application/json");
                        response.setCharacterEncoding("UTF-8");
                        response.getWriter().write("{\"message\": \"Esta organização está temporariamente desativada. Entre em contato com o administrador.\"}");
                        return;
                    }

                    // 2. Verificar se o token JWT foi invalidado administrativamente (Blacklist via versionamento)
                    if (tokenVersaoNoJwt < principal.getTokenVersion()) {
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        response.setContentType("application/json");
                        response.setCharacterEncoding("UTF-8");
                        response.getWriter().write("{\"message\": \"Sessão expirada administrativamente. Faça login novamente.\"}");
                        return;
                    }
                }

                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception ex) {
            logger.error("Erro ao configurar a autenticação do usuário", ex);
        }

        filterChain.doFilter(request, response);
    }

    private String obterJwtDaRequisicao(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
