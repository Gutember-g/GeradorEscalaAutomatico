package br.com.gutemberg.meuprojeto.repository;

import br.com.gutemberg.meuprojeto.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query("SELECT a FROM AuditLog a WHERE " +
           "(:filtroAdmin IS NULL OR LOWER(a.adminNome) LIKE LOWER(CONCAT('%', :filtroAdmin, '%'))) AND " +
           "(:filtroAcao IS NULL OR LOWER(a.acao) LIKE LOWER(CONCAT('%', :filtroAcao, '%'))) AND " +
           "(a.timestamp >= :dataInicio) AND " +
           "(a.timestamp <= :dataFim) " +
           "ORDER BY a.timestamp DESC")
    List<AuditLog> buscarPorFiltros(
            @Param("filtroAdmin") String filtroAdmin,
            @Param("filtroAcao") String filtroAcao,
            @Param("dataInicio") LocalDateTime dataInicio,
            @Param("dataFim") LocalDateTime dataFim
    );
}
