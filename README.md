# EscalaFácil - Gerador de Escala Automático

Este é o **EscalaFácil**, um sistema completo e moderno projetado para automatizar e otimizar a criação de escalas de trabalho e plantões de colaboradores. O sistema distribui plantões de forma justa e equilibrada, respeitando as datas e intervalos de indisponibilidade de cada profissional e evitando conflitos de horários.

---

## 🛠️ Tecnologias Utilizadas

O projeto está estruturado como um **Monorepo** dividido em duas partes principais:

### 1. Backend (`/backend`)
*   **Java 21**
*   **Spring Boot 3.3.1** (Web, Data JPA, Validation)
*   **PostgreSQL** (Banco de dados relacional principal)
*   **Flyway Migration** (Gerenciamento versionado do esquema do banco de dados)
*   **Lombok** (Redução de boilerplate de código)
*   **JUnit 5 (Jupiter)** (Testes de unidade para o algoritmo de distribuição)
*   **Springdoc OpenAPI / Swagger** (Documentação interativa da API)

### 2. Frontend (`/frontend`)
*   **React + Vite + TypeScript**
*   **Tailwind CSS** (Estilização limpa, moderna e responsiva)
*   **Lucide React** (Pacote de ícones moderno)
*   **Axios** (Comunicação HTTP com a API)

### 3. Infraestrutura Local
*   **Docker Compose** (Containerização do banco de dados PostgreSQL)

---

## 📦 Estrutura de Diretórios

*   `/backend` - Código fonte em Spring Boot, migrations do banco e testes unitários.
*   `/frontend` - Interface web em React desenvolvida com design system moderno e responsivo.
*   `docker-compose.yml` - Configuração para subir o PostgreSQL localmente com um comando.
*   `.gitignore` - Configuração unificada do Git para ignorar artefatos do Java/Node.

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
*   **Docker** e **Docker Compose** instalados.
*   **Node.js** (versão 18 ou superior) e **npm** instalados.
*   **Java JDK 21** e **Maven** instalados (para build e execução do backend).

---

### Passo 1: Subir o Banco de Dados (PostgreSQL)
Na raiz do projeto (onde está o arquivo `docker-compose.yml`), execute o comando para iniciar o PostgreSQL em segundo plano:
```bash
docker-compose up -d
```
Isso iniciará o Postgres na porta padrão `5432` com a base `escala_db`.

---

### Passo 2: Executar o Backend (Spring Boot)
1. Navegue até o diretório `backend`:
   ```bash
   cd backend
   ```
2. Execute o comando do Maven para subir a aplicação:
   ```bash
   mvn spring-boot:run
   ```
   *Nota: Caso o Maven não esteja no PATH global, você pode abrir e rodar a pasta `backend/` diretamente através da sua IDE preferida (IntelliJ IDEA, Eclipse, VS Code).*

A API estará de pé na porta **`8080`**.
*   **Documentação da API (Swagger UI):** acesse [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html) para testar os endpoints interativamente.

---

### Passo 3: Executar o Frontend (React + Vite)
1. Abra um novo terminal na raiz do projeto e navegue até a pasta `frontend`:
   ```bash
   cd frontend
   ```
2. Instale as dependências (caso não tenham sido instaladas):
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

A interface web estará disponível em **[http://localhost:5173](http://localhost:5173)**.

---

## 🔬 Algoritmo de Distribuição de Escalas

A lógica central está localizada em `EscalaService.java`. O algoritmo:
1. Filtra colaboradores elegíveis com base nas suas **indisponibilidades pontuais** e **intervalos de indisponibilidade**.
2. Garante que um colaborador **não seja escalado em horários coincidentes** no mesmo dia.
3. Garante o **balanceamento de carga**, escolhendo prioritariamente colaboradores com menos plantões alocados na escala atual.
4. Gera um relatório detalhado (`RelatorioGeracao`) indicando o status de preenchimento (Total, Parcial ou Não Preenchido) de cada vaga de plantão.
