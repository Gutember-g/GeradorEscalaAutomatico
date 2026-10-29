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
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Queue;
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

        // Salvar os avisos gerados na escala
        escala.setAvisos(relatorio.getAvisos());
        escalaRepository.save(escala);
        
        return relatorio;
    }

    public RelatorioGeracao gerarEscalaEmMemoria(Escala escala, List<Colaborador> colaboradores) {
        List<String> avisos = new ArrayList<>();
        List<Evento> eventos = escala.getEventos() != null ? escala.getEventos() : Collections.emptyList();
        
        // Ordenar os eventos por data e depois por hora de início
        List<Evento> eventosOrdenados = eventos.stream()
                .sorted(Comparator.comparing(Evento::getData).thenComparing(Evento::getHoraInicio))
                .collect(Collectors.toList());

        List<Alocacao> alocacoesGeradas = new ArrayList<>();
        List<StatusEvento> statusEventos = new ArrayList<>();
        
        // Mapa para busca rápida de colaboradores por ID
        Map<Long, Colaborador> colabMap = new HashMap<>();
        // Mapa para controlar a contagem de alocações de cada colaborador para o balanceamento
        Map<Colaborador, Integer> contagemAlocacoes = new HashMap<>();
        for (Colaborador c : colaboradores) {
            colabMap.put(c.getId(), c);
            contagemAlocacoes.put(c, 0);
        }

        // Construir grafo bidirecional de parcerias, aplicando a precedência de conflito ("Não trabalhar com")
        Map<Long, Set<Long>> grafoParcerias = construirGrafoParcerias(colaboradores, colabMap, avisos);

        // Carregar indisponibilidades para estes eventos
        Long tenantId = escala.getOrganizacao() != null ? escala.getOrganizacao().getId() : null;
        List<Disponibilidade> indisponibilidades = Collections.emptyList();
        if (disponibilidadeRepository != null && !eventos.isEmpty()) {
            indisponibilidades = tenantId != null 
                    ? disponibilidadeRepository.findByOrganizacaoIdAndEventoIn(tenantId, eventos)
                    : disponibilidadeRepository.findByEventoIn(eventos);
        }
        
        Map<Long, Set<Long>> mapIndisponiveis = new HashMap<>(); // colaboradorId -> Set of eventoIds
        for (Disponibilidade d : indisponibilidades) {
            if (d.isIndisponivel() && d.getColaborador() != null && d.getEvento() != null) {
                mapIndisponiveis.computeIfAbsent(d.getColaborador().getId(), k -> new HashSet<>()).add(d.getEvento().getId());
            }
        }

        int totalVagas = 0;
        int vagasPreenchidas = 0;

        for (Evento evento : eventosOrdenados) {
            int vagasNecessarias = evento.getVagasNecessarias();
            totalVagas += vagasNecessarias;
            int preenchidasParaOEvento = 0;
            
            // Colaboradores já alocados para ESTE evento específico
            List<Colaborador> alocadosNoEvento = new ArrayList<>();
            Set<String> parceriasNaoAtendidasNoEvento = new HashSet<>();

            while (preenchidasParaOEvento < vagasNecessarias) {
                int vagasRestantes = vagasNecessarias - preenchidasParaOEvento;

                // 1. Identificar IDs de colaboradores elegíveis no momento atual para este evento
                Set<Long> idsElegiveis = new HashSet<>();
                for (Colaborador c : colaboradores) {
                    if (alocadosNoEvento.contains(c)) {
                        continue;
                    }
                    Set<Long> eventosIndisponiveis = mapIndisponiveis.get(c.getId());
                    if (eventosIndisponiveis != null && eventosIndisponiveis.contains(evento.getId())) {
                        continue;
                    }
                    if (temConflitoDeHorario(c, evento, alocacoesGeradas)) {
                        continue;
                    }
                    boolean conflitoComAlocados = false;
                    for (Colaborador alocado : alocadosNoEvento) {
                        if ((c.getNaoTrabalharCom() != null && c.getNaoTrabalharCom().contains(alocado.getId())) ||
                            (alocado.getNaoTrabalharCom() != null && alocado.getNaoTrabalharCom().contains(c.getId()))) {
                            conflitoComAlocados = true;
                            break;
                        }
                    }
                    if (conflitoComAlocados) {
                        continue;
                    }

                    idsElegiveis.add(c.getId());
                }

                if (idsElegiveis.isEmpty()) {
                    break;
                }

                // 2. Agrupar colaboradores elegíveis em componentes de parceria (grupos vinculados com disponibilidade em comum)
                List<List<Colaborador>> gruposCandidatos = obterGruposElegiveis(idsElegiveis, grafoParcerias, colabMap, avisos, evento);

                // 3. Filtrar apenas grupos que cabem inteiramente nas vagas restantes
                List<List<Colaborador>> gruposQueCabem = new ArrayList<>();
                for (List<Colaborador> grupo : gruposCandidatos) {
                    if (grupo.size() <= vagasRestantes) {
                        gruposQueCabem.add(grupo);
                    } else if (grupo.size() > 1) {
                        // Grupo de parceria não pôde ser atendido por falta de vagas
                        String nomesGrupo = grupo.stream().map(Colaborador::getNome).sorted().collect(Collectors.joining(" + "));
                        String chaveAviso = evento.getId() + ":" + nomesGrupo;
                        if (parceriasNaoAtendidasNoEvento.add(chaveAviso)) {
                            avisos.add("Aviso: Parceria " + nomesGrupo + " não pôde ser atendida no evento '" + evento.getNome() + "' (" + evento.getData() + "): vagas insuficientes (necessárias: " + grupo.size() + ", disponíveis: " + vagasRestantes + ").");
                        }
                    }
                }

                if (gruposQueCabem.isEmpty()) {
                    // Nenhum grupo disponível cabe nas vagas restantes
                    break;
                }

                // 4. Ordenar grupos candidatos por:
                // a) Menor média de alocações (workload balance)
                // b) Maior tamanho de grupo (prioriza atender parcerias antes de individuais)
                // c) Menor alocação individual
                // d) Ordem alfabética do menor nome do grupo
                // e) Menor ID
                gruposQueCabem.sort(Comparator
                        .comparingDouble((List<Colaborador> g) -> g.stream().mapToInt(c -> contagemAlocacoes.getOrDefault(c, 0)).average().orElse(0.0))
                        .thenComparing((List<Colaborador> g) -> -g.size())
                        .thenComparingInt((List<Colaborador> g) -> g.stream().mapToInt(c -> contagemAlocacoes.getOrDefault(c, 0)).min().orElse(0))
                        .thenComparing((List<Colaborador> g) -> g.stream().map(Colaborador::getNome).min(Comparator.nullsLast(Comparator.naturalOrder())).orElse(""))
                        .thenComparingLong((List<Colaborador> g) -> g.stream().mapToLong(c -> c.getId() != null ? c.getId() : 0L).min().orElse(0L)));

                List<Colaborador> grupoSelecionado = gruposQueCabem.get(0);

                // 5. Alocar todos os colaboradores do grupo selecionado no evento
                for (Colaborador selecionado : grupoSelecionado) {
                    Alocacao alocacao = Alocacao.builder()
                            .escala(escala)
                            .evento(evento)
                            .colaborador(selecionado)
                            .build();

                    alocacoesGeradas.add(alocacao);
                    alocadosNoEvento.add(selecionado);
                    contagemAlocacoes.put(selecionado, contagemAlocacoes.getOrDefault(selecionado, 0) + 1);
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
                motivo = "Sem colaboradores suficientes disponíveis por indisponibilidade, conflito de horário ou vagas insuficientes para grupos de parceria";
            } else {
                status = "NAO_PREENCHIDO";
                motivo = "Sem colaboradores disponíveis por indisponibilidade, conflito de horário ou vagas insuficientes para grupos de parceria";
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

        // Vincular alocações e avisos à escala
        escala.setAlocacoes(alocacoesGeradas);
        escala.setAvisos(avisos);

        return RelatorioGeracao.builder()
                .escalaId(escala.getId())
                .nomeEscala(escala.getNome())
                .totalVagas(totalVagas)
                .vagasPreenchidas(vagasPreenchidas)
                .vagasRestantes(totalVagas - vagasPreenchidas)
                .statusEventos(statusEventos)
                .avisos(avisos)
                .build();
    }

    /**
     * Constrói o grafo de parcerias bidirecional e remove qualquer parceria que possua restrição
     * de conflito ("Não trabalhar com"), adicionando aviso no relatório.
     */
    private Map<Long, Set<Long>> construirGrafoParcerias(List<Colaborador> colaboradores, Map<Long, Colaborador> colabMap, List<String> avisos) {
        Map<Long, Set<Long>> grafo = new HashMap<>();
        for (Colaborador c : colaboradores) {
            grafo.put(c.getId(), new HashSet<>());
        }

        Set<String> conflitosRegistrados = new HashSet<>();

        for (Colaborador u : colaboradores) {
            if (u.getPreferenciaTrabalharCom() == null) continue;

            for (Long vId : u.getPreferenciaTrabalharCom()) {
                Colaborador v = colabMap.get(vId);
                if (v == null || u.getId().equals(vId)) continue;

                boolean uNaoTrabalhaV = u.getNaoTrabalharCom() != null && u.getNaoTrabalharCom().contains(vId);
                boolean vNaoTrabalhaU = v.getNaoTrabalharCom() != null && v.getNaoTrabalharCom().contains(u.getId());

                if (uNaoTrabalhaV || vNaoTrabalhaU) {
                    // Precedência de conflito: conflito SEMPRE vence parceria
                    String parChave = Math.min(u.getId(), vId) + "-" + Math.max(u.getId(), vId);
                    if (conflitosRegistrados.add(parChave)) {
                        avisos.add("Conflito: A parceria entre " + u.getNome() + " e " + v.getNome() +
                                " foi ignorada porque há uma restrição de conflito ('Não trabalhar com').");
                    }
                } else {
                    // Relação bidirecional garantida no grafo de parcerias
                    grafo.get(u.getId()).add(vId);
                    grafo.computeIfAbsent(vId, k -> new HashSet<>()).add(u.getId());
                }
            }
        }

        return grafo;
    }

    /**
     * Encontra componentes conexas (grupos vinculados) para os colaboradores elegíveis no evento.
     * Trata vínculos diretos e em cadeia (A->B, B->C) como grupo único.
     */
    private List<List<Colaborador>> obterGruposElegiveis(Set<Long> idsElegiveis, Map<Long, Set<Long>> grafoParcerias, Map<Long, Colaborador> colabMap, List<String> avisos, Evento evento) {
        Set<Long> visitados = new HashSet<>();
        List<List<Colaborador>> grupos = new ArrayList<>();

        for (Long id : idsElegiveis) {
            if (visitados.contains(id)) continue;

            List<Colaborador> componente = new ArrayList<>();
            Queue<Long> fila = new LinkedList<>();
            fila.add(id);
            visitados.add(id);

            while (!fila.isEmpty()) {
                Long atualId = fila.poll();
                Colaborador c = colabMap.get(atualId);
                if (c != null) {
                    componente.add(c);
                }

                Set<Long> vizinhos = grafoParcerias.getOrDefault(atualId, Collections.emptySet());
                for (Long vizId : vizinhos) {
                    if (idsElegiveis.contains(vizId) && !visitados.contains(vizId)) {
                        visitados.add(vizId);
                        fila.add(vizId);
                    }
                }
            }

            // Validar conflitos internos dentro da componente
            boolean conflitoInterno = false;
            for (int i = 0; i < componente.size(); i++) {
                Colaborador c1 = componente.get(i);
                for (int j = i + 1; j < componente.size(); j++) {
                    Colaborador c2 = componente.get(j);
                    boolean c1NaoTrabalhaC2 = c1.getNaoTrabalharCom() != null && c1.getNaoTrabalharCom().contains(c2.getId());
                    boolean c2NaoTrabalhaC1 = c2.getNaoTrabalharCom() != null && c2.getNaoTrabalharCom().contains(c1.getId());
                    if (c1NaoTrabalhaC2 || c2NaoTrabalhaC1) {
                        conflitoInterno = true;
                        avisos.add("Conflito: Vínculo de grupo entre " + c1.getNome() + " e " + c2.getNome() +
                                " no evento '" + evento.getNome() + "' foi desmembrado devido a conflito de 'Não trabalhar com'.");
                        break;
                    }
                }
                if (conflitoInterno) break;
            }

            if (conflitoInterno) {
                // Se houver conflito interno no grupo encadeado, desmembra os colaboradores individualmente
                for (Colaborador c : componente) {
                    grupos.add(List.of(c));
                }
            } else {
                grupos.add(componente);
            }
        }

        return grupos;
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
