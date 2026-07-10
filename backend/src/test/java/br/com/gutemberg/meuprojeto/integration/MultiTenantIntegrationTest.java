package br.com.gutemberg.meuprojeto.integration;

import br.com.gutemberg.meuprojeto.Main;
import br.com.gutemberg.meuprojeto.model.*;
import br.com.gutemberg.meuprojeto.repository.*;
import br.com.gutemberg.meuprojeto.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = Main.class)
@AutoConfigureMockMvc
@ActiveProfiles("h2")
public class MultiTenantIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private OrganizacaoRepository organizacaoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ColaboradorRepository colaboradorRepository;

    @Autowired
    private EventoRepository eventoRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private String tokenOrgA;
    
    private Organizacao orgA;
    private Organizacao orgB;

    private Colaborador colabA;
    private Colaborador colabB;

    @BeforeEach
    public void setUp() {
        // Limpar tabelas para consistência dos testes de integração
        colaboradorRepository.deleteAll();
        eventoRepository.deleteAll();
        usuarioRepository.deleteAll();
        organizacaoRepository.deleteAll();
        auditLogRepository.deleteAll();

        // 1. Criar Organizações
        orgA = Organizacao.builder().nome("Paróquia A").ativo(true).plano(PlanoType.GRATUITO).build();
        orgB = Organizacao.builder().nome("Paróquia B").ativo(true).plano(PlanoType.GRATUITO).build();
        orgA = organizacaoRepository.save(orgA);
        orgB = organizacaoRepository.save(orgB);

        // 2. Criar Usuários
        Usuario userA = Usuario.builder().nome("Gestor A").email("gestorA@test.com").senha("senhaA").role(Role.USER).organizacao(orgA).build();
        Usuario userB = Usuario.builder().nome("Gestor B").email("gestorB@test.com").senha("senhaB").role(Role.USER).organizacao(orgB).build();
        userA = usuarioRepository.save(userA);
        userB = usuarioRepository.save(userB);

        // 3. Gerar tokens JWT
        tokenOrgA = jwtTokenProvider.gerarToken(userA.getEmail(), 1);

        // 4. Cadastrar Colaboradores
        colabA = Colaborador.builder().nome("Voluntário A").telefone("1111-1111").organizacao(orgA).build();
        colabB = Colaborador.builder().nome("Voluntário B").telefone("2222-2222").organizacao(orgB).build();
        colabA = colaboradorRepository.save(colabA);
        colabB = colaboradorRepository.save(colabB);
    }

    @Test
    public void testIsolamentoMultiTenantBuscarColaborador() throws Exception {
        // Gestor A tenta acessar colaborador da Org B (deve falhar com 404)
        mockMvc.perform(get("/api/colaboradores/" + colabB.getId())
                .header("Authorization", "Bearer " + tokenOrgA))
                .andExpect(status().isNotFound());

        // Gestor A acessa seu próprio colaborador (sucesso)
        mockMvc.perform(get("/api/colaboradores/" + colabA.getId())
                .header("Authorization", "Bearer " + tokenOrgA))
                .andExpect(status().isOk());
    }

    @Test
    public void testIsolamentoMultiTenantDeletarColaborador() throws Exception {
        // Gestor A tenta deletar colaborador da Org B (deve falhar com 404)
        mockMvc.perform(delete("/api/colaboradores/" + colabB.getId())
                .header("Authorization", "Bearer " + tokenOrgA))
                .andExpect(status().isNotFound());

        // Colaborador B não deve ter sido deletado
        assertTrue(colaboradorRepository.findById(colabB.getId()).isPresent());
    }
}
