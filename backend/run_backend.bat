@echo off
set "JAVA_HOME=C:\Program Files\Java\jdk-26.0.1"
mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=h2
