# 📐 Especificação Técnica e Funcional do Sistema (Spec-Driven)

**Sistema:** EscalaFácil - Gerador de Escala Automático  
**Versão do Documento:** 1.0.0  
**Status:** Especificação Completa de Produção  
**Padrão:** Spec-Driven Development (SDD) / Especificação Técnica Orientada a Requisitos  

---

## 📄 1. Visão Geral e Propósito do Sistema

O **EscalaFácil** é um sistema *SaaS Multi-Tenant* projetado para automatizar, otimizar e gerenciar a alocação de colaboradores em escalas de trabalho, turnos e plantões (ex: paróquias, hospitais, eventos, equipes operacionais). 

O objetivo principal da aplicação é substituir processos manuais suscetíveis a erros humanos por um **algoritmo heurístico determinístico de distribuição justa de carga**, que respeita restrições operacionais rígidas (indisponibilidades, limitações de frequência e exclusões mútuas) e otimiza preferências individuais dos colaboradores.

---

## 🏗️ 2. Arquitetura e Stack Tecnológico

O projeto segue uma arquitetura em **Monorepo**, isolando responsabilidades entre backend (API RESTful em camada de serviço), frontend (Single Page Application - SPA) e persistência relacional isolada por tenant.

```mermaid
graph TD
    Client[Navegador / Frontend React SPA] -->|HTTPS / JSON JWT| API[Backend Spring Boot REST API]
    API -->|Spring Security + RBAC| Auth[Autenticação & Multi-tenant TenantId Context]
    API -->|Spring Data JPA| DB[(PostgreSQL Database)]
    API -->|AOP Aspect| Audit[Logs de Auditoria]
    API -->|EscalaService| Algo[Algoritmo de Alocação de Escala]
```

### 2.1 Backend (`/backend`)
* **Linguagem & Runtime:** Java 21 LTS
* **Framework Principal:** Spring Boot 3.3.1
* **Módulos Spring Utilizados:**
  * **Spring Web:** Exposição de endpoints RESTful.
  * **Spring Data JPA & Hibernate:** Persistência de dados e mapeamento objeto-relacional (ORM).
  * **Spring Security:** Segurança stateless via tokens JWT (JSON Web Tokens) com suporte a RBAC e versionamento de token (`token_version`).
  * **Spring AOP (Aspect-Oriented Programming):** Interceptação `@Auditable` para auditoria automática de ações administrativas.
* **Banco de Dados Relacional:** PostgreSQL 16 (compatível com Neon Serverless em nuvem e Docker local).
* **Migração de Schema:** Flyway Migration (`V1` a `V6` em `src/main/resources/db/migration`).
* **Documentação de API:** Springdoc OpenAPI / Swagger UI (`/swagger-ui/index.html`).
* **Utilitários & Testes:** Lombok, JUnit 5 Jupiter.

### 2.2 Frontend (`/frontend`)
* **Framework:** React 18 com TypeScript
* **Ferramenta de Build:** Vite
* **Estilização & Design System:** Tailwind CSS
* **Ícones:** Lucide React
* **Cliente HTTP:** Axios (com interceptores para injeção automática de Bearer JWT)
* **Exportação de Dados:** ExcelJS (geração de planilhas formatadas `.xlsx` no navegador)
* **Gerenciamento de Estado:** React Context API (`AuthContext`)

---

## 🔒 3. Modelo de Segurança, Multi-Tenancy e Permissões (RBAC)

### 3.1 Multi-Tenancy Lógico
O sistema adota o modelo de **Multi-tenancy com tabela compartilhada e segregação por `organizacao_id`**.
* Cada requisição autenticada extrai o `tenantId` do usuário logado via `SecurityUtils.getCurrentTenantId()`.
* As consultas ao banco filtram estritamente os dados pertencentes ao tenant do usuário ativo, garantindo isolamento total de dados entre diferentes organizações/paróquias.

### 3.2 Papéis de Usuário (Roles) e Módulos Delegados
O sistema possui 3 níveis de acesso definidos pelo enum [`Role`](file:///c:/Users/guter/Documents/GitHub/GeradorEscalaAutomatico/backend/src/main/java/br/com/gutemberg/meuprojeto/model/Role.java):

1. **`USER` (Gestor de Organização):** Usuário padrão responsável por cadastrar colaboradores, eventos, marcar indisponibilidades e gerar escalas para a sua própria organização.
2. **`SUPER_ADMIN` (Administrador Global):** Acesso irrestrito a todo o sistema, dashboard de métricas globais, gestão de todas as organizações (tenants), logs de auditoria e criação de Administradores Delegados.
3. **`ADMIN_DELEGADO` (Administrador Auxiliar):** Usuário administrativo com acesso granular concedido via permissões específicas definidas pelo enum [`ModuloPermissao`](file:///c:/Users/guter/Documents/GitHub/GeradorEscalaAutomatico/backend/src/main/java/br/com/gutemberg/meuprojeto/model/ModuloPermissao.java):
   * `USUARIOS`: Permite visualizar e gerenciar organizações e usuários.
   * `FINANCEIRO`: Permite alterar planos de assinatura das organizações.
   * `SUPORTE`: Permite acessar logs de auditoria e métricas do dashboard admin.

### 3.3 Mecanismo de Token Versioning & Revogação
Para permitir **logout forçado** e **invalidação instantânea de sessões**, a entidade `Usuario` possui o campo `tokenVersion` (inteiro).
* Cada token JWT gerado carrega o `tokenVersion` atual do usuário.
* No filtro de autenticação `JwtAuthenticationFilter`, o token é invalidado se a versão contida no JWT for menor que a versão armazenada no banco de dados.
* Ações como troca de senha, alteração de e-mail, suspensão da organização ou logout forçado incrementam o `tokenVersion`.

---

## 📦 4. Especificação do Modelo de Dados (Entidades e Domínio)

```mermaid
erDiagram
    ORGANIZACAO ||--o{ USUARIO : possui
    ORGANIZACAO ||--o{ COLABORADOR : possui
    ORGANIZACAO ||--o{ EVENTO : possui
    ORGANIZACAO ||--o{ ESCALA : possui
    COLABORADOR ||--o{ DISPONIBILIDADE : declara
    EVENTO ||--o{ DISPONIBILIDADE : aplica
    ESCALA ||--o{ EVENTO : contem
    ESCALA ||--o{ ALOCACAO : gera
    EVENTO ||--o{ ALOCACAO : aloca
    COLABORADOR ||--o{ ALOCACAO : designado
    USUARIO ||--o{ PERMISSAO_DELEGADA : possui
```

### 4.1 Entidades Principais

| Entidade | Tabela | Descrição & Responsabilidade |
| :--- | :--- | :--- |
| **[`Organizacao`](file:///c:/Users/guter/Documents/GitHub/GeradorEscalaAutomatico/backend/src/main/java/br/com/gutemberg/meuprojeto/model/Organizacao.java)** | `organizacoes` | Representa a conta/tenant principal (ex: Paróquia São José). Mantém status (`ativo`), data de criação, observações e o plano atual (`GRATUITO`, `PRO`, `ILIMITADO`). |
| **[`Usuario`](file:///c:/Users/guter/Documents/GitHub/GeradorEscalaAutomatico/backend/src/main/java/br/com/gutemberg/meuprojeto/model/Usuario.java)** | `usuarios` | Conta de acesso ao sistema com e-mail único, senha encriptada (BCrypt), `Role`, vínculo com `Organizacao` e `tokenVersion`. Suporta Soft Delete (`deletadoEm`). |
| **[`Colaborador`](file:///c:/Users/guter/Documents/GitHub/GeradorEscalaAutomatico/backend/src/main/java/br/com/gutemberg/meuprojeto/model/Colaborador.java)** | `colaboradores` | Membro elegível para a escala. Contém nome, telefone e duas coleções relacionais: `naoTrabalharCom` e `preferenciaTrabalharCom`. |
| **[`Evento`](file:///c:/Users/guter/Documents/GitHub/GeradorEscalaAutomatico/backend/src/main/java/br/com/gutemberg/meuprojeto/model/Evento.java)** | `eventos` | Plantão/Missa/Turno a ser preenchido. Possui nome, data (`LocalDate`), horário de início (`LocalTime`), cor liturgica/categoria e quantidade de vagas necessárias (`vagasNecessarias`). |
| **[`Disponibilidade`](file:///c:/Users/guter/Documents/GitHub/GeradorEscalaAutomatico/backend/src/main/java/br/com/gutemberg/meuprojeto/model/Disponibilidade.java)** | `disponibilidades` | Registra se um colaborador específico está indisponível (`indisponivel = true`) para um evento específico em um determinado mês/ano. |
| **[`Escala`](file:///c:/Users/guter/Documents/GitHub/GeradorEscalaAutomatico/backend/src/main/java/br/com/gutemberg/meuprojeto/model/Escala.java)** | `escalas` | Registro histórico da escala gerada contendo nome, data de início, data de fim, a lista de eventos e as alocações resultantes. |
| **[`Alocacao`](file:///c:/Users/guter/Documents/GitHub/GeradorEscalaAutomatico/backend/src/main/java/br/com/gutemberg/meuprojeto/model/Alocacao.java)** | `alocacoes` | Vínculo gerado entre uma `Escala`, um `Evento` e um `Colaborador`. |
| **[`AuditLog`](file:///c:/Users/guter/Documents/GitHub/GeradorEscalaAutomatico/backend/src/main/java/br/com/gutemberg/meuprojeto/model/AuditLog.java)** | `logs_auditoria` | Log imutável de operações sensíveis com identificador do administrador, ação realizada, entidade afetada e timestamp. |
| **[`PermissaoDelegada`](file:///c:/Users/guter/Documents/GitHub/GeradorEscalaAutomatico/backend/src/main/java/br/com/gutemberg/meuprojeto/model/PermissaoDelegada.java)** | `permissoes_delegadas` | Permissões concedidas a usuários com papel `ADMIN_DELEGADO`. |

---

## ⚙️ 5. Especificação Algorítmica de Distribuição de Escalas

A lógica central do gerador automático reside na classe [`EscalaService`](file:///c:/Users/guter/Documents/GitHub/GeradorEscalaAutomatico/backend/src/main/java/br/com/gutemberg/meuprojeto/service/EscalaService.java).

### 5.1 Fluxo de Execução do Algoritmo

1. **Ordenação Temporal de Eventos:**  
   Os eventos selecionados são ordenados estritamente por **Data crescente** e, em seguida, por **Hora de Início crescente**.
2. **Carregamento de Indisponibilidades:**  
   O serviço busca em banco todas as `Disponibilidade` marcadas como `indisponivel = true` para os eventos do período e monta um mapa $O(1)$ de consulta em memória (`colaboradorId -> Set<eventoId>`).
3. **Iteração sobre Vagas por Evento:**  
   Para cada evento $E$, para cada vaga $i \in [1, \text{vagasNecessarias}]$:
   * **Filtro de Elegibilidade (Hard Constraints / Restrições Rígidas):**
     1. **Unicidade no Evento:** Colaborador não pode já ter sido alocado neste mesmo evento.
     2. **Indisponibilidade Declarada:** Colaborador não pode estar no conjunto de indisponíveis do evento.
     3. **Conflito de Horário / Limite Diário:** Colaborador não pode já estar alocado em outro evento **na mesma data** (regra de no máximo 1 plantão por dia).
     4. **Restrição de Exclusão Mútua ("Não Trabalhar Com"):** Se o colaborador $C$ possui o colaborador $A$ (já alocado na mesma vaga/evento) em sua lista `naoTrabalharCom`, ou vice-versa, $C$ é desqualificado.
   * **Seleção e Priorização (Soft Constraints / Restrições Leves):**  
     Se a lista de candidatos elegíveis não for vazia, o algoritmo escolhe o melhor candidato usando um comparador encadeado:
     1. **Carga de Trabalho (Workload Balance):** Prioriza o colaborador com **menor contagem de alocações** na escala corrente.
     2. **Preferência de Parceria ("Preferência de Trabalhar Com"):** Prioriza colaboradores que possuem correspondência de preferência recíproca ou unilateral com alguém já alocado no mesmo evento.
     3. **Desempate Estável por Nome:** Ordenação alfabética natural.
     4. **Desempate por ID:** Ordenação numérica por ID.
4. **Relatório de Geração (`RelatorioGeracao`):**  
   Cada evento recebe um status no relatório:
   * `TOTALMENTE_PREENCHIDO`: Todas as vagas foram ocupadas.
   * `PARCIALMENTE_PREENCHIDO`: Menos vagas ocupadas do que o necessário (indica motivo por escassez ou conflitos).
   * `NAO_PREENCHIDO`: Nenhuma vaga foi ocupada.

---

## 💼 6. Regras de Negócio e Limites de Planos de Assinatura

O sistema suporta diferenciação de recursos com base no plano da organização ([`PlanoType`](file:///c:/Users/guter/Documents/GitHub/GeradorEscalaAutomatico/backend/src/main/java/br/com/gutemberg/meuprojeto/model/PlanoType.java)):

| Recurso / Limite | Plano GRATUITO | Plano PRO | Plano ILIMITADO |
| :--- | :---: | :---: | :---: |
| **Limite de Colaboradores Cadastrados** | Máx. 10 | Máx. 50 | Ilimitado |
| **Limite de Eventos Criados por Mês** | Máx. 15 | Máx. 100 | Ilimitado |
| **Histórico e Exportação Excel** | Sim | Sim | Sim |
| **Suporte Técnico Dedicado** | Padrão | Prioritário | VIP |

*As validações de limites de plano ocorrem diretamente nas camadas de serviço/controller antes da inserção no banco.*

---

## 🌐 7. Especificação das APIs REST (Endpoints)

### 7.1 Autenticação e Conta (`/api/auth`)
* `POST /api/auth/login`: Autentica com e-mail e senha. Retorna JWT token e perfil do usuário.
* `POST /api/auth/register`: Cadastro self-service de nova organização e usuário gestor primário (`Role.USER`).
* `POST /api/auth/alterar-senha`: Permite ao usuário logado alterar sua senha e incrementa `tokenVersion`.

### 7.2 Colaboradores e Disponibilidade (`/api/colaboradores`)
* `GET /api/colaboradores`: Lista colaboradores do tenant com resolução otimizada de reciprocidade $O(1)$.
* `GET /api/colaboradores/{id}`: Busca colaborador por ID.
* `POST /api/colaboradores`: Cadastra colaborador (valida limites do plano e regras NTC/PTC).
* `PUT /api/colaboradores/{id}`: Atualiza colaborador e executa atualização automática de reciprocidade cruzada.
* `DELETE /api/colaboradores/{id}`: Remove colaborador.
* `GET /api/colaboradores/{id}/disponibilidade?mes={M}&ano={A}`: Retorna lista de disponibilidade pontual do mês.
* `POST /api/colaboradores/{id}/disponibilidade`: Salva lote de indisponibilidades do colaborador.

### 7.3 Eventos e Turnos (`/api/eventos`)
* `GET /api/eventos?mes={M}&ano={A}` ou `?inicio={D1}&fim={D2}`: Lista eventos filtrados por período.
* `GET /api/eventos/{id}`: Detalhes de um evento.
* `POST /api/eventos`: Cria evento (valida colisão de nome/data/hora e limite do plano).
* `PUT /api/eventos/{id}`: Atualiza dados do evento.
* `DELETE /api/eventos/{id}`: Remove evento.

### 7.4 Geração e Gerenciamento de Escalas (`/api/escalas` e `/api/alocacoes`)
* `POST /api/escalas/gerar`: Executa o algoritmo de geração de escala e salva no banco.
* `GET /api/escalas`: Lista histórico de escalas do tenant.
* `GET /api/escalas/{id}`: Retorna detalhes da escala com seus eventos e alocações.
* `DELETE /api/escalas/{id}`: Exclui uma escala e suas alocações associadas.
* `GET /api/alocacoes?mes={M}&ano={A}`: **Endpoint Light** que retorna um DTO enxuto (`AlocacaoLightDTO`) das alocações do mês (otimização de tráfego de rede).

### 7.5 Administração Global e Tenant Management (`/api/admin`) *(Requer SUPER_ADMIN ou ADMIN_DELEGADO)*
* `GET /api/admin/organizacoes`: Lista tenants ativos com métricas de colaboradores, eventos e escalas.
* `POST /api/admin/organizacoes`: Criação manual de tenant por administrador.
* `PUT /api/admin/organizacoes/{id}`: Edita dados, plano e status da organização.
* `PUT /api/admin/organizacoes/{id}/status`: Ativa/Desativa organização (desativação força logout geral).
* `DELETE /api/admin/organizacoes/{id}`: Executa Soft Delete na organização e invalida todos os seus usuários.
* `POST /api/admin/organizacoes/{id}/reset-senha`: Gera senha temporária para o gestor do tenant.
* `POST /api/admin/organizacoes/{id}/forcar-logout`: Invalida todos os tokens ativos do tenant.
* `GET /api/admin/logs-auditoria`: Consulta logs de auditoria administrativa com filtros por admin, ação e período.
* `GET /api/admin/dashboard/metricas`: Retorna indicadores da plataforma (Organizações Ativas, Churn Candidate >60d sem escalas, Distribuição de Planos, Crescimento Mensal).

### 7.6 Gestão de Administradores Delegados (`/api/admin/delegados`) *(Requer SUPER_ADMIN)*
* `GET /api/admin/delegados`: Lista administradores delegados e suas permissões atribuídas.
* `POST /api/admin/delegados`: Cadastra novo administrador delegado com permissões selecionadas (`USUARIOS`, `FINANCEIRO`, `SUPORTE`).
* `PUT /api/admin/delegados/{id}`: Atualiza dados e permissões do administrador delegado.
* `DELETE /api/admin/delegados/{id}`: Desativa administrador delegado.

---

## 🎨 8. Especificação das Interfaces e Módulos Frontend

A aplicação web SPA é dividida em dois grandes contextos visuais:

```mermaid
graph LR
    subgraph App[EscalaFácil SPA Frontend]
        AuthGuard{Autenticado?}
        AuthGuard -->|Não| Login[Tela de Login / Cadastro]
        AuthGuard -->|Sim - Role USER| UserArea[Área da Organização]
        AuthGuard -->|Sim - Role ADMIN| AdminArea[Painel Administrativo Global]
        
        UserArea --> P1[Gestão de Colaboradores]
        UserArea --> P2[Gestão de Eventos]
        UserArea --> P3[Matriz de Disponibilidade]
        UserArea --> P4[Gerador de Escala]
        UserArea --> P5[Histórico & Exportação Excel]
        
        AdminArea --> A1[Gestão de Tenants]
        AdminArea --> A2[Gestão de Delegados]
        AdminArea --> A3[Metrics Dashboard]
        AdminArea --> A4[Auditoria AOP]
    end
```

### 8.1 Módulos do Gestor (`Role.USER`)
1. **[`Colaboradores.tsx`](file:///c:/Users/guter/Documents/GitHub/GeradorEscalaAutomatico/frontend/src/pages/Colaboradores.tsx):** Cadastramento de colaboradores, gerenciamento de contatos, configuração visual de preferências ("Trabalhar Com") e restrições ("Não Trabalhar Com"), com busca instantânea e paginação.
2. **[`Eventos.tsx`](file:///c:/Users/guter/Documents/GitHub/GeradorEscalaAutomatico/frontend/src/pages/Eventos.tsx):** Calendário e tabela de eventos/plantões com indicação de cor litúrgica, horário e vagas necessárias.
3. **[`DisponibilidadeColaborador.tsx`](file:///c:/Users/guter/Documents/GitHub/GeradorEscalaAutomatico/frontend/src/pages/DisponibilidadeColaborador.tsx):** Matriz mensal interativa para alternar a disponibilidade de cada colaborador em cada evento do mês.
4. **[`GeradorEscala.tsx`](file:///c:/Users/guter/Documents/GitHub/GeradorEscalaAutomatico/frontend/src/pages/GeradorEscala.tsx):** Interface de geração de escala com seleção de período e seleção flexível de colaboradores. Exibe o resultado da alocação e relatórios com indicativos de preenchimento (`TOTALMENTE_PREENCHIDO`, `PARCIALMENTE_PREENCHIDO`, `NAO_PREENCHIDO`).
5. **[`Historico.tsx`](file:///c:/Users/guter/Documents/GitHub/GeradorEscalaAutomatico/frontend/src/pages/Historico.tsx):** Consulta de escalas anteriores com funcionalidade integrada de **Exportação para Excel (`.xlsx`)** formatado.

### 8.2 Módulos Administrativos (`Role.SUPER_ADMIN` / `Role.ADMIN_DELEGADO`)
1. **[`AdminDashboard.tsx`](file:///c:/Users/guter/Documents/GitHub/GeradorEscalaAutomatico/frontend/src/pages/AdminDashboard.tsx):** Portal central do administrador.
2. **[`GerenciarUsuariosAdmin.tsx`](file:///c:/Users/guter/Documents/GitHub/GeradorEscalaAutomatico/frontend/src/pages/GerenciarUsuariosAdmin.tsx):** Gestão de todas as contas clientes (Tenants), alteração de plano, suspensão, logout forçado e reset de senha.
3. **[`GerenciarDelegadosAdmin.tsx`](file:///c:/Users/guter/Documents/GitHub/GeradorEscalaAutomatico/frontend/src/pages/GerenciarDelegadosAdmin.tsx):** Gestão de administradores auxiliares e atribuição granular de módulos.
4. **[`DashboardMetricasAdmin.tsx`](file:///c:/Users/guter/Documents/GitHub/GeradorEscalaAutomatico/frontend/src/pages/DashboardMetricasAdmin.tsx):** Gráficos e indicadores globais de saúde do negócio, análise de churn candidate (organizações sem escalas geradas a mais de 60 dias) e distribuição de assinaturas.
5. **[`ConsultarAuditoriaAdmin.tsx`](file:///c:/Users/guter/Documents/GitHub/GeradorEscalaAutomatico/frontend/src/pages/ConsultarAuditoriaAdmin.tsx):** Tabela de consulta de rastreabilidade de ações administrativas com filtros por responsável, ação e intervalo de datas.

---

## ⚡ 9. Otimizações de Desempenho e Engenharia

Para garantir tempos de resposta mínimos mesmo com um alto volume de colaboradores e alocações, o sistema implementa as seguintes técnicas avançadas de engenharia de software:

1. **Eliminação do Problema de Consulta N+1 (Batch FETCH):**  
   No método `carregarTodosComRelacionamentos`, a busca de colaboradores com coleções `@ElementCollection` (`naoTrabalharCom` e `preferenciaTrabalharCom`) foi otimizada para utilizar consultas customizadas JPQL com `LEFT JOIN FETCH`, reduzindo o número de consultas ao banco de $1 + 2N$ para apenas **2 consultas em lote**.
2. **Resolução de Reciprocidade em Memória $O(N)$:**  
   Em vez de verificar reciprocidades com comparações quadráticas $O(N^2)$, o método `converterParaDTOs` constrói mapas de índices reversos em $O(N)$, garantindo respostas em milissegundos para listagens extensas.
3. **Atualização em Lote com `saveAll`:**  
   As modificações de reciprocidade de preferências de colaboradores são salvas em um único lote (`saveAll`) para evitar múltiplas transações separadas.
4. **Endpoint Light de Alocações (`AlocacaoLightDTO`):**  
   Para telas de consulta mensal, o endpoint `/api/alocacoes` retorna apenas os identificadores estritamente necessários, reduzindo a carga útil (payload) da resposta HTTP de ~200 KB para menos de **5 KB**.

---

## 🚀 10. Guia de Implantação e DevOps (Deploy Spec)

```mermaid
graph TD
    subgraph Production Cloud Architecture
        Vercel[Vercel Static Hosting - React SPA] -->|HTTPS Requests| Render[Render Web Service - Spring Boot Docker API]
        Render -->|SSL JDBC Connection| Neon[(Neon Postgres Serverless DB)]
    end
```

### Variáveis de Ambiente Necessárias

#### Backend (Render / Docker)
* `DATABASE_URL`: Connection string PostgreSQL no formato `postgresql://usuario:senha@host/dbname?sslmode=require`.
* `ALLOWED_ORIGINS`: URL pública do frontend hospedado (ex: `https://escala-facil.vercel.app`).
* `JWT_SECRET`: Chave secreta de 256 bits para assinatura dos tokens JWT.
* `PORT`: Porta de execução (definida automaticamente pelo provedor de nuvem).

#### Frontend (Vercel)
* `VITE_API_URL`: URL pública da API backend no Render com o prefixo `/api` (ex: `https://escala-facil-api.onrender.com/api`).

---

## 📌 Conclusão

Esta especificação driven serve como a **fonte única de verdade (Single Source of Truth)** para o desenvolvimento, manutenção, testes e evolução do sistema **EscalaFácil**. Qualquer nova funcionalidade ou alteração arquitetural deve ser devidamente documentada neste arquivo mantendo a rastreabilidade com os requisitos e código-fonte.
