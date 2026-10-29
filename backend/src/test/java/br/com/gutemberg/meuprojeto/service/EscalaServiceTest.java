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
        List<Colaborador> alocados = escala.getAlocacoes().stream().map(br.com.gutemberg.meuprojeto.model.Alocacao::getColaborador).toList();
        assertTrue(alocados.contains(c1));
        assertTrue(alocados.contains(c2));
    }

    @Test
    public void testParceriaDisponibilidadeComum_EscaladosObrigatoriamenteJuntos() {
        // Katia marcada como parceria de Aldemirio + ambos disponíveis -> sempre aparecem juntos
        Colaborador katia = Colaborador.builder().id(10L).nome("Katia").preferenciaTrabalharCom(List.of(20L)).build();
        Colaborador aldemirio = Colaborador.builder().id(20L).nome("Aldemirio").build();
        Colaborador outro = Colaborador.builder().id(30L).nome("Carlos").build();

        Evento evento = Evento.builder()
                .id(1L)
                .nome("Missa de Domingo")
                .data(LocalDate.of(2026, 8, 2))
                .horaInicio(LocalTime.of(19, 0))
                .vagasNecessarias(2)
                .build();

        Escala escala = Escala.builder()
                .id(1L)
                .nome("Escala Agosto")
                .dataInicio(LocalDate.of(2026, 8, 1))
                .dataFim(LocalDate.of(2026, 8, 31))
                .eventos(List.of(evento))
                .build();

        when(disponibilidadeRepository.findByEventoIn(anyCollection())).thenReturn(new ArrayList<>());

        RelatorioGeracao relatorio = escalaService.gerarEscalaEmMemoria(escala, List.of(katia, aldemirio, outro));

        assertEquals(2, relatorio.getVagasPreenchidas());
        List<Colaborador> alocados = escala.getAlocacoes().stream()
                .map(br.com.gutemberg.meuprojeto.model.Alocacao::getColaborador)
                .toList();
        assertTrue(alocados.contains(katia), "Katia deve estar escalada");
        assertTrue(alocados.contains(aldemirio), "Aldemirio deve estar escalado junto com Katia");
    }

    @Test
    public void testParceriaDisponibilidadeParcial_EscalaDisponivelSozinho() {
        // Se só um estiver disponível -> o disponível pode ser escalado sozinho
        Colaborador katia = Colaborador.builder().id(10L).nome("Katia").preferenciaTrabalharCom(List.of(20L)).build();
        Colaborador aldemirio = Colaborador.builder().id(20L).nome("Aldemirio").build();

        Evento evento = Evento.builder()
                .id(1L)
                .nome("Missa Sabatina")
                .data(LocalDate.of(2026, 8, 1))
                .horaInicio(LocalTime.of(18, 0))
                .vagasNecessarias(1)
                .build();

        Escala escala = Escala.builder()
                .id(1L)
                .nome("Escala Agosto")
                .dataInicio(LocalDate.of(2026, 8, 1))
                .dataFim(LocalDate.of(2026, 8, 31))
                .eventos(List.of(evento))
                .build();

        // Aldemirio está indisponível para este evento
        when(disponibilidadeRepository.findByEventoIn(anyCollection()))
                .thenReturn(List.of(
                        Disponibilidade.builder()
                                .colaborador(aldemirio)
                                .evento(evento)
                                .indisponivel(true)
                                .build()
                ));

        RelatorioGeracao relatorio = escalaService.gerarEscalaEmMemoria(escala, List.of(katia, aldemirio));

        // Katia pode ser escalada sozinha já que Aldemirio não está disponível
        assertEquals(1, relatorio.getVagasPreenchidas());
        assertEquals(katia, escala.getAlocacoes().get(0).getColaborador());
    }

    @Test
    public void testParceriaConflitoNaoTrabalharCom_PriorizaConflitoERegistraAviso() {
        // Conflito ("Não trabalhar com") SEMPRE vence a parceria
        Colaborador c1 = Colaborador.builder().id(1L).nome("Katia")
                .preferenciaTrabalharCom(List.of(2L))
                .build();
        Colaborador c2 = Colaborador.builder().id(2L).nome("Aldemirio")
                .naoTrabalharCom(List.of(1L))
                .build();

        Evento evento = Evento.builder()
                .id(1L)
                .nome("Culto")
                .data(LocalDate.of(2026, 8, 1))
                .horaInicio(LocalTime.of(10, 0))
                .vagasNecessarias(2)
                .build();

        Escala escala = Escala.builder()
                .id(1L)
                .nome("Escala Agosto")
                .dataInicio(LocalDate.of(2026, 8, 1))
                .dataFim(LocalDate.of(2026, 8, 31))
                .eventos(List.of(evento))
                .build();

        when(disponibilidadeRepository.findByEventoIn(anyCollection())).thenReturn(new ArrayList<>());

        RelatorioGeracao relatorio = escalaService.gerarEscalaEmMemoria(escala, List.of(c1, c2));

        // Não devem ser escalados juntos no mesmo evento (apenas 1 vaga preenchida)
        assertEquals(1, relatorio.getVagasPreenchidas());
        // Deve registrar aviso de conflito sobrepondo a parceria
        assertTrue(relatorio.getAvisos().stream().anyMatch(a -> a.contains("Conflito") && a.contains("Katia") && a.contains("Aldemirio")),
                "Deve existir aviso informando que a parceria foi ignorada devido a conflito");
    }

    @Test
    public void testParceriaVagasInsuficientes_NaoQuebraEscalaEGeraAviso() {
        // Vagas insuficientes para a parceria -> não quebra, não escala parcialmente, e gera aviso
        Colaborador c1 = Colaborador.builder().id(1L).nome("Katia").preferenciaTrabalharCom(List.of(2L)).build();
        Colaborador c2 = Colaborador.builder().id(2L).nome("Aldemirio").build();

        // Evento com apenas 1 vaga disponível
        Evento evento = Evento.builder()
                .id(1L)
                .nome("Plantão Único")
                .data(LocalDate.of(2026, 8, 1))
                .horaInicio(LocalTime.of(8, 0))
                .vagasNecessarias(1)
                .build();

        Escala escala = Escala.builder()
                .id(1L)
                .nome("Escala Agosto")
                .dataInicio(LocalDate.of(2026, 8, 1))
                .dataFim(LocalDate.of(2026, 8, 31))
                .eventos(List.of(evento))
                .build();

        when(disponibilidadeRepository.findByEventoIn(anyCollection())).thenReturn(new ArrayList<>());

        RelatorioGeracao relatorio = escalaService.gerarEscalaEmMemoria(escala, List.of(c1, c2));

        // Nenhum dos dois é escalado pois a parceria precisa de 2 vagas
        assertEquals(0, relatorio.getVagasPreenchidas());
        assertEquals(1, relatorio.getVagasRestantes());
        // Deve registrar aviso de vagas insuficientes
        assertTrue(relatorio.getAvisos().stream().anyMatch(a -> a.contains("vagas insuficientes") && a.contains("Katia") && a.contains("Aldemirio")),
                "Deve registrar aviso claro de vagas insuficientes para a parceria");
    }

    @Test
    public void testParceriaUnidirecional_TratadaComoBidirecional() {
        // Se A marcou B, mesmo que B não tenha marcado A, par é tratado como vinculado
        Colaborador c1 = Colaborador.builder().id(1L).nome("Ana").preferenciaTrabalharCom(List.of(2L)).build();
        Colaborador c2 = Colaborador.builder().id(2L).nome("Bruno").preferenciaTrabalharCom(new ArrayList<>()).build();

        Evento evento = Evento.builder()
                .id(1L)
                .nome("Evento 2 Vagas")
                .data(LocalDate.of(2026, 8, 5))
                .horaInicio(LocalTime.of(10, 0))
                .vagasNecessarias(2)
                .build();

        Escala escala = Escala.builder()
                .id(1L)
                .nome("Escala Agosto")
                .dataInicio(LocalDate.of(2026, 8, 1))
                .dataFim(LocalDate.of(2026, 8, 31))
                .eventos(List.of(evento))
                .build();

        when(disponibilidadeRepository.findByEventoIn(anyCollection())).thenReturn(new ArrayList<>());

        RelatorioGeracao relatorio = escalaService.gerarEscalaEmMemoria(escala, List.of(c1, c2));

        assertEquals(2, relatorio.getVagasPreenchidas());
        List<Colaborador> alocados = escala.getAlocacoes().stream().map(br.com.gutemberg.meuprojeto.model.Alocacao::getColaborador).toList();
        assertTrue(alocados.contains(c1));
        assertTrue(alocados.contains(c2));
    }

    @Test
    public void testParceriaEmCadeia_GrupoCompletoEscaladoJunto() {
        // A->B, B->C formam grupo de 3 membros
        Colaborador a = Colaborador.builder().id(1L).nome("Ana").preferenciaTrabalharCom(List.of(2L)).build();
        Colaborador b = Colaborador.builder().id(2L).nome("Bruno").preferenciaTrabalharCom(List.of(3L)).build();
        Colaborador c = Colaborador.builder().id(3L).nome("Carlos").build();

        Evento evento = Evento.builder()
                .id(1L)
                .nome("Missa Solene")
                .data(LocalDate.of(2026, 8, 15))
                .horaInicio(LocalTime.of(10, 0))
                .vagasNecessarias(3)
                .build();

        Escala escala = Escala.builder()
                .id(1L)
                .nome("Escala Agosto")
                .dataInicio(LocalDate.of(2026, 8, 1))
                .dataFim(LocalDate.of(2026, 8, 31))
                .eventos(List.of(evento))
                .build();

        when(disponibilidadeRepository.findByEventoIn(anyCollection())).thenReturn(new ArrayList<>());

        RelatorioGeracao relatorio = escalaService.gerarEscalaEmMemoria(escala, List.of(a, b, c));

        assertEquals(3, relatorio.getVagasPreenchidas());
        List<Colaborador> alocados = escala.getAlocacoes().stream().map(br.com.gutemberg.meuprojeto.model.Alocacao::getColaborador).toList();
        assertTrue(alocados.contains(a));
        assertTrue(alocados.contains(b));
        assertTrue(alocados.contains(c));
    }

    @Test
    public void testParceriaEmCadeia_VagasInsuficientesNaoAlocaGrupoIncompleto() {
        // A->B, B->C (grupo de 3), mas o evento só tem 2 vagas -> não escala nenhum membro do trio
        Colaborador a = Colaborador.builder().id(1L).nome("Ana").preferenciaTrabalharCom(List.of(2L)).build();
        Colaborador b = Colaborador.builder().id(2L).nome("Bruno").preferenciaTrabalharCom(List.of(3L)).build();
        Colaborador c = Colaborador.builder().id(3L).nome("Carlos").build();

        Evento evento = Evento.builder()
                .id(1L)
                .nome("Missa Normal")
                .data(LocalDate.of(2026, 8, 15))
                .horaInicio(LocalTime.of(10, 0))
                .vagasNecessarias(2)
                .build();

        Escala escala = Escala.builder()
                .id(1L)
                .nome("Escala Agosto")
                .dataInicio(LocalDate.of(2026, 8, 1))
                .dataFim(LocalDate.of(2026, 8, 31))
                .eventos(List.of(evento))
                .build();

        when(disponibilidadeRepository.findByEventoIn(anyCollection())).thenReturn(new ArrayList<>());

        RelatorioGeracao relatorio = escalaService.gerarEscalaEmMemoria(escala, List.of(a, b, c));

        // Não aloca nenhum do trio incompleto
        assertEquals(0, relatorio.getVagasPreenchidas());
        assertEquals(2, relatorio.getVagasRestantes());
        assertTrue(relatorio.getAvisos().stream().anyMatch(aviso -> aviso.contains("vagas insuficientes")),
                "Deve registrar aviso de vagas insuficientes para a cadeia de parceria");
    }

    @Test
    public void testContabilizacaoIndividualLimitesEscalas() {
        // Cada membro do grupo de parceria deve ser contabilizado individualmente no balanceamento
        Colaborador katia = Colaborador.builder().id(1L).nome("Katia").preferenciaTrabalharCom(List.of(2L)).build();
        Colaborador aldemirio = Colaborador.builder().id(2L).nome("Aldemirio").build();
        Colaborador daniel = Colaborador.builder().id(3L).nome("Daniel").build();

        // Evento 1 no dia 10: 2 vagas (aloca Katia + Aldemirio)
        Evento e1 = Evento.builder().id(1L).nome("E1").data(LocalDate.of(2026, 8, 10)).horaInicio(LocalTime.of(8, 0)).vagasNecessarias(2).build();
        // Evento 2 no dia 11: 1 vaga. Daniel tem 0 alocações, Katia tem 1, Aldemirio tem 1. Daniel deve ser escolhido!
        Evento e2 = Evento.builder().id(2L).nome("E2").data(LocalDate.of(2026, 8, 11)).horaInicio(LocalTime.of(8, 0)).vagasNecessarias(1).build();

        Escala escala = Escala.builder()
                .id(1L)
                .nome("Escala Teste")
                .dataInicio(LocalDate.of(2026, 8, 1))
                .dataFim(LocalDate.of(2026, 8, 31))
                .eventos(List.of(e1, e2))
                .build();

        when(disponibilidadeRepository.findByEventoIn(anyCollection())).thenReturn(new ArrayList<>());

        RelatorioGeracao relatorio = escalaService.gerarEscalaEmMemoria(escala, List.of(katia, aldemirio, daniel));

        assertEquals(3, relatorio.getVagasPreenchidas());
        // Alocações do evento 2: deve ser Daniel
        List<Colaborador> alocadosE2 = escala.getAlocacoes().stream()
                .filter(a -> a.getEvento().getId().equals(2L))
                .map(br.com.gutemberg.meuprojeto.model.Alocacao::getColaborador)
                .toList();
        assertEquals(1, alocadosE2.size());
        assertEquals(daniel, alocadosE2.get(0), "Daniel com 0 escalas deve ter prioridade sobre os parceiros que já possuem 1 escala cada");
    }
}
