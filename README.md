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

---

## 🌐 Preparação para Deploy em Produção

O sistema está preparado para ser hospedado gratuitamente ou em planos pagos utilizando a seguinte arquitetura de nuvem:
*   **Banco de Dados:** Neon (PostgreSQL Serverless)
*   **Backend (API Java):** Render (Web Service)
*   **Frontend (SPA React):** Vercel (Static Hosting)

### 📋 Ordem Recomendada de Deploy

#### Passo 1: Criar Banco de Dados no Neon
1. Crie uma conta em [Neon.tech](https://neon.tech/) e crie um novo projeto PostgreSQL.
2. Copie a **Connection String** gerada (exemplo: `postgresql://neondb_owner:senha@ep-host.neon.tech/neondb?sslmode=require`).
   * *Dica:* A nossa aplicação possui um parser inteligente interno (`DataSourceConfig.java`) que converterá automaticamente a URL no formato `postgres://` ou `postgresql://` para o formato JDBC `jdbc:postgresql://` exigido pelo Java, incluindo o parâmetro SSL obrigatório (`sslmode=require`).

#### Passo 2: Hospedar o Backend no Render
1. Crie um novo **Web Service** no [Render.com](https://render.com/) e aponte para o seu repositório Git.
2. Defina os seguintes parâmetros na criação do serviço:
   * **Root Directory:** `backend`
   * **Runtime:** `Docker` (ou `Java` se preferir build nativo com Maven, configurando o comando de build `mvn clean package -DskipTests` e comando de start `java -jar target/*.jar`).
3. Nas configurações do serviço, adicione as seguintes **Environment Variables**:
   * `DATABASE_URL`: A Connection String do Neon obtida no Passo 1.
   * `ALLOWED_ORIGINS`: A URL de produção que seu frontend terá no Vercel (ex: `https://seu-app.vercel.app`), ou `*` para liberar temporariamente (não recomendado para produção).
   * `JWT_SECRET`: Uma chave aleatória e segura de pelo menos 256 bits (32 caracteres) para assinar os tokens JWT da autenticação.
   * `PORT`: O Render define essa porta automaticamente na inicialização, e o Spring Boot a escutará de forma reativa.
4. Ao inicializar, o backend rodará automaticamente as migrações do banco com o Flyway (`V1` a `V6`), inserindo o usuário de suporte Super Admin default (`admin@escalafacil.com` / `admin123`).
5. A URL final do seu backend no Render será no formato `https://seu-backend.onrender.com`. O endpoint de monitoramento de integridade (Health Check) estará disponível publicamente em `https://seu-backend.onrender.com/health`.

#### Passo 3: Hospedar o Frontend no Vercel
1. Crie um projeto no [Vercel.com](https://vercel.com/) e conecte com o seu repositório Git.
2. Configure os seguintes diretórios e variáveis na importação:
   * **Framework Preset:** `Vite`
   * **Root Directory:** `frontend`
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
3. Nas configurações de **Environment Variables** do Vercel, adicione:
   * `VITE_API_URL`: A URL do seu backend hospedado no Render com o sufixo `/api` (exemplo: `https://seu-backend.onrender.com/api`).
4. O arquivo `vercel.json` presente no diretório `/frontend` garante que as rotas internas de SPA (Single Page Application) do React sejam reescritas de volta para o `index.html`, evitando erros de 404 ao atualizar a página.

