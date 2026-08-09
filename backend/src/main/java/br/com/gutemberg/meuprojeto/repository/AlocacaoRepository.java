package br.com.gutemberg.meuprojeto.repository;

import br.com.gutemberg.meuprojeto.dto.AlocacaoLightDTO;
import br.com.gutemberg.meuprojeto.model.Alocacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AlocacaoRepository extends JpaRepository<Alocacao, Long> {

    /**
     * G4: Busca alocações leves por mês/ano para o tenant.
     * Uma única query com JOIN em vez de carregar todas as escalas com todos os eventos.
     * Payload resultado: ~1-5KB vs 80-200KB anterior.
     */
    @Query("""
            SELECT new br.com.gutemberg.meuprojeto.dto.AlocacaoLightDTO(
                a.evento.id,
                a.evento.nome,
                a.evento.data,
                a.evento.horaInicio,
                a.colaborador.id,
                a.colaborador.nome
            )
            FROM Alocacao a
            WHERE a.evento.organizacao.id = :orgId
              AND a.evento.data BETWEEN :inicio AND :fim
            """)
    List<AlocacaoLightDTO> findLightByOrganizacaoAndPeriodo(
            @Param("orgId") Long orgId,
            @Param("inicio") LocalDate inicio,
            @Param("fim") LocalDate fim
    );
}

