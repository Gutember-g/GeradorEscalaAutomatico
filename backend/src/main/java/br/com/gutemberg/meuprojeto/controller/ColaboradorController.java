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
import java.util.List;
import java.util.Map;
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

    @GetMapping
    public List<ColaboradorDTO> listar() {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        return colaboradorRepository.findByOrganizacaoId(tenantId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ColaboradorDTO> buscarPorId(@PathVariable Long id) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        return colaboradorRepository.findByIdAndOrganizacaoId(id, tenantId)
                .map(this::convertToDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> criar(@Valid @RequestBody ColaboradorDTO dto) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        br.com.gutemberg.meuprojeto.model.Organizacao org = organizacaoRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Organização não encontrada"));
        
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
        return ResponseEntity.status(HttpStatus.CREATED).body(convertToDTO(salvo));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ColaboradorDTO> atualizar(@PathVariable Long id, @Valid @RequestBody ColaboradorDTO dto) {
        Long tenantId = SecurityUtils.getCurrentTenantId();
        return colaboradorRepository.findByIdAndOrganizacaoId(id, tenantId)
                .map(colaborador -> {
                    colaborador.setNome(dto.getNome());
                    colaborador.setTelefone(dto.getTelefone());
                    colaborador.setNaoTrabalharCom(dto.getNaoTrabalharCom());
                    colaborador.setPreferenciaTrabalharCom(dto.getPreferenciaTrabalharCom());
                    
                    Colaborador atualizado = colaboradorRepository.save(colaborador);
                    return ResponseEntity.ok(convertToDTO(atualizado));
                })
                .orElse(ResponseEntity.notFound().build());
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

    private ColaboradorDTO convertToDTO(Colaborador c) {
        return ColaboradorDTO.builder()
                .id(c.getId())
                .nome(c.getNome())
                .telefone(c.getTelefone())
                .naoTrabalharCom(c.getNaoTrabalharCom())
                .preferenciaTrabalharCom(c.getPreferenciaTrabalharCom())
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
