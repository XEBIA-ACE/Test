# Quick Start Guide

Get the Configuration Service running in under 5 minutes!

## Option 1: Docker Compose (Recommended)

The fastest way to get started with all dependencies.

### Step 1: Set Environment Variables

```bash
cp .env.example .env
```

Edit `.env` file:
```bash
# Minimal configuration for local testing
SPRING_PROFILES_ACTIVE=dev
GIT_REPO_URI=https://github.com/spring-cloud-samples/config-repo
CONFIG_USERNAME=admin
CONFIG_PASSWORD=admin123
```

### Step 2: Start Services

```bash
docker-compose up -d
```

This starts:
- Config Service (port 8888)
- Consul (port 8500)
- Vault (port 8200)
- Gitea (optional Git server, port 3000)

### Step 3: Verify

```bash
# Check health
curl http://localhost:8888/actuator/health

# Get sample config (using demo repo)
curl -u admin:admin123 http://localhost:8888/foo/development
```

### Step 4: Access UIs

- Config Service: http://localhost:8888/actuator
- Consul UI: http://localhost:8500
- Vault UI: http://localhost:8200 (token: myroot)

## Option 2: Local Java

Run directly on your machine without Docker.

### Prerequisites

- Java 17+
- Maven 3.6+

### Step 1: Build

```bash
mvn clean package -DskipTests
```

### Step 2: Run

```bash
export GIT_REPO_URI=https://github.com/spring-cloud-samples/config-repo
export SPRING_PROFILES_ACTIVE=dev
java -jar target/config-service-1.0.0.jar
```

Or use Maven:

```bash
./scripts/run-dev.sh
```

### Step 3: Test

```bash
curl http://localhost:8888/actuator/health
curl -u admin:dev123 http://localhost:8888/foo/development
```

## Option 3: Development Mode

For active development with auto-reload.

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

## Next Steps

### 1. Create Your Configuration Repository

```bash
# Create a new Git repository
mkdir my-config-repo
cd my-config-repo
git init

# Create application config
cat > application.yml << EOF
common:
  timezone: UTC
EOF

# Commit and push
git add .
git commit -m "Initial config"
git remote add origin https://github.com/your-org/my-config-repo.git
git push -u origin main
```

### 2. Update Config Service

```bash
export GIT_REPO_URI=https://github.com/your-org/my-config-repo.git
export GIT_USERNAME=your-username
export GIT_PASSWORD=your-token
```

Restart the service.

### 3. Add Your Application Config

Create `my-config-repo/myapp/application.yml`:

```yaml
app:
  name: My Application
  version: 1.0.0

database:
  url: jdbc:postgresql://localhost:5432/myapp
  username: appuser
```

### 4. Retrieve Configuration

```bash
curl -u admin:admin123 http://localhost:8888/myapp/default
```

## Common Commands

```bash
# Health check
curl http://localhost:8888/actuator/health

# Get config for app 'myapp' in 'prod' environment
curl -u admin:admin123 http://localhost:8888/myapp/prod

# Encrypt a value
curl -u admin:admin123 -X POST \
  -H "Content-Type: text/plain" \
  -d "mysecret" \
  http://localhost:8888/encrypt

# View metrics
curl -u admin:admin123 http://localhost:8888/actuator/metrics

# Stop Docker Compose
docker-compose down

# View logs
docker-compose logs -f config-service
```

## Troubleshooting

### Service won't start

```bash
# Check logs
docker-compose logs config-service

# Or for local run
tail -f logs/config-service.log
```

### Can't connect to Git repository

```bash
# Test Git access
git ls-remote https://github.com/your-org/config-repo.git

# Use public demo repository for testing
export GIT_REPO_URI=https://github.com/spring-cloud-samples/config-repo
```

### Authentication issues

Default credentials:
- Username: `admin`
- Password: `admin123` (Docker Compose) or `dev123` (local dev)

Change in `.env` file:
```bash
CONFIG_USERNAME=myuser
CONFIG_PASSWORD=mypassword
```

## Production Deployment

For production deployment, see [README.md](README.md) for:
- Security hardening
- Vault integration
- Consul setup
- Kubernetes deployment
- Monitoring setup

## Support

- Full documentation: [README.md](README.md)
- API reference: [API.md](API.md)
- Issues: GitHub Issues
