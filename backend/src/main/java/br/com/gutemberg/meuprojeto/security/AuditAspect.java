package br.com.gutemberg.meuprojeto.security;

import br.com.gutemberg.meuprojeto.model.AuditLog;
import br.com.gutemberg.meuprojeto.repository.AuditLogRepository;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.time.LocalDateTime;

@Aspect
@Component
public class AuditAspect {

    private final AuditLogRepository auditLogRepository;

    public AuditAspect(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @AfterReturning(pointcut = "@annotation(br.com.gutemberg.meuprojeto.security.Auditable)", returning = "result")
    public void logAudit(JoinPoint joinPoint, Object result) {
        try {
            MethodSignature signature = (MethodSignature) joinPoint.getSignature();
            Method method = signature.getMethod();
            Auditable auditable = method.getAnnotation(Auditable.class);

            UsuarioPrincipal user = SecurityUtils.getCurrentUser();
            Long adminId = user != null ? user.getId() : null;
            String adminNome = user != null ? user.getNome() : "Sistema / Deslogado";

            String acao = auditable.acao();
            String entidade = auditable.entidade();
            Long entidadeId = null;

            // Tentar extrair ID dos argumentos
            Object[] args = joinPoint.getArgs();
            if (args != null && args.length > 0) {
                if (args[0] instanceof Long) {
                    entidadeId = (Long) args[0];
                }
            }

            // Montar detalhes a partir dos argumentos
            StringBuilder detalhes = new StringBuilder();
            detalhes.append("Método: ").append(method.getName()).append(". ");
            if (args != null && args.length > 0) {
                detalhes.append("Args: ");
                for (int i = 0; i < args.length; i++) {
                    if (args[i] != null) {
                        String str = args[i].toString();
                        if (str.length() > 500) {
                            str = str.substring(0, 500) + "...";
                        }
                        detalhes.append("[").append(i).append("]: ").append(str).append("; ");
                    }
                }
            }

            AuditLog log = AuditLog.builder()
                    .adminId(adminId)
                    .adminNome(adminNome)
                    .acao(acao)
                    .entidadeAfetada(entidade)
                    .entidadeId(entidadeId)
                    .timestamp(LocalDateTime.now())
                    .detalhes(detalhes.toString())
                    .build();

            auditLogRepository.save(log);
        } catch (Exception e) {
            // Ignorar falhas na gravação de log para não interromper a transação original
            System.err.println("Erro ao gravar log de auditoria: " + e.getMessage());
        }
    }
}
