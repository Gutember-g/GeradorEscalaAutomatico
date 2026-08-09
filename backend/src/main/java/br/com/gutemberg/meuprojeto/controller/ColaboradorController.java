package br.com.gutemberg.meuprojeto.controller;

import br.com.gutemberg.meuprojeto.dto.ColaboradorDTO;
import br.com.gutemberg.meuprojeto.dto.DisponibilidadeDTO;
import br.com.gutemberg.meuprojeto.model.Colaborador;
import br.com.gutemberg.meuprojeto.model.Disponibilidade;
import br.com.gutemberg.meuprojeto.model.Evento;
import br.com.gutemberg.meuprojeto.repository.ColaboradorRepository;
import br.com.gutemberg.meuprojeto.repository.DisponibilidadeRepository;
import br.com.gutemberg.meuprojeto.repository.EventoRepository;
import br.com.gutemberg.meuprojeto.repository.OrganizacaoRepository;
import br.com.gutemberg.meuprojeto.security.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/colaboradores")
@CrossOrigin(origins = "*")
public class ColaboradorController {

    private final ColaboradorRepository colaboradorRepository;
    private final EventoRepository eventoRepository;
    private final DisponibilidadeRepository disponibilidadeRepository;
    private final OrganizacaoRepository organizacaoRepository;

    public ColaboradorController(ColaboradorRepository colaboradorRepository, EventoRepository eventoRepository,
                                 DisponibilidadeRepository disponibilidadeRepository, OrganizacaoRepository organizacaoRepository) {
        this.colaboradorRepository = colaboradorRepository;
        this.eventoRepository = eventoRepository;
        this.disponibilidadeRepository = disponibilidadeRepository;
        this.organizacaoRepository = organizacaoRepository;
    }

    // ─── G1+G2: carrega todos com batch FETCH (3 queries) e constrói índices O(1) ───────────

    /**
     * Carrega todos os colaboradores do tenant usando duas queries JPQL com LEFT JOIN FETCH
     * (uma para NTC, outra para PTC), depois mescla os resultados em memória.
     * Resultado: 2 queries totais em vez de 1 + 2N (N+1).
     */
    private List<Colaborador> carregarTodosComRelacionamentos(Long tenantId) {
        long t0 = System.currentTimeMillis();

        // Query 1: colaboradores + NTC em batch
        List<Colaborador> comNtc = colaboradorRepository.findAllWithNtcByOrganizacaoId(tenantId);

        // Query 2: colaboradores + PTC em batch
        List<Colaborador> comPtc = colaboradorRepository.findAllWithPtcByOrganizacaoId(tenantId);

        // Mesclar PTC nos objetos que têm NTC (mesmo id → mesma instância pelo cache L1 do Hibernate)
        // Se o cache L1 não garantir a mesma instância, usamos Map para mesclar manualmente
        Map<Long, Colaborador> mapaBase = new HashMap<>();
        for (Colaborador c : comNtc) {
            mapaBase.put(c.getId(), c);
        }
        for (Colaborador c : comPtc) {
            Colaborador base = mapaBase.get(c.getId());
            if (base != null) {
                // garante que PTC está preenchido no objeto base
                if (base.getPreferenciaTrabalharCom() == null || base.getPreferenciaTrabalharCom().isEmpty()) {
                    base.setPreferenciaTrabalharCom(c.getPreferenciaTrabalharCom());
                }
            } else {
                mapaBase.put(c.getId(), c);
            }
        }

        List<Colaborador> resultado = new ArrayList<>(mapaBase.values());
        System.out.printf("[PERF] carregarTodosComRelacionamentos: %dms (%d registros)%n",
                System.currentTimeMillis() - t0, resultado.size());
        return resultado;
    }

    /**
     * G2: Constrói índices reversos (quem tem X na lista NTC/PTC) em O(N),
     * depois usa HashMap para lookup O(1) ao montar cada DTO.
     * Antes: O(N²) com List.contains(). Agora: O(N) total.
     */
    private List<ColaboradorDTO> converterParaDTOs(List<Colaborador> todos) {
        long t0 = System.currentTimeMillis();

        // Índices reversos: colabId → Set<Long> dos que têm esse id no NTC/PTC
        Map<Long, Set<Long>> reversoNtc = new HashMap<>();
        Map<Long, Set<Long>> reversoPtc = new HashMap<>();

        for (Colaborador c : todos) {
            if (c.getNaoTrabalharCom() != null) {
                for (Long outroId : c.getNaoTrabalharCom()) {
                    reversoNtc.computeIfAbsent(outroId, k -> new HashSet<>()).add(c.getId());
                }
            }
            if (c.getPreferenciaTrabalharCom() != null) {
                for (Long outroId : c.getPreferenciaTrabalharCom()) {
                    reversoPtc.computeIfAbsent(outroId, k -> new HashSet<>()).add(c.getId());
                }
            }
        }

        List<ColaboradorDTO> result = todos.stream()
                .map(c -> convertToDTOWithIndex(c, reversoNtc, reversoPtc))
                .collect(Collectors.toList());

        System.out.printf("[PERF] converterParaDTOs (todos): %dms%n", System.currentTimeMillis() - t0);
        return result;
    }

    @GetMapping
    public List<ColaboradorDTO> listar() {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        List<Colaborador> todos = carregarTodosComRelacionamentos(tenantId);
        return converterParaDTOs(todos);
    }

    // ─── G6: buscarPorId sem carregar todos ────────────────────────────────────────────────

    @GetMapping("/{id}")
    public ResponseEntity<ColaboradorDTO> buscarPorId(@PathVariable Long id) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        return colaboradorRepository.findByIdAndOrganizacaoId(id, tenantId)
                .map(c -> convertToDTOSimples(c))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> criar(@Valid @RequestBody ColaboradorDTO dto) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        br.com.gutemberg.meuprojeto.model.Organizacao org = organizacaoRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Organização não encontrada"));

        if (dto.getNaoTrabalharCom() != null && dto.getPreferenciaTrabalharCom() != null) {
            for (Long idColab : dto.getNaoTrabalharCom()) {
                if (dto.getPreferenciaTrabalharCom().contains(idColab)) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Um colaborador não pode estar nas listas de 'Não trabalhar com' e 'Preferência de trabalho' ao mesmo tempo."));
                }
            }
        }

        long count = colaboradorRepository.countByOrganizacaoId(tenantId);
        if (org.getPlano() == br.com.gutemberg.meuprojeto.model.PlanoType.GRATUITO && count >= 10) {
            return ResponseEntity.badRequest().body(Map.of("message", "Limite de colaboradores atingido para o plano Gratuito (máximo 10)."));
        }
        if (org.getPlano() == br.com.gutemberg.meuprojeto.model.PlanoType.PRO && count >= 50) {
            return ResponseEntity.badRequest().body(Map.of("message", "Limite de colaboradores atingido para o plano Pro (máximo 50)."));
        }

        Colaborador colaborador = convertToEntity(dto);
        colaborador.setOrganizacao(org);
        Colaborador salvo = colaboradorRepository.save(colaborador);
        atualizarReciprocidade(salvo, tenantId);

        // Para a resposta, recarregar com índices para refletir reciprocidade
        List<Colaborador> todos = carregarTodosComRelacionamentos(tenantId);
        List<ColaboradorDTO> dtos = converterParaDTOs(todos);
        ColaboradorDTO dto1 = dtos.stream().filter(d -> d.getId().equals(salvo.getId())).findFirst()
                .orElse(convertToDTOSimples(salvo));
        return ResponseEntity.status(HttpStatus.CREATED).body(dto1);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@PathVariable Long id, @Valid @RequestBody ColaboradorDTO dto) {
        Long tenantId = SecurityUtils.getCurrentTenantId();

        if (dto.getNaoTrabalharCom() != null && dto.getPreferenciaTrabalharCom() != null) {
            for (Long idColab : dto.getNaoTrabalharCom()) {
                if (dto.getPreferenciaTrabalharCom().contains(idColab)) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Um colaborador não pode estar nas listas de 'Não trabalhar com' e 'Preferência de trabalho' ao mesmo tempo."));
                }
            }
        }

        return colaboradorRepository.findByIdAndOrganizacaoId(id, tenantId)
                .map(colaborador -> {
                    colaborador.setNome(dto.getNome());
                    colaborador.setTelefone(dto.getTelefone());
                    colaborador.setNaoTrabalharCom(dto.getNaoTrabalharCom() != null ? dto.getNaoTrabalharCom() : new ArrayList<>());
                    colaborador.setPreferenciaTrabalharCom(dto.getPreferenciaTrabalharCom() != null ? dto.getPreferenciaTrabalharCom() : new ArrayList<>());

                    Colaborador atualizado = colaboradorRepository.save(colaborador);
                    atualizarReciprocidade(atualizado, tenantId);

                    // Para a resposta, recarregar com índices para refletir reciprocidade atualizada
                    List<Colaborador> todos = carregarTodosComRelacionamentos(tenantId);
                    List<ColaboradorDTO> dtos = converterParaDTOs(todos);
                    ColaboradorDTO resultado = dtos.stream().filter(d -> d.getId().equals(atualizado.getId())).findFirst()
                            .orElse(convertToDTOSimples(atualizado));
                    return ResponseEntity.ok(resultado);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ─── G3: atualizarReciprocidade com saveAll em vez de N saves ─────────────────────────

    private void atualizarReciprocidade(Colaborador colaborador, Long tenantId) {
        long t0 = System.currentTimeMillis();

        Long colabId = colaborador.getId();
        List<Long> newNtc = colaborador.getNaoTrabalharCom() != null ? colaborador.getNaoTrabalharCom() : new ArrayList<>();
        List<Long> newPtc = colaborador.getPreferenciaTrabalharCom() != null ? colaborador.getPreferenciaTrabalharCom() : new ArrayList<>();

        // Usar HashSet para lookup O(1) ao verificar se um ID está na lista nova
        Set<Long> newNtcSet = new HashSet<>(newNtc);
        Set<Long> newPtcSet = new HashSet<>(newPtc);

        List<Colaborador> todosDoTenant = colaboradorRepository.findByOrganizacaoId(tenantId);
        List<Colaborador> modificados = new ArrayList<>();

        for (Colaborador outro : todosDoTenant) {
            if (outro.getId().equals(colabId)) continue;
            boolean changed = false;

            // 1. Restrição de Conflito (NTC)
            if (newNtcSet.contains(outro.getId())) {
                if (!outro.getNaoTrabalharCom().contains(colabId)) {
                    outro.getNaoTrabalharCom().add(colabId);
                    changed = true;
                }
                if (outro.getPreferenciaTrabalharCom().contains(colabId)) {
                    outro.getPreferenciaTrabalharCom().remove(colabId);
                    changed = true;
                }
            } else {
                if (outro.getNaoTrabalharCom().contains(colabId)) {
                    outro.getNaoTrabalharCom().remove(colabId);
                    changed = true;
                }
            }

            // 2. Parceria (PTC)
            if (newPtcSet.contains(outro.getId())) {
                if (!outro.getPreferenciaTrabalharCom().contains(colabId)) {
                    outro.getPreferenciaTrabalharCom().add(colabId);
                    changed = true;
                }
                if (outro.getNaoTrabalharCom().contains(colabId)) {
                    outro.getNaoTrabalharCom().remove(colabId);
                    changed = true;
                }
            } else {
                if (outro.getPreferenciaTrabalharCom().contains(colabId)) {
                    outro.getPreferenciaTrabalharCom().remove(colabId);
                    changed = true;
                }
            }

            if (changed) {
                modificados.add(outro);
            }
        }

        // G3: um único saveAll em vez de N saves individuais
        if (!modificados.isEmpty()) {
            colaboradorRepository.saveAll(modificados);
        }

        System.out.printf("[PERF] atualizarReciprocidade: %dms (%d modificados de %d)%n",
                System.currentTimeMillis() - t0, modificados.size(), todosDoTenant.size());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        return colaboradorRepository.findByIdAndOrganizacaoId(id, tenantId)
                .map(colaborador -> {
                    colaboradorRepository.delete(colaborador);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/disponibilidade")
    public ResponseEntity<List<DisponibilidadeDTO>> listarDisponibilidades(
            @PathVariable Long id,
            @RequestParam int mes,
            @RequestParam int ano) {

        Long tenantId = SecurityUtils.getCurrentTenantId();
        if (!colaboradorRepository.existsByIdAndOrganizacaoId(id, tenantId)) {
            return ResponseEntity.notFound().build();
        }

        LocalDate dataInicio = LocalDate.of(ano, mes, 1);
        LocalDate dataFim = dataInicio.withDayOfMonth(dataInicio.lengthOfMonth());
        List<Evento> eventos = eventoRepository.findByOrganizacaoIdAndDataBetween(tenantId, dataInicio, dataFim);

        List<Disponibilidade> indisponibilidades = disponibilidadeRepository.findByOrganizacaoIdAndColaboradorIdAndMesAndAno(tenantId, id, mes, ano);
        Map<Long, Boolean> mapaIndisponibilidade = indisponibilidades.stream()
                .collect(Collectors.toMap(d -> d.getEvento().getId(), Disponibilidade::isIndisponivel, (v1, v2) -> v1));

        List<DisponibilidadeDTO> dtos = eventos.stream()
                .map(e -> DisponibilidadeDTO.builder()
                        .eventoId(e.getId())
                        .nomeEvento(e.getNome())
                        .data(e.getData())
                        .horaInicio(e.getHoraInicio())
                        .indisponivel(mapaIndisponibilidade.getOrDefault(e.getId(), false))
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/{id}/disponibilidade")
    public ResponseEntity<Void> salvarDisponibilidades(
            @PathVariable Long id,
            @Valid @RequestBody List<DisponibilidadeDTO> dtos) {

        Long tenantId = SecurityUtils.getCurrentTenantId();
        return colaboradorRepository.findByIdAndOrganizacaoId(id, tenantId)
                .map(colaborador -> {
                    for (DisponibilidadeDTO dto : dtos) {
                        eventoRepository.findByIdAndOrganizacaoId(dto.getEventoId(), tenantId).ifPresent(evento -> {
                            Disponibilidade disp = disponibilidadeRepository.findByOrganizacaoIdAndColaboradorIdAndEventoId(tenantId, id, dto.getEventoId())
                                    .orElseGet(() -> Disponibilidade.builder()
                                            .colaborador(colaborador)
                                            .evento(evento)
                                            .mes(evento.getData().getMonthValue())
                                            .ano(evento.getData().getYear())
                                            .organizacao(organizacaoRepository.getReferenceById(tenantId))
                                            .build());

                            disp.setIndisponivel(dto.isIndisponivel());
                            disponibilidadeRepository.save(disp);
                        });
                    }
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ─── Helpers de conversão ──────────────────────────────────────────────────────────────

    /**
     * G2: Versão O(1) com índices reversos pré-calculados.
     * Usado em listar() onde já temos todos os colaboradores.
     */
    private ColaboradorDTO convertToDTOWithIndex(Colaborador c,
                                                  Map<Long, Set<Long>> reversoNtc,
                                                  Map<Long, Set<Long>> reversoPtc) {
        Set<Long> ntc = new LinkedHashSet<>(c.getNaoTrabalharCom() != null ? c.getNaoTrabalharCom() : new ArrayList<>());
        Set<Long> ptc = new LinkedHashSet<>(c.getPreferenciaTrabalharCom() != null ? c.getPreferenciaTrabalharCom() : new ArrayList<>());

        // Adicionar relacionamentos reversos via lookup O(1)
        Set<Long> reversoNtcSet = reversoNtc.getOrDefault(c.getId(), new HashSet<>());
        Set<Long> reversoPtcSet = reversoPtc.getOrDefault(c.getId(), new HashSet<>());
        ntc.addAll(reversoNtcSet);
        ptc.addAll(reversoPtcSet);

        // Garantir exclusividade: PTC tem prioridade sobre NTC
        ntc.removeAll(ptc);

        return ColaboradorDTO.builder()
                .id(c.getId())
                .nome(c.getNome())
                .telefone(c.getTelefone())
                .naoTrabalharCom(new ArrayList<>(ntc))
                .preferenciaTrabalharCom(new ArrayList<>(ptc))
                .build();
    }

    /**
     * G6: Versão simples para buscarPorId — sem carregar todos.
     * Retorna apenas os dados diretos do colaborador (sem union reversa).
     */
    private ColaboradorDTO convertToDTOSimples(Colaborador c) {
        return ColaboradorDTO.builder()
                .id(c.getId())
                .nome(c.getNome())
                .telefone(c.getTelefone())
                .naoTrabalharCom(c.getNaoTrabalharCom() != null ? c.getNaoTrabalharCom() : new ArrayList<>())
                .preferenciaTrabalharCom(c.getPreferenciaTrabalharCom() != null ? c.getPreferenciaTrabalharCom() : new ArrayList<>())
                .build();
    }

    private Colaborador convertToEntity(ColaboradorDTO dto) {
        return Colaborador.builder()
                .id(dto.getId())
                .nome(dto.getNome())
                .telefone(dto.getTelefone())
                .naoTrabalharCom(dto.getNaoTrabalharCom())
                .preferenciaTrabalharCom(dto.getPreferenciaTrabalharCom())
                .build();
    }
}
