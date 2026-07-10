package br.com.gutemberg.meuprojeto.controller;

import br.com.gutemberg.meuprojeto.dto.ColaboradorDTO;
import br.com.gutemberg.meuprojeto.model.Colaborador;
import br.com.gutemberg.meuprojeto.model.Organizacao;
import br.com.gutemberg.meuprojeto.model.PlanoType;
import br.com.gutemberg.meuprojeto.repository.ColaboradorRepository;
import br.com.gutemberg.meuprojeto.repository.OrganizacaoRepository;
import br.com.gutemberg.meuprojeto.security.UsuarioPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

public class ColaboradorControllerTest {

    private ColaboradorController controller;
    private ColaboradorRepository colaboradorRepository;
    private OrganizacaoRepository organizacaoRepository;

    @BeforeEach
    public void setUp() {
        colaboradorRepository = Mockito.mock(ColaboradorRepository.class);
        organizacaoRepository = Mockito.mock(OrganizacaoRepository.class);
        controller = new ColaboradorController(colaboradorRepository, null, null, organizacaoRepository);

        // Configurar usuário mockado no SecurityContext
        UsuarioPrincipal principal = new UsuarioPrincipal(
                1L, "Voluntário Teste", "user@test.com", "senha", 1L, true, 1,
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                principal, null, principal.getAuthorities()
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    public void testCriarColaboradorComSucesso() {
        // Arrange
        Organizacao org = Organizacao.builder().id(1L).plano(PlanoType.GRATUITO).build();
        when(organizacaoRepository.findById(1L)).thenReturn(Optional.of(org));
        when(colaboradorRepository.countByOrganizacaoId(1L)).thenReturn(5L);

        ColaboradorDTO dto = ColaboradorDTO.builder().nome("Maria Silva").telefone("9999-9999").build();
        Colaborador mockSalvo = Colaborador.builder().id(100L).nome("Maria Silva").telefone("9999-9999").build();
        when(colaboradorRepository.save(any(Colaborador.class))).thenReturn(mockSalvo);

        // Act
        ResponseEntity<?> response = controller.criar(dto);

        // Assert
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        ColaboradorDTO result = (ColaboradorDTO) response.getBody();
        assertEquals("Maria Silva", result.getNome());
    }

    @Test
    public void testBloquearCriacaoQuandoEstourarLimitePlanoGratuito() {
        // Arrange
        Organizacao org = Organizacao.builder().id(1L).plano(PlanoType.GRATUITO).build();
        when(organizacaoRepository.findById(1L)).thenReturn(Optional.of(org));
        // Já possui 10 colaboradores (limite do gratuito)
        when(colaboradorRepository.countByOrganizacaoId(1L)).thenReturn(10L);

        ColaboradorDTO dto = ColaboradorDTO.builder().nome("Pedro Alves").telefone("8888-8888").build();

        // Act
        ResponseEntity<?> response = controller.criar(dto);

        // Assert
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals("Limite de colaboradores atingido para o plano Gratuito (máximo 10).", body.get("message"));
    }

    @Test
    public void testBloquearCriacaoQuandoEstourarLimitePlanoPro() {
        // Arrange
        Organizacao org = Organizacao.builder().id(1L).plano(PlanoType.PRO).build();
        when(organizacaoRepository.findById(1L)).thenReturn(Optional.of(org));
        // Já possui 50 colaboradores (limite do Pro)
        when(colaboradorRepository.countByOrganizacaoId(1L)).thenReturn(50L);

        ColaboradorDTO dto = ColaboradorDTO.builder().nome("Pedro Alves").telefone("8888-8888").build();

        // Act
        ResponseEntity<?> response = controller.criar(dto);

        // Assert
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals("Limite de colaboradores atingido para o plano Pro (máximo 50).", body.get("message"));
    }

    @Test
    public void testBloquearCircularPartnership() {
        // Arrange
        Organizacao org = Organizacao.builder().id(1L).plano(PlanoType.ILIMITADO).build();
        when(organizacaoRepository.findById(1L)).thenReturn(Optional.of(org));

        // Tentar cadastrar com o mesmo ID em ambas as listas de preferência e exclusão
        List<Long> naoTrabalhar = List.of(2L);
        List<Long> prefTrabalhar = List.of(2L);

        ColaboradorDTO dto = ColaboradorDTO.builder()
                .nome("Thiago")
                .telefone("7777-7777")
                .naoTrabalharCom(naoTrabalhar)
                .preferenciaTrabalharCom(prefTrabalhar)
                .build();

        // Act
        ResponseEntity<?> response = controller.criar(dto);

        // Assert
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals("Um colaborador não pode estar nas listas de 'Não trabalhar com' e 'Preferência de trabalho' ao mesmo tempo.", body.get("message"));
    }
}
