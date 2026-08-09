package br.com.gutemberg.meuprojeto.controller;

import br.com.gutemberg.meuprojeto.dto.AlocacaoLightDTO;
import br.com.gutemberg.meuprojeto.repository.AlocacaoRepository;
import br.com.gutemberg.meuprojeto.security.SecurityUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/**
 * G4: Endpoint leve para alocações filtradas por mês/ano.
 *
 * Substitui o uso de GET /api/escalas (payload 80-200KB) na tela de
 * DisponibilidadeColaborador, que só precisava saber "quem está escalado
 * em quais eventos do mês". Este endpoint retorna apenas os campos necessários
 * (~1-5KB por request).
 *
 * Exemplo de uso: GET /api/alocacoes?mes=8&ano=2026
 */
@RestController
@RequestMapping("/api/alocacoes")
@CrossOrigin(origins = "*")
public class AlocacaoController {

    private final AlocacaoRepository alocacaoRepository;

    public AlocacaoController(AlocacaoRepository alocacaoRepository) {
        this.alocacaoRepository = alocacaoRepository;
    }

    @GetMapping
    public ResponseEntity<List<AlocacaoLightDTO>> listarPorPeriodo(
            @RequestParam int mes,
            @RequestParam int ano) {

        Long tenantId = SecurityUtils.getCurrentTenantId();
        long t0 = System.currentTimeMillis();

        LocalDate inicio = LocalDate.of(ano, mes, 1);
        LocalDate fim = inicio.withDayOfMonth(inicio.lengthOfMonth());

        List<AlocacaoLightDTO> result = alocacaoRepository.findLightByOrganizacaoAndPeriodo(tenantId, inicio, fim);

        System.out.printf("[PERF] GET /api/alocacoes?mes=%d&ano=%d: %dms (%d registros)%n",
                mes, ano, System.currentTimeMillis() - t0, result.size());

        return ResponseEntity.ok(result);
    }
}
