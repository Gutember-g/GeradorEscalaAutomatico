package br.com.gutemberg.meuprojeto.controller;

import br.com.gutemberg.meuprojeto.dto.EventoDTO;
import br.com.gutemberg.meuprojeto.model.Evento;
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
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/eventos")
@CrossOrigin(origins = "*")
public class EventoController {

    private final EventoRepository eventoRepository;
    private final OrganizacaoRepository organizacaoRepository;

    public EventoController(EventoRepository eventoRepository, OrganizacaoRepository organizacaoRepository) {
        this.eventoRepository = eventoRepository;
        this.organizacaoRepository = organizacaoRepository;
    }

    @GetMapping
    public List<EventoDTO> listar() {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        return eventoRepository.findByOrganizacaoId(tenantId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EventoDTO> buscarPorId(@PathVariable Long id) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        return eventoRepository.findByIdAndOrganizacaoId(id, tenantId)
                .map(this::convertToDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> criar(@Valid @RequestBody EventoDTO dto) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        
        // 1. Verificar duplicados
        if (eventoRepository.existsByOrganizacaoIdAndNomeAndDataAndHoraInicio(tenantId, dto.getNome(), dto.getData(), dto.getHoraInicio())) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Já existe um evento cadastrado com o mesmo nome, data e horário de início."));
        }
        
        // 2. Verificar limites de plano
        br.com.gutemberg.meuprojeto.model.Organizacao org = organizacaoRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Organização não encontrada"));
                
        if (org.getPlano() != br.com.gutemberg.meuprojeto.model.PlanoType.ILIMITADO) {
            java.time.LocalDate targetDate = dto.getData();
            java.time.LocalDate startOfMonth = targetDate.withDayOfMonth(1);
            java.time.LocalDate endOfMonth = targetDate.withDayOfMonth(targetDate.lengthOfMonth());
            
            long eventCountThisMonth = eventoRepository.countByOrganizacaoIdAndDataBetween(tenantId, startOfMonth, endOfMonth);
            
            if (org.getPlano() == br.com.gutemberg.meuprojeto.model.PlanoType.GRATUITO && eventCountThisMonth >= 15) {
                return ResponseEntity.badRequest().body(java.util.Map.of("message", "Limite de eventos para o mês excedido para o plano Gratuito (máximo 15)."));
            }
            if (org.getPlano() == br.com.gutemberg.meuprojeto.model.PlanoType.PRO && eventCountThisMonth >= 100) {
                return ResponseEntity.badRequest().body(java.util.Map.of("message", "Limite de eventos para o mês excedido para o plano Pro (máximo 100)."));
            }
        }
        
        Evento evento = convertToEntity(dto);
        evento.setOrganizacao(org);
        Evento salvo = eventoRepository.save(evento);
        return ResponseEntity.status(HttpStatus.CREATED).body(convertToDTO(salvo));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EventoDTO> atualizar(@PathVariable Long id, @Valid @RequestBody EventoDTO dto) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        return eventoRepository.findByIdAndOrganizacaoId(id, tenantId)
                .map(evento -> {
                    eventoRepository.findByOrganizacaoIdAndNomeAndDataAndHoraInicio(tenantId, dto.getNome(), dto.getData(), dto.getHoraInicio())
                            .ifPresent(existing -> {
                                if (!existing.getId().equals(id)) {
                                    throw new IllegalArgumentException("Já existe outro evento cadastrado com o mesmo nome, data e horário de início.");
                                }
                            });

                    evento.setNome(dto.getNome());
                    evento.setData(dto.getData());
                    evento.setHoraInicio(dto.getHoraInicio());
                    evento.setVagasNecessarias(dto.getVagasNecessarias());
                    evento.setCorLiturgica(dto.getCorLiturgica());
                    
                    Evento atualizado = eventoRepository.save(evento);
                    return ResponseEntity.ok(convertToDTO(atualizado));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        return eventoRepository.findByIdAndOrganizacaoId(id, tenantId)
                .map(evento -> {
                    eventoRepository.delete(evento);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private EventoDTO convertToDTO(Evento e) {
        return EventoDTO.builder()
                .id(e.getId())
                .nome(e.getNome())
                .data(e.getData())
                .horaInicio(e.getHoraInicio())
                .vagasNecessarias(e.getVagasNecessarias())
                .corLiturgica(e.getCorLiturgica())
                .build();
    }

    private Evento convertToEntity(EventoDTO dto) {
        return Evento.builder()
                .id(dto.getId())
                .nome(dto.getNome())
                .data(dto.getData())
                .horaInicio(dto.getHoraInicio())
                .vagasNecessarias(dto.getVagasNecessarias() != null ? dto.getVagasNecessarias() : 1)
                .corLiturgica(dto.getCorLiturgica())
                .build();
    }
}
