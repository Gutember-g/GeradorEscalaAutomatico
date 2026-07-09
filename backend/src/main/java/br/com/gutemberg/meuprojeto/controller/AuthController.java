package br.com.gutemberg.meuprojeto.controller;

import br.com.gutemberg.meuprojeto.dto.AuthResponse;
import br.com.gutemberg.meuprojeto.dto.LoginRequest;
import br.com.gutemberg.meuprojeto.dto.RegisterRequest;
import br.com.gutemberg.meuprojeto.model.Organizacao;
import br.com.gutemberg.meuprojeto.model.Role;
import br.com.gutemberg.meuprojeto.model.Usuario;
import br.com.gutemberg.meuprojeto.repository.OrganizacaoRepository;
import br.com.gutemberg.meuprojeto.repository.UsuarioRepository;
import br.com.gutemberg.meuprojeto.security.JwtTokenProvider;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;
    private final OrganizacaoRepository organizacaoRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthController(AuthenticationManager authenticationManager, UsuarioRepository usuarioRepository,
                          OrganizacaoRepository organizacaoRepository, PasswordEncoder passwordEncoder,
                          JwtTokenProvider tokenProvider) {
        this.authenticationManager = authenticationManager;
        this.usuarioRepository = usuarioRepository;
        this.organizacaoRepository = organizacaoRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    @PostMapping("/login")
    public ResponseEntity<?> autenticarUsuario(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(),
                            loginRequest.getSenha()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = tokenProvider.gerarToken(loginRequest.getEmail());

            Usuario usuario = usuarioRepository.findByEmail(loginRequest.getEmail())
                    .orElseThrow(() -> new RuntimeException("Usuário não encontrado após autenticação."));

            if (usuario.getOrganizacao() != null && !usuario.getOrganizacao().isAtivo()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Sua organização está inativa. Entre em contato com o suporte."));
            }

            String nomeOrg = usuario.getOrganizacao() != null ? usuario.getOrganizacao().getNome() : "Administração";

            return ResponseEntity.ok(new AuthResponse(jwt, usuario.getNome(), usuario.getEmail(), usuario.getRole(), nomeOrg));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "E-mail ou senha incorretos."));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> registrarUsuario(@Valid @RequestBody RegisterRequest registerRequest) {
        if (usuarioRepository.existsByEmail(registerRequest.getEmail())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "O e-mail informado já está em uso por outra conta."));
        }

        // 1. Criar a nova organização
        Organizacao org = Organizacao.builder()
                .nome(registerRequest.getNomeParoquia())
                .ativo(true)
                .build();
        Organizacao orgSalva = organizacaoRepository.save(org);

        // 2. Criar o usuário gestor
        Usuario usuario = Usuario.builder()
                .nome(registerRequest.getNomeResponsavel())
                .email(registerRequest.getEmail())
                .senha(passwordEncoder.encode(registerRequest.getSenha()))
                .role(Role.USER)
                .organizacao(orgSalva)
                .build();
        usuarioRepository.save(usuario);

        // 3. Autenticar e gerar token
        String jwt = tokenProvider.gerarToken(registerRequest.getEmail());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new AuthResponse(jwt, usuario.getNome(), usuario.getEmail(), usuario.getRole(), orgSalva.getNome()));
    }
}
