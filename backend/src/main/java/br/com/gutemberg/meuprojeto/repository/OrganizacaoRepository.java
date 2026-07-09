package br.com.gutemberg.meuprojeto.repository;

import br.com.gutemberg.meuprojeto.model.Organizacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrganizacaoRepository extends JpaRepository<Organizacao, Long> {
    
    @Query("SELECT o FROM Organizacao o WHERE o.id = :id AND o.deletadoEm IS NULL")
    Optional<Organizacao> findByIdActive(@Param("id") Long id);

    @Query("SELECT o FROM Organizacao o WHERE o.deletadoEm IS NULL")
    List<Organizacao> findAllActive();

    @Query("SELECT o FROM Organizacao o WHERE o.deletadoEm IS NULL AND LOWER(o.nome) LIKE LOWER(CONCAT('%', :filtro, '%'))")
    List<Organizacao> buscarPorFiltroActive(@Param("filtro") String filtro);
}
