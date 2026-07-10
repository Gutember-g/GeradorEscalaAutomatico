package br.com.gutemberg.meuprojeto.controller;

import br.com.gutemberg.meuprojeto.dto.DisponibilidadeDTO;
import br.com.gutemberg.meuprojeto.model.Colaborador;
import br.com.gutemberg.meuprojeto.model.Disponibilidade;
import br.com.gutemberg.meuprojeto.model.Evento;
import br.com.gutemberg.meuprojeto.repository.ColaboradorRepository;
import br.com.gutemberg.meuprojeto.repository.DisponibilidadeRepository;
import br.com.gutemberg.meuprojeto.repository.EventoRepository;
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

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class DisponibilidadeControllerTest {

    private ColaboradorController controller;
    private ColaboradorRepository colaboradorRepository;
    private EventoRepository eventoRepository;
    private DisponibilidadeRepository disponibilidadeRepository;
    private OrganizacaoRepository organizacaoRepository;

    @BeforeEach
    public void setUp() {
        colaboradorRepository = Mockito.mock(ColaboradorRepository.class);
        eventoRepository = Mockito.mock(EventoRepository.class);
        disponibilidadeRepository = Mockito.mock(DisponibilidadeRepository.class);
        organizacaoRepository = Mockito.mock(OrganizacaoRepository.class);

        controller = new ColaboradorController(
                colaboradorRepository,
                eventoRepository,
                disponibilidadeRepository,
                organizacaoRepository
        );

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
    public void testSalvarDisponibilidadesComSucesso() {
        // Arrange
        Colaborador c = Colaborador.builder().id(10L).nome("João").build();
        when(colaboradorRepository.findByIdAndOrganizacaoId(10L, 1L)).thenReturn(Optional.of(c));

        Evento e = Evento.builder().id(50L).nome("Missa").data(LocalDate.of(2026, 7, 10)).build();
        when(eventoRepository.findByIdAndOrganizacaoId(50L, 1L)).thenReturn(Optional.of(e));

        when(disponibilidadeRepository.findByOrganizacaoIdAndColaboradorIdAndEventoId(1L, 10L, 50L))
                .thenReturn(Optional.empty());

        DisponibilidadeDTO dto = DisponibilidadeDTO.builder()
                .eventoId(50L)
                .indisponivel(true)
                .build();

        // Act
        ResponseEntity<Void> response = controller.salvarDisponibilidades(10L, List.of(dto));

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(disponibilidadeRepository, times(1)).save(any(Disponibilidade.class));
    }
}
