package br.com.gutemberg.meuprojeto.repository;

import br.com.gutemberg.meuprojeto.model.Colaborador;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ColaboradorRepository extends JpaRepository<Colaborador, Long> {
    List<Colaborador> findByOrganizacaoId(Long organizacaoId);
    Optional<Colaborador> findByIdAndOrganizacaoId(Long id, Long organizacaoId);
    boolean existsByIdAndOrganizacaoId(Long id, Long organizacaoId);
    long countByOrganizacaoId(Long organizacaoId);
}
