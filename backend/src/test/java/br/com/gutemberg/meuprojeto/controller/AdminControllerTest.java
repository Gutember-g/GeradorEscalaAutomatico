package br.com.gutemberg.meuprojeto.controller;

import br.com.gutemberg.meuprojeto.model.Organizacao;
import br.com.gutemberg.meuprojeto.model.PlanoType;
import br.com.gutemberg.meuprojeto.model.Role;
import br.com.gutemberg.meuprojeto.model.Usuario;
import br.com.gutemberg.meuprojeto.repository.*;
import br.com.gutemberg.meuprojeto.security.UsuarioPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class AdminControllerTest {

    private AdminController controller;
    private OrganizacaoRepository organizacaoRepository;
    private UsuarioRepository usuarioRepository;
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    public void setUp() {
        organizacaoRepository = Mockito.mock(OrganizacaoRepository.class);
        usuarioRepository = Mockito.mock(UsuarioRepository.class);
        passwordEncoder = Mockito.mock(PasswordEncoder.class);

        controller = new AdminController(
                organizacaoRepository,
                usuarioRepository,
                Mockito.mock(ColaboradorRepository.class),
                Mockito.mock(EventoRepository.class),
                Mockito.mock(EscalaRepository.class),
                Mockito.mock(AuditLogRepository.class),
                Mockito.mock(PermissaoDelegadaRepository.class),
                passwordEncoder
        );

        // Configurar Super Admin autenticado
        UsuarioPrincipal principal = new UsuarioPrincipal(
                1L, "Super Admin", "admin@escalafacil.com", "senha", null, true, 1,
                List.of(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN"))
        );
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                principal, null, principal.getAuthorities()
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    public void testCriarOrganizacaoComSucesso() {
        // Arrange
        AdminController.CreateTenantRequest request = new AdminController.CreateTenantRequest();
        request.nomeOrganizacao = "Paróquia São Pedro";
        request.nomeResponsavel = "Padre Carlos";
        request.emailResponsavel = "carlos@gmail.com";
        request.senhaResponsavel = "padre123";
        request.plano = "PRO";

        when(usuarioRepository.existsByEmail(request.emailResponsavel)).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashedPassword");
        
        Organizacao orgSalva = Organizacao.builder().id(10L).nome("Paróquia São Pedro").build();
        when(organizacaoRepository.save(any(Organizacao.class))).thenReturn(orgSalva);

        // Act
        ResponseEntity<?> response = controller.criarOrganizacao(request);

        // Assert
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        verify(organizacaoRepository, times(1)).save(any(Organizacao.class));
        verify(usuarioRepository, times(1)).save(any(Usuario.class));
    }

    @Test
    public void testForcarLogoutIncrementaTokenVersion() {
        // Arrange
        Usuario gestor = Usuario.builder().id(5L).email("gestor@test.com").tokenVersion(3).build();
        when(usuarioRepository.findByOrganizacaoId(10L)).thenReturn(List.of(gestor));

        // Act
        ResponseEntity<?> response = controller.forcarLogout(10L);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(4, gestor.getTokenVersion()); // Incrementado de 3 para 4
        verify(usuarioRepository, times(1)).save(gestor);
    }

    @Test
    public void testSoftDeleteMarcaDeletadoEm() {
        // Arrange
        Organizacao org = Organizacao.builder().id(10L).nome("Paróquia A").ativo(true).build();
        when(organizacaoRepository.findByIdActive(10L)).thenReturn(Optional.of(org));

        Usuario gestor = Usuario.builder().id(5L).email("gestor@test.com").tokenVersion(1).build();
        when(usuarioRepository.findByOrganizacaoId(10L)).thenReturn(List.of(gestor));

        // Act
        ResponseEntity<?> response = controller.deletarOrganizacao(10L);

        // Assert
        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        assertNotNull(org.getDeletadoEm());
        assertFalse(org.isAtivo());
        assertNotNull(gestor.getDeletadoEm());
        assertEquals(2, gestor.getTokenVersion()); // Força logout ao excluir
        verify(organizacaoRepository, times(1)).save(org);
        verify(usuarioRepository, times(1)).save(gestor);
    }

    @Test
    public void testResetarSenhaGeraSenhaTemporaria() {
        // Arrange
        Usuario gestor = Usuario.builder().id(5L).email("gestor@test.com").tokenVersion(1).build();
        when(usuarioRepository.findByOrganizacaoId(10L)).thenReturn(List.of(gestor));
        when(passwordEncoder.encode(anyString())).thenReturn("newHashedPassword");

        // Act
        ResponseEntity<?> response = controller.resetarSenha(10L);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertTrue(body.containsKey("senhaTemporaria"));
        assertEquals("Senha redefinida com sucesso!", body.get("message"));
        assertEquals(2, gestor.getTokenVersion()); // Força logout após redefinir senha
        verify(usuarioRepository, times(1)).save(gestor);
    }
}
