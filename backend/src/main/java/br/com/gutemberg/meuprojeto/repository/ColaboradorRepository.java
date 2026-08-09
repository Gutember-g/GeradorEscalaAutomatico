package br.com.gutemberg.meuprojeto.repository;

import br.com.gutemberg.meuprojeto.model.Colaborador;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ColaboradorRepository extends JpaRepository<Colaborador, Long> {

    /**
     * Busca todos os colaboradores do tenant com NTC e PTC já carregados em batch.
     * Hibernate usa EntityGraph + duas subselects (uma para naoTrabalharCom, outra para
     * preferenciaTrabalharCom) em vez de N queries individuais.
     * Resultado: 3 queries totais em vez de (1 + 2N).
     */
    @Query("SELECT DISTINCT c FROM Colaborador c LEFT JOIN FETCH c.naoTrabalharCom WHERE c.organizacao.id = :orgId")
    List<Colaborador> findAllWithNtcByOrganizacaoId(@Param("orgId") Long orgId);

    @Query("SELECT DISTINCT c FROM Colaborador c LEFT JOIN FETCH c.preferenciaTrabalharCom WHERE c.organizacao.id = :orgId")
    List<Colaborador> findAllWithPtcByOrganizacaoId(@Param("orgId") Long orgId);

    List<Colaborador> findByOrganizacaoId(Long organizacaoId);
    Optional<Colaborador> findByIdAndOrganizacaoId(Long id, Long organizacaoId);
    boolean existsByIdAndOrganizacaoId(Long id, Long organizacaoId);
    long countByOrganizacaoId(Long organizacaoId);
}
