package br.com.gutemberg.meuprojeto.controller;

import br.com.gutemberg.meuprojeto.dto.OrganizacaoAdminDTO;
import br.com.gutemberg.meuprojeto.model.AuditLog;
import br.com.gutemberg.meuprojeto.model.ModuloPermissao;
import br.com.gutemberg.meuprojeto.model.Organizacao;
import br.com.gutemberg.meuprojeto.model.PermissaoDelegada;
import br.com.gutemberg.meuprojeto.model.PlanoType;
import br.com.gutemberg.meuprojeto.model.Role;
import br.com.gutemberg.meuprojeto.model.Usuario;
import br.com.gutemberg.meuprojeto.repository.AuditLogRepository;
import br.com.gutemberg.meuprojeto.repository.ColaboradorRepository;
import br.com.gutemberg.meuprojeto.repository.EscalaRepository;
import br.com.gutemberg.meuprojeto.repository.EventoRepository;
import br.com.gutemberg.meuprojeto.repository.OrganizacaoRepository;
import br.com.gutemberg.meuprojeto.repository.PermissaoDelegadaRepository;
import br.com.gutemberg.meuprojeto.repository.UsuarioRepository;
import br.com.gutemberg.meuprojeto.security.Auditable;
import br.com.gutemberg.meuprojeto.security.SecurityUtils;
import br.com.gutemberg.meuprojeto.security.UsuarioPrincipal;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_DELEGADO')")
public class AdminController {

    private final OrganizacaoRepository organizacaoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ColaboradorRepository colaboradorRepository;
    private final EventoRepository eventoRepository;
    private final EscalaRepository escalaRepository;
    private final AuditLogRepository auditLogRepository;
    private final PermissaoDelegadaRepository permissaoDelegadaRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminController(OrganizacaoRepository organizacaoRepository, UsuarioRepository usuarioRepository,
                           ColaboradorRepository colaboradorRepository, EventoRepository eventoRepository,
                           EscalaRepository escalaRepository, AuditLogRepository auditLogRepository,
                           PermissaoDelegadaRepository permissaoDelegadaRepository, PasswordEncoder passwordEncoder) {
        this.organizacaoRepository = organizacaoRepository;
        this.usuarioRepository = usuarioRepository;
        this.colaboradorRepository = colaboradorRepository;
        this.eventoRepository = eventoRepository;
        this.escalaRepository = escalaRepository;
        this.auditLogRepository = auditLogRepository;
        this.permissaoDelegadaRepository = permissaoDelegadaRepository;
        this.passwordEncoder = passwordEncoder;
    }

    private void verificarPermissao(ModuloPermissao modulo) {
        UsuarioPrincipal principal = SecurityUtils.getCurrentUser();
        if (principal == null) {
            throw new org.springframework.security.access.AccessDeniedException("Usuário não autenticado");
        }
        
        // Super Admin tem passe livre completo
        if (principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"))) {
            return;
        }
        
        // Admin Delegado precisa da permissão para o módulo correspondente
        if (principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN_DELEGADO"))) {
            List<PermissaoDelegada> permissoes = permissaoDelegadaRepository.findByUsuarioId(principal.getId());
            boolean temAcesso = permissoes.stream().anyMatch(p -> p.getModulo() == modulo);
            if (temAcesso) {
                return;
            }
        }
        
        throw new org.springframework.security.access.AccessDeniedException("Acesso negado para o módulo: " + modulo.name());
    }

    @GetMapping("/organizacoes")
    public List<OrganizacaoAdminDTO> listarOrganizacoes(@RequestParam(required = false) String filtro) {
        verificarPermissao(ModuloPermissao.USUARIOS);

        List<Organizacao> orgs;
        if (filtro != null && !filtro.trim().isEmpty()) {
            orgs = organizacaoRepository.buscarPorFiltroActive(filtro.trim());
        } else {
            orgs = organizacaoRepository.findAllActive();
        }

        return orgs.stream().map(org -> {
            List<Usuario> usuarios = usuarioRepository.findByOrganizacaoId(org.getId());
            String email = "N/A";
            String nomeResp = "N/A";
            if (!usuarios.isEmpty()) {
                Usuario principal = usuarios.get(0);
                email = principal.getEmail();
                nomeResp = principal.getNome();
            }

            long colaboradores = colaboradorRepository.countByOrganizacaoId(org.getId());
            long eventos = eventoRepository.countByOrganizacaoId(org.getId());
            long escalas = escalaRepository.countByOrganizacaoId(org.getId());

            return new OrganizacaoAdminDTO(
                    org.getId(),
                    org.getNome(),
                    org.getDataCriacao(),
                    org.isAtivo(),
                    email,
                    nomeResp,
                    colaboradores,
                    eventos,
                    escalas,
                    org.getPlano().name(),
                    org.getObservacoes()
            );
        }).collect(Collectors.toList());
    }

    public static class CreateTenantRequest {
        public String nomeOrganizacao;
        public String nomeResponsavel;
        public String emailResponsavel;
        public String senhaResponsavel;
        public String plano;
        public String observacoes;
    }

    @PostMapping("/organizacoes")
    @Transactional
    @Auditable(acao = "Criar Organização", entidade = "Organizacao")
    public ResponseEntity<?> criarOrganizacao(@Valid @RequestBody CreateTenantRequest request) {
        verificarPermissao(ModuloPermissao.USUARIOS);

        if (usuarioRepository.existsByEmail(request.emailResponsavel)) {
            return ResponseEntity.badRequest().body(Map.of("message", "E-mail do responsável já cadastrado."));
        }

        PlanoType plano = PlanoType.GRATUITO;
        try {
            if (request.plano != null) {
                plano = PlanoType.valueOf(request.plano.toUpperCase());
            }
        } catch (Exception ignored) {}

        Organizacao org = Organizacao.builder()
                .nome(request.nomeOrganizacao)
                .ativo(true)
                .plano(plano)
                .observacoes(request.observacoes)
                .dataCriacao(LocalDateTime.now())
                .build();

        Organizacao orgSalva = organizacaoRepository.save(org);

        Usuario usuario = Usuario.builder()
                .nome(request.nomeResponsavel)
                .email(request.emailResponsavel)
                .senha(passwordEncoder.encode(request.senhaResponsavel != null ? request.senhaResponsavel : "mudar123"))
                .role(Role.USER)
                .organizacao(orgSalva)
                .tokenVersion(1)
                .build();

        usuarioRepository.save(usuario);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id", orgSalva.getId(), "nome", orgSalva.getNome()));
    }

    public static class EditTenantRequest {
        public String nomeOrganizacao;
        public String nomeResponsavel;
        public String emailResponsavel;
        public String plano;
        public String observacoes;
        public Boolean ativo;
    }

    @PutMapping("/organizacoes/{id}")
    @Transactional
    @Auditable(acao = "Editar Organização", entidade = "Organizacao")
    public ResponseEntity<?> atualizarOrganizacao(@PathVariable Long id, @Valid @RequestBody EditTenantRequest request) {
        verificarPermissao(ModuloPermissao.USUARIOS);
        
        // Se estiver alterando o plano, exige permissão financeira extra
        if (request.plano != null) {
            verificarPermissao(ModuloPermissao.FINANCEIRO);
        }

        return organizacaoRepository.findByIdActive(id)
                .map(org -> {
                    org.setNome(request.nomeOrganizacao);
                    if (request.observacoes != null) {
                        org.setObservacoes(request.observacoes);
                    }
                    if (request.ativo != null) {
                        org.setAtivo(request.ativo);
                    }
                    if (request.plano != null) {
                        try {
                            org.setPlano(PlanoType.valueOf(request.plano.toUpperCase()));
                        } catch (Exception ignored) {}
                    }
                    organizacaoRepository.save(org);

                    // Atualiza dados do responsável primário
                    List<Usuario> usuarios = usuarioRepository.findByOrganizacaoId(id);
                    if (!usuarios.isEmpty()) {
                        Usuario principal = usuarios.get(0);
                        principal.setNome(request.nomeResponsavel);
                        
                        // Verifica se está tentando mudar o e-mail para um já existente
                        if (!principal.getEmail().equalsIgnoreCase(request.emailResponsavel)) {
                            if (usuarioRepository.existsByEmail(request.emailResponsavel)) {
                                throw new IllegalArgumentException("E-mail já está em uso por outro usuário.");
                            }
                            principal.setEmail(request.emailResponsavel);
                            principal.setTokenVersion(principal.getTokenVersion() + 1); // Deslogar ao mudar email
                        }
                        usuarioRepository.save(principal);
                    }

                    return ResponseEntity.ok(Map.of("message", "Organização atualizada com sucesso!"));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/organizacoes/{id}/status")
    @Transactional
    @Auditable(acao = "Alterar Status da Organização", entidade = "Organizacao")
    public ResponseEntity<?> alterarStatus(@PathVariable Long id, @RequestBody Map<String, Boolean> payload) {
        verificarPermissao(ModuloPermissao.USUARIOS);
        Boolean ativo = payload.get("ativo");
        if (ativo == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Parâmetro 'ativo' é obrigatório."));
        }

        return organizacaoRepository.findByIdActive(id)
                .map(org -> {
                    org.setAtivo(ativo);
                    organizacaoRepository.save(org);
                    
                    // Se desativado, força logout de todos os usuários associados
                    if (!ativo) {
                        List<Usuario> usuarios = usuarioRepository.findByOrganizacaoId(org.getId());
                        for (Usuario u : usuarios) {
                            u.setTokenVersion(u.getTokenVersion() + 1);
                            usuarioRepository.save(u);
                        }
                    }
                    return ResponseEntity.ok(org);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/organizacoes/{id}")
    @Transactional
    @Auditable(acao = "Excluir Organização", entidade = "Organizacao")
    public ResponseEntity<?> deletarOrganizacao(@PathVariable Long id) {
        verificarPermissao(ModuloPermissao.USUARIOS);

        return organizacaoRepository.findByIdActive(id)
                .map(org -> {
                    LocalDateTime agora = LocalDateTime.now();
                    
                    // Soft delete na organização
                    org.setDeletadoEm(agora);
                    org.setAtivo(false);
                    organizacaoRepository.save(org);

                    // Soft delete em todos os usuários dessa organização
                    List<Usuario> usuarios = usuarioRepository.findByOrganizacaoId(org.getId());
                    for (Usuario u : usuarios) {
                        u.setDeletadoEm(agora);
                        u.setTokenVersion(u.getTokenVersion() + 1); // Invalida tokens ativos
                        usuarioRepository.save(u);
                    }

                    return ResponseEntity.noContent().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/organizacoes/{id}/reset-senha")
    @Transactional
    @Auditable(acao = "Resetar Senha de Usuário", entidade = "Usuario")
    public ResponseEntity<?> resetarSenha(@PathVariable Long id) {
        verificarPermissao(ModuloPermissao.USUARIOS);

        List<Usuario> usuarios = usuarioRepository.findByOrganizacaoId(id);
        if (usuarios.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Responsável não encontrado."));
        }

        Usuario principal = usuarios.get(0);
        String senhaTemporaria = "escalaTemp" + (int)(Math.random() * 900 + 100);
        principal.setSenha(passwordEncoder.encode(senhaTemporaria));
        principal.setTokenVersion(principal.getTokenVersion() + 1); // Forçar logout da antiga senha
        usuarioRepository.save(principal);

        return ResponseEntity.ok(Map.of(
                "message", "Senha redefinida com sucesso!",
                "senhaTemporaria", senhaTemporaria
        ));
    }

    @PostMapping("/organizacoes/{id}/forcar-logout")
    @Transactional
    @Auditable(acao = "Forçar Logout Geral", entidade = "Organizacao")
    public ResponseEntity<?> forcarLogout(@PathVariable Long id) {
        verificarPermissao(ModuloPermissao.USUARIOS);

        List<Usuario> usuarios = usuarioRepository.findByOrganizacaoId(id);
        if (usuarios.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Nenhum usuário ativo para esta organização."));
        }

        for (Usuario u : usuarios) {
            u.setTokenVersion(u.getTokenVersion() + 1);
            usuarioRepository.save(u);
        }

        return ResponseEntity.ok(Map.of("message", "Todos os tokens ativos do cliente foram invalidados."));
    }

    @GetMapping("/logs-auditoria")
    public ResponseEntity<List<AuditLog>> listarLogsAuditoria(
            @RequestParam(required = false) String admin,
            @RequestParam(required = false) String acao,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) {
        
        verificarPermissao(ModuloPermissao.SUPORTE);

        LocalDateTime dataInicio = inicio != null ? inicio.atStartOfDay() : LocalDate.now().minusDays(30).atStartOfDay();
        LocalDateTime dataFim = fim != null ? fim.atTime(LocalTime.MAX) : LocalDate.now().atTime(LocalTime.MAX);

        List<AuditLog> logs = auditLogRepository.buscarPorFiltros(admin, acao, dataInicio, dataFim);
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/dashboard/metricas")
    public ResponseEntity<?> obterMetricas() {
        verificarPermissao(ModuloPermissao.SUPORTE);

        List<Organizacao> todasOrgs = organizacaoRepository.findAllActive();
        long ativas = todasOrgs.stream().filter(Organizacao::isAtivo).count();
        long suspensas = todasOrgs.size() - ativas;

        long totalColaboradores = colaboradorRepository.count();

        // Escalas geradas no mês atual
        LocalDate inicioMes = LocalDate.now().withDayOfMonth(1);
        LocalDate fimMes = LocalDate.now().withDayOfMonth(LocalDate.now().lengthOfMonth());
        long escalasNoMes = escalaRepository.findAll().stream()
                .filter(e -> e.getDataInicio() != null &&
                        !e.getDataInicio().isBefore(inicioMes) &&
                        !e.getDataInicio().isAfter(fimMes))
                .count();

        // Organizações mais ativas (por total de escalas geradas)
        List<Map<String, Object>> maisAtivas = todasOrgs.stream()
                .map(org -> {
                    long totalEscalas = escalaRepository.countByOrganizacaoId(org.getId());
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", org.getId());
                    map.put("nome", org.getNome());
                    map.put("totalEscalas", totalEscalas);
                    return map;
                })
                .sorted((a, b) -> Long.compare((long) b.get("totalEscalas"), (long) a.get("totalEscalas")))
                .limit(5)
                .collect(Collectors.toList());

        // Churn Candidate: Inativas a mais de 60 dias (sem escalas geradas nos ultimos 60 dias)
        LocalDate limiteChurn = LocalDate.now().minusDays(60);
        List<Map<String, Object>> potenciaisChurn = todasOrgs.stream()
                .filter(org -> {
                    // Contar escalas criadas nos ultimos 60 dias
                    long escalasRecentes = escalaRepository.findAll().stream()
                            .filter(e -> e.getOrganizacao() != null && e.getOrganizacao().getId().equals(org.getId())
                                    && e.getDataInicio() != null && !e.getDataInicio().isBefore(limiteChurn))
                            .count();
                    return escalasRecentes == 0;
                })
                .map(org -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", org.getId());
                    map.put("nome", org.getNome());
                    map.put("plano", org.getPlano().name());
                    map.put("cadastro", org.getDataCriacao());
                    return map;
                })
                .collect(Collectors.toList());

        // Distribuição de Planos
        Map<String, Long> planosCount = todasOrgs.stream()
                .collect(Collectors.groupingBy(o -> o.getPlano().name(), Collectors.counting()));

        // Crescimento (Novas contas por mês nos últimos 6 meses)
        List<Map<String, Object>> crescimento = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            LocalDate targetMonth = LocalDate.now().minusMonths(i);
            long count = todasOrgs.stream()
                    .filter(org -> org.getDataCriacao() != null &&
                            org.getDataCriacao().getYear() == targetMonth.getYear() &&
                            org.getDataCriacao().getMonthValue() == targetMonth.getMonthValue())
                    .count();
            
            String label = targetMonth.getMonth().name().substring(0, 3) + "/" + targetMonth.getYear();
            Map<String, Object> map = new HashMap<>();
            map.put("mes", label);
            map.put("novasOrganizacoes", count);
            crescimento.add(map);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("totalAtivas", ativas);
        response.put("totalSuspensas", suspensas);
        response.put("totalColaboradores", totalColaboradores);
        response.put("escalasNoMes", escalasNoMes);
        response.put("rankingOrganizacoes", maisAtivas);
        response.put("churnCandidatos", potenciaisChurn);
        response.put("distribuicaoPlanos", planosCount);
        response.put("crescimentoContas", crescimento);

        return ResponseEntity.ok(response);
    }
}
