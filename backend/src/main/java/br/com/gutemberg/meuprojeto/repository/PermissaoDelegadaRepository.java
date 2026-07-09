package br.com.gutemberg.meuprojeto.repository;

import br.com.gutemberg.meuprojeto.model.PermissaoDelegada;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PermissaoDelegadaRepository extends JpaRepository<PermissaoDelegada, Long> {
    List<PermissaoDelegada> findByUsuarioId(Long usuarioId);
    void deleteByUsuarioId(Long usuarioId);
}
