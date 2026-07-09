package br.com.gutemberg.meuprojeto.repository;

import br.com.gutemberg.meuprojeto.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    
    @Query("SELECT u FROM Usuario u WHERE u.email = :email AND u.deletadoEm IS NULL")
    Optional<Usuario> findByEmail(@Param("email") String email);
    
    @Query("SELECT COUNT(u) > 0 FROM Usuario u WHERE u.email = :email AND u.deletadoEm IS NULL")
    boolean existsByEmail(@Param("email") String email);
    
    @Query("SELECT u FROM Usuario u WHERE u.organizacao.id = :organizacaoId AND u.deletadoEm IS NULL")
    List<Usuario> findByOrganizacaoId(@Param("organizacaoId") Long organizacaoId);
}
