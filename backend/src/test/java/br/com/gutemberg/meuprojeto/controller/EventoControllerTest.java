package br.com.gutemberg.meuprojeto.controller;

import br.com.gutemberg.meuprojeto.dto.EventoDTO;
import br.com.gutemberg.meuprojeto.model.Evento;
import br.com.gutemberg.meuprojeto.model.Organizacao;
import br.com.gutemberg.meuprojeto.model.PlanoType;
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
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

public class EventoControllerTest {

    private EventoController controller;
    private EventoRepository eventoRepository;
    private OrganizacaoRepository organizacaoRepository;

    @BeforeEach
    public void setUp() {
        eventoRepository = Mockito.mock(EventoRepository.class);
        organizacaoRepository = Mockito.mock(OrganizacaoRepository.class);
        controller = new EventoController(eventoRepository, organizacaoRepository);

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
    public void testCriarEventoComSucesso() {
        // Arrange
        Organizacao org = Organizacao.builder().id(1L).plano(PlanoType.GRATUITO).build();
        when(organizacaoRepository.findById(1L)).thenReturn(Optional.of(org));
        
        LocalDate data = LocalDate.of(2026, 8, 15);
        when(eventoRepository.existsByOrganizacaoIdAndNomeAndDataAndHoraInicio(eq(1L), any(), any(), any())).thenReturn(false);
        when(eventoRepository.countByOrganizacaoIdAndDataBetween(eq(1L), any(), any())).thenReturn(5L);

        EventoDTO dto = EventoDTO.builder()
                .nome("Missa Dominical")
                .data(data)
                .horaInicio(LocalTime.of(10, 0))
                .vagasNecessarias(2)
                .corLiturgica("VERDE")
                .build();

        Evento mockSalvo = Evento.builder()
                .id(200L)
                .nome("Missa Dominical")
                .data(data)
                .horaInicio(LocalTime.of(10, 0))
                .vagasNecessarias(2)
                .corLiturgica("VERDE")
                .build();
        when(eventoRepository.save(any(Evento.class))).thenReturn(mockSalvo);

        // Act
        ResponseEntity<?> response = controller.criar(dto);

        // Assert
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        EventoDTO result = (EventoDTO) response.getBody();
        assertEquals("Missa Dominical", result.getNome());
    }

    @Test
    public void testBloquearCriacaoQuandoEstourarLimitePlanoGratuito() {
        // Arrange
        Organizacao org = Organizacao.builder().id(1L).plano(PlanoType.GRATUITO).build();
        when(organizacaoRepository.findById(1L)).thenReturn(Optional.of(org));

        LocalDate data = LocalDate.of(2026, 8, 15);
        when(eventoRepository.existsByOrganizacaoIdAndNomeAndDataAndHoraInicio(eq(1L), any(), any(), any())).thenReturn(false);
        // Já possui 15 eventos neste mês (limite do gratuito)
        when(eventoRepository.countByOrganizacaoIdAndDataBetween(eq(1L), any(), any())).thenReturn(15L);

        EventoDTO dto = EventoDTO.builder()
                .nome("Adoração")
                .data(data)
                .horaInicio(LocalTime.of(19, 30))
                .vagasNecessarias(1)
                .build();

        // Act
        ResponseEntity<?> response = controller.criar(dto);

        // Assert
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals("Limite de eventos para o mês excedido para o plano Gratuito (máximo 15).", body.get("message"));
    }

    @Test
    public void testBloquearCriacaoQuandoEstourarLimitePlanoPro() {
        // Arrange
        Organizacao org = Organizacao.builder().id(1L).plano(PlanoType.PRO).build();
        when(organizacaoRepository.findById(1L)).thenReturn(Optional.of(org));

        LocalDate data = LocalDate.of(2026, 8, 15);
        when(eventoRepository.existsByOrganizacaoIdAndNomeAndDataAndHoraInicio(eq(1L), any(), any(), any())).thenReturn(false);
        // Já possui 100 eventos neste mês (limite do Pro)
        when(eventoRepository.countByOrganizacaoIdAndDataBetween(eq(1L), any(), any())).thenReturn(100L);

        EventoDTO dto = EventoDTO.builder()
                .nome("Adoração")
                .data(data)
                .horaInicio(LocalTime.of(19, 30))
                .vagasNecessarias(1)
                .build();

        // Act
        ResponseEntity<?> response = controller.criar(dto);

        // Assert
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals("Limite de eventos para o mês excedido para o plano Pro (máximo 100).", body.get("message"));
    }
}
