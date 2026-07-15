# ─── Dashboard build stage ────────────────────────────────────────────────────
FROM node:20-alpine AS dashboard-build

WORKDIR /workspace/dashboard-ui

COPY dashboard-ui/package.json dashboard-ui/package-lock.json ./
RUN npm ci

COPY dashboard-ui .
RUN npm run build

# ─── Service build stage ──────────────────────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS build

WORKDIR /workspace

# Copy Maven wrapper and POM first (layer-cache friendly)
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Download dependencies (cached unless pom.xml changes)
RUN ./mvnw dependency:go-offline -B

# Copy source and build
COPY src src
COPY --from=dashboard-build /workspace/dashboard-ui/dist src/main/resources/static/dashboard
RUN ./mvnw package -DskipTests -B

# ─── Runtime stage ────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine AS runtime

LABEL maintainer="ProjectManagementService Team"
LABEL org.opencontainers.image.title="ProjectManagementService"
LABEL org.opencontainers.image.description="Manages project lifecycle operations"

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

WORKDIR /app

# Copy the fat JAR from the build stage
COPY --from=build /workspace/target/project-management-service-*.jar app.jar

# Expose the default port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:8080/api/v1/health || exit 1

ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
