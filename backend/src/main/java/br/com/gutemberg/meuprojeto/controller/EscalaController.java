package br.com.gutemberg.meuprojeto.controller;

import br.com.gutemberg.meuprojeto.dto.AlocacaoDTO;
import br.com.gutemberg.meuprojeto.dto.EscalaDTO;
import br.com.gutemberg.meuprojeto.dto.EventoDTO;
import br.com.gutemberg.meuprojeto.dto.GerarEscalaDTO;
import br.com.gutemberg.meuprojeto.dto.RelatorioGeracao;
import br.com.gutemberg.meuprojeto.model.Escala;
import br.com.gutemberg.meuprojeto.model.Evento;
import br.com.gutemberg.meuprojeto.repository.ColaboradorRepository;
import br.com.gutemberg.meuprojeto.repository.EscalaRepository;
import br.com.gutemberg.meuprojeto.service.EscalaService;
import br.com.gutemberg.meuprojeto.security.SecurityUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/escalas")
@CrossOrigin(origins = "*")
public class EscalaController {

    private final EscalaService escalaService;
    private final EscalaRepository escalaRepository;
    private final ColaboradorRepository colaboradorRepository;

    public EscalaController(EscalaService escalaService, EscalaRepository escalaRepository, ColaboradorRepository colaboradorRepository) {
        this.escalaService = escalaService;
        this.escalaRepository = escalaRepository;
        this.colaboradorRepository = colaboradorRepository;
    }

    @PostMapping("/gerar")
    public ResponseEntity<RelatorioGeracao> gerar(@Valid @RequestBody GerarEscalaDTO dto) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        
        List<Long> colaboradorIds = dto.getColaboradorIds();
        if (colaboradorIds == null || colaboradorIds.isEmpty()) {
            colaboradorIds = colaboradorRepository.findByOrganizacaoId(tenantId).stream()
                    .map(c -> c.getId())
                    .collect(Collectors.toList());
        }

        // Converter EventoDTO para Evento (entidade)
        List<Evento> eventos = dto.getEventos().stream()
                .map(eDto -> Evento.builder()
                        .id(eDto.getId())
                        .nome(eDto.getNome())
                        .data(eDto.getData())
                        .horaInicio(eDto.getHoraInicio())
                        .vagasNecessarias(eDto.getVagasNecessarias() != null ? eDto.getVagasNecessarias() : 1)
                        .corLiturgica(eDto.getCorLiturgica())
                        .build())
                .collect(Collectors.toList());

        RelatorioGeracao relatorio = escalaService.gerarESalvarEscala(
                dto.getNomeEscala(),
                dto.getDataInicio(),
                dto.getDataFim(),
                colaboradorIds,
                eventos
        );

        return ResponseEntity.ok(relatorio);
    }

    @GetMapping
    public List<EscalaDTO> listar() {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        return escalaRepository.findByOrganizacaoId(tenantId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EscalaDTO> buscarPorId(@PathVariable Long id) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        return escalaRepository.findByIdAndOrganizacaoId(id, tenantId)
                .map(this::convertToDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        return escalaRepository.findByIdAndOrganizacaoId(id, tenantId)
                .map(escala -> {
                    escalaRepository.delete(escala);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private EscalaDTO convertToDTO(Escala e) {
        List<EventoDTO> eventos = e.getEventos() != null
                ? e.getEventos().stream()
                    .map(evt -> EventoDTO.builder()
                            .id(evt.getId())
                            .nome(evt.getNome())
                            .data(evt.getData())
                            .horaInicio(evt.getHoraInicio())
                            .vagasNecessarias(evt.getVagasNecessarias())
                            .corLiturgica(evt.getCorLiturgica())
                            .build())
                    .collect(Collectors.toList())
                : new ArrayList<>();

        List<AlocacaoDTO> alocacoes = e.getAlocacoes() != null
                ? e.getAlocacoes().stream()
                    .map(a -> AlocacaoDTO.builder()
                            .id(a.getId())
                            .eventoId(a.getEvento().getId())
                            .colaboradorId(a.getColaborador().getId())
                            .colaboradorNome(a.getColaborador().getNome())
                            .colaboradorTelefone(a.getColaborador().getTelefone())
                            .build())
                    .collect(Collectors.toList())
                : new ArrayList<>();

        return EscalaDTO.builder()
                .id(e.getId())
                .nome(e.getNome())
                .dataInicio(e.getDataInicio())
                .dataFim(e.getDataFim())
                .eventos(eventos)
                .alocacoes(alocacoes)
                .build();
    }
}
