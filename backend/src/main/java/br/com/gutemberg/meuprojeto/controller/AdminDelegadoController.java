package br.com.gutemberg.meuprojeto.controller;

import br.com.gutemberg.meuprojeto.model.ModuloPermissao;
import br.com.gutemberg.meuprojeto.model.PermissaoDelegada;
import br.com.gutemberg.meuprojeto.model.Role;
import br.com.gutemberg.meuprojeto.model.Usuario;
import br.com.gutemberg.meuprojeto.repository.PermissaoDelegadaRepository;
import br.com.gutemberg.meuprojeto.repository.UsuarioRepository;
import br.com.gutemberg.meuprojeto.security.Auditable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
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

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/delegados")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminDelegadoController {

    private final UsuarioRepository usuarioRepository;
    private final PermissaoDelegadaRepository permissaoDelegadaRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminDelegadoController(UsuarioRepository usuarioRepository,
                                   PermissaoDelegadaRepository permissaoDelegadaRepository,
                                   PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.permissaoDelegadaRepository = permissaoDelegadaRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public static class DelegadoDTO {
        public Long id;
        public String nome;
        public String email;
        public String senha;
        public List<String> permissoes = new ArrayList<>();
    }

    @GetMapping
    public List<DelegadoDTO> listar() {
        List<Usuario> usuarios = usuarioRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.ADMIN_DELEGADO && u.getDeletadoEm() == null)
                .collect(Collectors.toList());

        return usuarios.stream().map(u -> {
            DelegadoDTO dto = new DelegadoDTO();
            dto.id = u.getId();
            dto.nome = u.getNome();
            dto.email = u.getEmail();
            dto.permissoes = permissaoDelegadaRepository.findByUsuarioId(u.getId()).stream()
                    .map(p -> p.getModulo().name())
                    .collect(Collectors.toList());
            return dto;
        }).collect(Collectors.toList());
    }

    @PostMapping
    @Transactional
    @Auditable(acao = "Criar Admin Delegado", entidade = "Usuario")
    public ResponseEntity<?> criar(@Valid @RequestBody DelegadoDTO dto) {
        if (usuarioRepository.existsByEmail(dto.email)) {
            return ResponseEntity.badRequest().body(Map.of("message", "E-mail já está cadastrado."));
        }

        Usuario usuario = Usuario.builder()
                .nome(dto.nome)
                .email(dto.email)
                .senha(passwordEncoder.encode(dto.senha != null ? dto.senha : "123456"))
                .role(Role.ADMIN_DELEGADO)
                .tokenVersion(1)
                .build();

        Usuario salvo = usuarioRepository.save(usuario);

        if (dto.permissoes != null) {
            for (String perm : dto.permissoes) {
                try {
                    ModuloPermissao mod = ModuloPermissao.valueOf(perm.toUpperCase());
                    PermissaoDelegada pd = new PermissaoDelegada(null, salvo, mod);
                    permissaoDelegadaRepository.save(pd);
                } catch (IllegalArgumentException ignored) {
                }
            }
        }

        dto.id = salvo.getId();
        dto.senha = null;
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @PutMapping("/{id}")
    @Transactional
    @Auditable(acao = "Editar Admin Delegado", entidade = "Usuario")
    public ResponseEntity<?> atualizar(@PathVariable Long id, @Valid @RequestBody DelegadoDTO dto) {
        return usuarioRepository.findById(id)
                .filter(u -> u.getRole() == Role.ADMIN_DELEGADO && u.getDeletadoEm() == null)
                .map(u -> {
                    u.setNome(dto.nome);
                    if (dto.senha != null && !dto.senha.trim().isEmpty()) {
                        u.setSenha(passwordEncoder.encode(dto.senha));
                        u.setTokenVersion(u.getTokenVersion() + 1); // Forçar logout ao mudar senha
                    }
                    usuarioRepository.save(u);

                    // Atualizar permissões
                    permissaoDelegadaRepository.deleteByUsuarioId(id);
                    if (dto.permissoes != null) {
                        for (String perm : dto.permissoes) {
                            try {
                                ModuloPermissao mod = ModuloPermissao.valueOf(perm.toUpperCase());
                                PermissaoDelegada pd = new PermissaoDelegada(null, u, mod);
                                permissaoDelegadaRepository.save(pd);
                            } catch (IllegalArgumentException ignored) {
                            }
                        }
                    }

                    dto.id = id;
                    dto.senha = null;
                    return ResponseEntity.ok(dto);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Transactional
    @Auditable(acao = "Excluir Admin Delegado", entidade = "Usuario")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        return usuarioRepository.findById(id)
                .filter(u -> u.getRole() == Role.ADMIN_DELEGADO && u.getDeletadoEm() == null)
                .map(u -> {
                    permissaoDelegadaRepository.deleteByUsuarioId(id);
                    // Soft delete do usuário delegado
                    u.setDeletadoEm(java.time.LocalDateTime.now());
                    u.setTokenVersion(u.getTokenVersion() + 1);
                    usuarioRepository.save(u);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
