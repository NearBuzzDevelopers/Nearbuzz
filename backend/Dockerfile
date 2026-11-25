# Stage 1: Build Spring Boot JAR with Java 21
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

COPY src src
RUN ./mvnw clean package -DskipTests -B

# Stage 2: Minimal JRE runtime tuned for Render 512MB free tier
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=build /app/target/*.jar app.jar
USER appuser

EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java -XX:+UseSerialGC -Xms128m -Xmx384m -Dserver.port=${PORT:-8080} -jar app.jar"]
