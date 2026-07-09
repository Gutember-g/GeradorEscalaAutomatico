package br.com.gutemberg.meuprojeto.repository;

import br.com.gutemberg.meuprojeto.model.Alocacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AlocacaoRepository extends JpaRepository<Alocacao, Long> {
}
