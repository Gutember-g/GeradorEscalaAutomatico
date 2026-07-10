# Stage 1: Compilação da aplicação com Maven e JDK 21
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Copiar arquivo de definição de dependências e baixar em cache
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copiar os fontes e realizar o empacotamento do JAR (pulando testes no build)
COPY src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: Imagem final leve para execução com JRE 21
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copiar apenas o artefato gerado da etapa anterior
COPY --from=build /app/target/*.jar app.jar

# Expor a porta (Render mapeará automaticamente usando a variável PORT)
EXPOSE 8080

# Comando para iniciar a aplicação
ENTRYPOINT ["java", "-jar", "app.jar"]
