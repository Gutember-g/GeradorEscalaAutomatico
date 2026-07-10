package br.com.gutemberg.meuprojeto.service;

import br.com.gutemberg.meuprojeto.dto.RelatorioGeracao;
import br.com.gutemberg.meuprojeto.dto.StatusEvento;
import br.com.gutemberg.meuprojeto.model.Colaborador;
import br.com.gutemberg.meuprojeto.model.Disponibilidade;
import br.com.gutemberg.meuprojeto.model.Escala;
import br.com.gutemberg.meuprojeto.model.Evento;
import br.com.gutemberg.meuprojeto.repository.DisponibilidadeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.when;

public class EscalaServiceTest {

    private EscalaService escalaService;
    private DisponibilidadeRepository disponibilidadeRepository;

    @BeforeEach
    public void setUp() {
        disponibilidadeRepository = Mockito.mock(DisponibilidadeRepository.class);
        escalaService = new EscalaService(null, null, null, null, disponibilidadeRepository);
    }

    @Test
    public void testColaboradorMarcadoComoIndisponivelParaOEventoNaoDeveSerEscalado() {
        // Arrange
        Colaborador c1 = Colaborador.builder().id(1L).nome("João").build();
        Colaborador c2 = Colaborador.builder().id(2L).nome("Maria").build();

        Evento evento = Evento.builder()
                .id(1L)
                .nome("Plantão Matutino")
                .data(LocalDate.of(2026, 7, 10))
                .horaInicio(LocalTime.of(8, 0))
                .vagasNecessarias(1)
                .build();

        Escala escala = Escala.builder()
                .id(1L)
                .nome("Escala Teste")
                .dataInicio(LocalDate.of(2026, 7, 1))
                .dataFim(LocalDate.of(2026, 7, 31))
                .eventos(List.of(evento))
                .build();

        // Stubbing repository to return c1 as unavailable for this event
        when(disponibilidadeRepository.findByEventoIn(anyCollection()))
                .thenReturn(List.of(
                        Disponibilidade.builder()
                                .colaborador(c1)
                                .evento(evento)
                                .indisponivel(true)
                                .build()
                ));

        // Act
        RelatorioGeracao relatorio = escalaService.gerarEscalaEmMemoria(escala, List.of(c1, c2));

        // Assert
        assertEquals(1, relatorio.getVagasPreenchidas());
        assertEquals(0, relatorio.getVagasRestantes());
        assertEquals("TOTALMENTE_PREENCHIDO", relatorio.getStatusEventos().get(0).getStatus());
        assertEquals(c2, escala.getAlocacoes().get(0).getColaborador()); // Maria escalada, João indisponível
    }

    @Test
    public void testEventoSemCandidatosDisponiveisGeraRelatorioDeErro() {
        // Arrange
        Colaborador c1 = Colaborador.builder().id(1L).nome("João").build();

        Evento evento = Evento.builder()
                .id(1L)
                .nome("Plantão Especial")
                .data(LocalDate.of(2026, 7, 10))
                .horaInicio(LocalTime.of(8, 0))
                .vagasNecessarias(1)
                .build();

        Escala escala = Escala.builder()
                .id(1L)
                .nome("Escala Teste")
                .dataInicio(LocalDate.of(2026, 7, 1))
                .dataFim(LocalDate.of(2026, 7, 31))
                .eventos(List.of(evento))
                .build();

        // João indisponível para este evento
        when(disponibilidadeRepository.findByEventoIn(anyCollection()))
                .thenReturn(List.of(
                        Disponibilidade.builder()
                                .colaborador(c1)
                                .evento(evento)
                                .indisponivel(true)
                                .build()
                ));

        // Act
        RelatorioGeracao relatorio = escalaService.gerarEscalaEmMemoria(escala, List.of(c1));

        // Assert
        assertEquals(0, relatorio.getVagasPreenchidas());
        assertEquals(1, relatorio.getVagasRestantes());
        StatusEvento status = relatorio.getStatusEventos().get(0);
        assertEquals("NAO_PREENCHIDO", status.getStatus());
        assertTrue(status.getMotivo().contains("Sem colaboradores"));
    }

    @Test
    public void testBalanceamentoEntreColaboradoresDistribuiPlantoesIgualmente() {
        // Arrange
        Colaborador c1 = Colaborador.builder().id(1L).nome("João").build();
        Colaborador c2 = Colaborador.builder().id(2L).nome("Maria").build();

        // Três eventos em dias diferentes
        Evento e1 = Evento.builder().id(1L).nome("E1").data(LocalDate.of(2026, 7, 10)).horaInicio(LocalTime.of(8, 0)).vagasNecessarias(1).build();
        Evento e2 = Evento.builder().id(2L).nome("E2").data(LocalDate.of(2026, 7, 11)).horaInicio(LocalTime.of(8, 0)).vagasNecessarias(1).build();
        Evento e3 = Evento.builder().id(3L).nome("E3").data(LocalDate.of(2026, 7, 12)).horaInicio(LocalTime.of(8, 0)).vagasNecessarias(1).build();

        Escala escala = Escala.builder()
                .id(1L)
                .nome("Escala Teste")
                .dataInicio(LocalDate.of(2026, 7, 1))
                .dataFim(LocalDate.of(2026, 7, 31))
                .eventos(List.of(e1, e2, e3))
                .build();

        when(disponibilidadeRepository.findByEventoIn(anyCollection())).thenReturn(new ArrayList<>());

        // Act
        RelatorioGeracao relatorio = escalaService.gerarEscalaEmMemoria(escala, List.of(c1, c2));

        // Assert
        assertEquals(3, relatorio.getVagasPreenchidas());
        
        // Verifica as alocações:
        // Como o desempate é por nome/id, o primeiro evento (e1) vai para João (c1)
        // O segundo evento (e2) vai para Maria (c2), pois João já tem 1 alocação e Maria tem 0.
        // O terceiro evento (e3) vai para João (c1), pois ambos têm 1 alocação, mas João desempata no nome/id.
        assertEquals(c1, escala.getAlocacoes().get(0).getColaborador()); // João
        assertEquals(c2, escala.getAlocacoes().get(1).getColaborador()); // Maria
        assertEquals(c1, escala.getAlocacoes().get(2).getColaborador()); // João
    }

    @Test
    public void testColaboradorNaoPodeTerMaisDeUmPlantaoNoMesmoDia() {
        // Arrange
        Colaborador c1 = Colaborador.builder().id(1L).nome("João").build();

        // Dois eventos no mesmo dia em horários diferentes:
        // Evento 1: 08:00
        // Evento 2: 14:00 (mesmo dia -> conflito!)
        Evento e1 = Evento.builder().id(1L).nome("M1").data(LocalDate.of(2026, 7, 10)).horaInicio(LocalTime.of(8, 0)).vagasNecessarias(1).build();
        Evento e2 = Evento.builder().id(2L).nome("M2").data(LocalDate.of(2026, 7, 10)).horaInicio(LocalTime.of(14, 0)).vagasNecessarias(1).build();

        Escala escala = Escala.builder()
                .id(1L)
                .nome("Escala Teste")
                .dataInicio(LocalDate.of(2026, 7, 1))
                .dataFim(LocalDate.of(2026, 7, 31))
                .eventos(List.of(e1, e2))
                .build();

        when(disponibilidadeRepository.findByEventoIn(anyCollection())).thenReturn(new ArrayList<>());

        // Act
        RelatorioGeracao relatorio = escalaService.gerarEscalaEmMemoria(escala, List.of(c1));

        // Assert
        assertEquals(1, relatorio.getVagasPreenchidas());
        assertEquals(1, relatorio.getVagasRestantes());
        assertEquals("TOTALMENTE_PREENCHIDO", relatorio.getStatusEventos().get(0).getStatus()); // e1 preenchido por João
        assertEquals("NAO_PREENCHIDO", relatorio.getStatusEventos().get(1).getStatus()); // e2 não preenchido por conflito de data
    }

    @Test
    public void testExclusaoMutuaNaoTrabalharComEvitaMesmoEvento() {
        // Arrange
        // João (c1) não pode trabalhar com Maria (c2)
        Colaborador c1 = Colaborador.builder().id(1L).nome("João").naoTrabalharCom(List.of(2L)).build();
        Colaborador c2 = Colaborador.builder().id(2L).nome("Maria").naoTrabalharCom(List.of(1L)).build();

        // Evento necessita de 2 vagas
        Evento e1 = Evento.builder().id(1L).nome("Missa").data(LocalDate.of(2026, 7, 10)).horaInicio(LocalTime.of(10, 0)).vagasNecessarias(2).build();

        Escala escala = Escala.builder()
                .id(1L)
                .nome("Escala Teste")
                .dataInicio(LocalDate.of(2026, 7, 1))
                .dataFim(LocalDate.of(2026, 7, 31))
                .eventos(List.of(e1))
                .build();

        when(disponibilidadeRepository.findByEventoIn(anyCollection())).thenReturn(new ArrayList<>());

        // Act
        RelatorioGeracao relatorio = escalaService.gerarEscalaEmMemoria(escala, List.of(c1, c2));

        // Assert
        // Apenas 1 das 2 vagas deve ser preenchida, pois eles não podem servir juntos no mesmo evento
        assertEquals(1, relatorio.getVagasPreenchidas());
        assertEquals(1, relatorio.getVagasRestantes());
    }

    @Test
    public void testPreferenciaDeTrabalhoPriorizaAlocacaoConjunta() {
        // Arrange
        // João (c1) prefere trabalhar com Maria (c2)
        Colaborador c1 = Colaborador.builder().id(1L).nome("João").preferenciaTrabalharCom(List.of(2L)).build();
        Colaborador c2 = Colaborador.builder().id(2L).nome("Maria").preferenciaTrabalharCom(List.of(1L)).build();
        Colaborador c3 = Colaborador.builder().id(3L).nome("Pedro").build();

        // Evento com 2 vagas
        Evento e1 = Evento.builder().id(1L).nome("Missa").data(LocalDate.of(2026, 7, 10)).horaInicio(LocalTime.of(10, 0)).vagasNecessarias(2).build();

        Escala escala = Escala.builder()
                .id(1L)
                .nome("Escala Teste")
                .dataInicio(LocalDate.of(2026, 7, 1))
                .dataFim(LocalDate.of(2026, 7, 31))
                .eventos(List.of(e1))
                .build();

        when(disponibilidadeRepository.findByEventoIn(anyCollection())).thenReturn(new ArrayList<>());

        // Act
        RelatorioGeracao relatorio = escalaService.gerarEscalaEmMemoria(escala, List.of(c1, c2, c3));

        // Assert
        // Ambas as vagas devem ser preenchidas por João e Maria devido à preferência mútua
        assertEquals(2, relatorio.getVagasPreenchidas());
        assertEquals(c1, escala.getAlocacoes().get(0).getColaborador());
        assertEquals(c2, escala.getAlocacoes().get(1).getColaborador());
    }
}
