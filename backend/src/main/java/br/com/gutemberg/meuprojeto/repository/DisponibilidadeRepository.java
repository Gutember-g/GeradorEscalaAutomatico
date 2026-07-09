package br.com.gutemberg.meuprojeto.repository;

import br.com.gutemberg.meuprojeto.model.Disponibilidade;
import br.com.gutemberg.meuprojeto.model.Evento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface DisponibilidadeRepository extends JpaRepository<Disponibilidade, Long> {

    List<Disponibilidade> findByOrganizacaoIdAndColaboradorIdAndMesAndAno(Long organizacaoId, Long colaboradorId, int mes, int ano);

    List<Disponibilidade> findByOrganizacaoIdAndEventoIn(Long organizacaoId, Collection<Evento> eventos);

    List<Disponibilidade> findByEventoIn(Collection<Evento> eventos);

    Optional<Disponibilidade> findByOrganizacaoIdAndColaboradorIdAndEventoId(Long organizacaoId, Long colaboradorId, Long eventoId);
}
