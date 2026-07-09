package br.com.gutemberg.meuprojeto.service;

import br.com.gutemberg.meuprojeto.dto.RelatorioGeracao;
import br.com.gutemberg.meuprojeto.dto.StatusEvento;
import br.com.gutemberg.meuprojeto.model.Alocacao;
import br.com.gutemberg.meuprojeto.model.Colaborador;
import br.com.gutemberg.meuprojeto.model.Disponibilidade;
import br.com.gutemberg.meuprojeto.model.Escala;
import br.com.gutemberg.meuprojeto.model.Evento;
import br.com.gutemberg.meuprojeto.model.Organizacao;
import br.com.gutemberg.meuprojeto.repository.AlocacaoRepository;
import br.com.gutemberg.meuprojeto.repository.ColaboradorRepository;
import br.com.gutemberg.meuprojeto.repository.DisponibilidadeRepository;
import br.com.gutemberg.meuprojeto.repository.EscalaRepository;
import br.com.gutemberg.meuprojeto.repository.EventoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class EscalaService {

    private final ColaboradorRepository colaboradorRepository;
    private final EventoRepository eventoRepository;
    private final EscalaRepository escalaRepository;
    private final AlocacaoRepository alocacaoRepository;
    private final DisponibilidadeRepository disponibilidadeRepository;

    public EscalaService(ColaboradorRepository colaboradorRepository, EventoRepository eventoRepository, EscalaRepository escalaRepository, AlocacaoRepository alocacaoRepository, DisponibilidadeRepository disponibilidadeRepository) {
        this.colaboradorRepository = colaboradorRepository;
        this.eventoRepository = eventoRepository;
        this.escalaRepository = escalaRepository;
        this.alocacaoRepository = alocacaoRepository;
        this.disponibilidadeRepository = disponibilidadeRepository;
    }
    @Transactional
    public RelatorioGeracao gerarESalvarEscala(String nomeEscala, LocalDate dataInicio, LocalDate dataFim, List<Long> colaboradorIds, List<Evento> eventosAPreencher) {
        // Obter colaboradores
        List<Colaborador> colaboradores = colaboradorRepository.findAllById(colaboradorIds);
        
        // Obter organização a partir do primeiro colaborador ou contexto
        Organizacao org = null;
        if (!colaboradores.isEmpty()) {
            org = colaboradores.get(0).getOrganizacao();
        } else {
            Long tenantId = br.com.gutemberg.meuprojeto.security.SecurityUtils.getCurrentTenantId();
            if (tenantId != null) {
                org = new Organizacao();
                org.setId(tenantId);
            }
        }

        // Criar a Escala
        Escala escala = Escala.builder()
                .nome(nomeEscala)
                .dataInicio(dataInicio)
                .dataFim(dataFim)
                .organizacao(org)
                .build();
        
        // Salvar escala primeiro
        escala = escalaRepository.save(escala);
        
        // Deduplicar eventos por ID para evitar duplicatas acidentais
        Map<Long, Evento> uniqueEventosMap = new HashMap<>();
        for (Evento e : eventosAPreencher) {
            if (e.getId() != null) {
                uniqueEventosMap.put(e.getId(), e);
            } else {
                uniqueEventosMap.put(System.identityHashCode(e) * -1L, e);
            }
        }
        List<Evento> uniqueEventos = new ArrayList<>(uniqueEventosMap.values());

        // Associar eventos à escala
        for (Evento e : uniqueEventos) {
            e.setEscala(escala);
            if (e.getOrganizacao() == null) {
                e.setOrganizacao(escala.getOrganizacao());
            }
        }
        List<Evento> eventosSalvos = eventoRepository.saveAll(uniqueEventos);
        escala.setEventos(eventosSalvos);
        
        // Executar o algoritmo de alocação em memória
        RelatorioGeracao relatorio = gerarEscalaEmMemoria(escala, colaboradores);
        
        // Salvar as alocações geradas no banco
        alocacaoRepository.saveAll(escala.getAlocacoes());
        
        return relatorio;
    }

    public RelatorioGeracao gerarEscalaEmMemoria(Escala escala, List<Colaborador> colaboradores) {
        List<Evento> eventos = escala.getEventos();
        // Ordenar os eventos por data e depois por hora de início
        List<Evento> eventosOrdenados = eventos.stream()
                .sorted(Comparator.comparing(Evento::getData).thenComparing(Evento::getHoraInicio))
                .collect(Collectors.toList());

        List<Alocacao> alocacoesGeradas = new ArrayList<>();
        List<StatusEvento> statusEventos = new ArrayList<>();
        
        // Mapa para controlar a contagem de alocações de cada colaborador na escala atual para o balanceamento
        Map<Colaborador, Integer> contagemAlocacoes = new HashMap<>();
        for (Colaborador c : colaboradores) {
            contagemAlocacoes.put(c, 0);
        }

        // Carregar indisponibilidades para estes eventos
        Long tenantId = escala.getOrganizacao() != null ? escala.getOrganizacao().getId() : null;
        List<Disponibilidade> indisponibilidades = tenantId != null 
                ? disponibilidadeRepository.findByOrganizacaoIdAndEventoIn(tenantId, eventos)
                : disponibilidadeRepository.findByEventoIn(eventos);
        
        Map<Long, Set<Long>> mapIndisponiveis = new HashMap<>(); // colaboradorId -> Set of eventoIds
        for (Disponibilidade d : indisponibilidades) {
            if (d.isIndisponivel()) {
                mapIndisponiveis.computeIfAbsent(d.getColaborador().getId(), k -> new HashSet<>()).add(d.getEvento().getId());
            }
        }

        int totalVagas = 0;
        int vagasPreenchidas = 0;

        for (Evento evento : eventosOrdenados) {
            int vagasNecessarias = evento.getVagasNecessarias();
            totalVagas += vagasNecessarias;
            int preenchidasParaOEvento = 0;
            
            // Colaboradores já alocados para ESTE evento específico (para evitar duplicatas no mesmo evento)
            List<Colaborador> alocadosNoEvento = new ArrayList<>();

            for (int i = 0; i < vagasNecessarias; i++) {
                // Filtrar colaboradores elegíveis
                List<Colaborador> elegiveis = new ArrayList<>();
                for (Colaborador c : colaboradores) {
                    // 1. Já está alocado nesta vaga/evento?
                    if (alocadosNoEvento.contains(c)) {
                        continue;
                    }
                    // 2. Está marcado como indisponível para este evento?
                    Set<Long> eventosIndisponiveis = mapIndisponiveis.get(c.getId());
                    if (eventosIndisponiveis != null && eventosIndisponiveis.contains(evento.getId())) {
                        continue;
                    }
                    // 3. Tem conflito de horário (já alocado no mesmo dia)?
                    if (temConflitoDeHorario(c, evento, alocacoesGeradas)) {
                        continue;
                    }
                    // 4. Regra de exclusão mútua (não trabalhar com):
                    boolean conflitoNaoTrabalhar = false;
                    for (Colaborador alocado : alocadosNoEvento) {
                        if ((c.getNaoTrabalharCom() != null && c.getNaoTrabalharCom().contains(alocado.getId())) ||
                            (alocado.getNaoTrabalharCom() != null && alocado.getNaoTrabalharCom().contains(c.getId()))) {
                            conflitoNaoTrabalhar = true;
                            break;
                        }
                    }
                    if (conflitoNaoTrabalhar) {
                        continue;
                    }
                    
                    elegiveis.add(c);
                }

                if (elegiveis.isEmpty()) {
                    // Sem candidatos disponíveis para esta vaga
                    break;
                }

                // Seleção de candidatos:
                // 1. Menor workload na escala (para balanceamento)
                // 2. Preferência de parceria com quem já está alocado neste evento
                // 3. Critério estável por Nome
                // 4. Critério estável por ID
                final List<Colaborador> alocados = alocadosNoEvento;
                Colaborador selecionado = elegiveis.stream()
                        .min(Comparator.comparing((Colaborador c) -> contagemAlocacoes.get(c))
                                .thenComparing((Colaborador c) -> {
                                    boolean temPreferenciaMatch = false;
                                    for (Colaborador alocado : alocados) {
                                        if ((c.getPreferenciaTrabalharCom() != null && c.getPreferenciaTrabalharCom().contains(alocado.getId())) ||
                                            (alocado.getPreferenciaTrabalharCom() != null && alocado.getPreferenciaTrabalharCom().contains(c.getId()))) {
                                            temPreferenciaMatch = true;
                                            break;
                                        }
                                    }
                                    return temPreferenciaMatch ? 0 : 1; // 0 (com match) tem prioridade sobre 1 (sem match)
                                })
                                .thenComparing(Colaborador::getNome, Comparator.nullsLast(Comparator.naturalOrder()))
                                .thenComparing(c -> c.getId() != null ? c.getId() : 0L))
                        .orElse(null);

                if (selecionado != null) {
                    Alocacao alocacao = Alocacao.builder()
                            .escala(escala)
                            .evento(evento)
                            .colaborador(selecionado)
                            .build();
                    
                    alocacoesGeradas.add(alocacao);
                    alocadosNoEvento.add(selecionado);
                    contagemAlocacoes.put(selecionado, contagemAlocacoes.get(selecionado) + 1);
                    preenchidasParaOEvento++;
                    vagasPreenchidas++;
                }
            }

            // Registrar status do evento
            String status;
            String motivo = "OK";
            if (preenchidasParaOEvento == vagasNecessarias) {
                status = "TOTALMENTE_PREENCHIDO";
            } else if (preenchidasParaOEvento > 0) {
                status = "PARCIALMENTE_PREENCHIDO";
                motivo = "Sem colaboradores suficientes disponíveis por indisponibilidade ou conflito de horário";
            } else {
                status = "NAO_PREENCHIDO";
                motivo = "Sem colaboradores disponíveis por indisponibilidade ou conflito de horário";
            }

            List<String> ministrosNomes = alocadosNoEvento.stream()
                    .map(Colaborador::getNome)
                    .collect(Collectors.toList());

            statusEventos.add(StatusEvento.builder()
                    .eventoId(evento.getId())
                    .nome(evento.getNome())
                    .data(evento.getData())
                    .horaInicio(evento.getHoraInicio())
                    .corLiturgica(evento.getCorLiturgica())
                    .vagasNecessarias(vagasNecessarias)
                    .vagasPreenchidas(preenchidasParaOEvento)
                    .status(status)
                    .motivo(motivo)
                    .ministros(ministrosNomes)
                    .build());
        }

        // Vincular alocações à escala
        escala.setAlocacoes(alocacoesGeradas);

        return RelatorioGeracao.builder()
                .escalaId(escala.getId())
                .nomeEscala(escala.getNome())
                .totalVagas(totalVagas)
                .vagasPreenchidas(vagasPreenchidas)
                .vagasRestantes(totalVagas - vagasPreenchidas)
                .statusEventos(statusEventos)
                .build();
    }

    private boolean temConflitoDeHorario(Colaborador c, Evento eventoProposto, List<Alocacao> alocacoesExistentes) {
        for (Alocacao alocacao : alocacoesExistentes) {
            if (alocacao.getColaborador().equals(c)) {
                Evento eventoExistente = alocacao.getEvento();
                // Regra: No máximo 1 plantão por dia para cada colaborador
                if (eventoExistente.getData().equals(eventoProposto.getData())) {
                    return true;
                }
            }
        }
        return false;
    }
}
