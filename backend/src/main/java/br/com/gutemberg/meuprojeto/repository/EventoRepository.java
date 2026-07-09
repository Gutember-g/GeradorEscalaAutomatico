package br.com.gutemberg.meuprojeto.repository;

import br.com.gutemberg.meuprojeto.model.Evento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface EventoRepository extends JpaRepository<Evento, Long> {
    List<Evento> findByOrganizacaoId(Long organizacaoId);
    
    Optional<Evento> findByIdAndOrganizacaoId(Long id, Long organizacaoId);
    
    List<Evento> findByOrganizacaoIdAndDataBetween(Long organizacaoId, LocalDate inicio, LocalDate fim);
    
    boolean existsByOrganizacaoIdAndNomeAndDataAndHoraInicio(Long organizacaoId, String nome, LocalDate data, LocalTime horaInicio);
    
    Optional<Evento> findByOrganizacaoIdAndNomeAndDataAndHoraInicio(Long organizacaoId, String nome, LocalDate data, LocalTime horaInicio);

    long countByOrganizacaoId(Long organizacaoId);

    long countByOrganizacaoIdAndDataBetween(Long organizacaoId, LocalDate inicio, LocalDate fim);
}
