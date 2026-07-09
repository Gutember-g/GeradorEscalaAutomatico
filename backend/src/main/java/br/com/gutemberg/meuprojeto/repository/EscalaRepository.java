package br.com.gutemberg.meuprojeto.repository;

import br.com.gutemberg.meuprojeto.model.Escala;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EscalaRepository extends JpaRepository<Escala, Long> {
    List<Escala> findByOrganizacaoId(Long organizacaoId);
    Optional<Escala> findByIdAndOrganizacaoId(Long id, Long organizacaoId);
    long countByOrganizacaoId(Long organizacaoId);
}
