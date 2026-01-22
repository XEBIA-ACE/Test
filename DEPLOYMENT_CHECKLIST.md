# Deployment Checklist

Use this checklist to ensure proper deployment of the Configuration Service.

## Pre-Deployment

### 1. Configuration Repository Setup
- [ ] Create Git repository for configurations
- [ ] Add application configuration files
- [ ] Add environment-specific configs (dev, staging, prod)
- [ ] Test Git repository access
- [ ] Set up Git credentials (username/token)
- [ ] Configure branch protection for production

### 2. Environment Variables
- [ ] Copy `.env.example` to `.env`
- [ ] Set `GIT_REPO_URI` to your config repository
- [ ] Set `GIT_USERNAME` and `GIT_PASSWORD`
- [ ] Change default `CONFIG_USERNAME` and `CONFIG_PASSWORD`
- [ ] Set appropriate `SPRING_PROFILES_ACTIVE`
- [ ] Configure Consul settings (if used)
- [ ] Configure Vault settings (if used)

### 3. Security Review
- [ ] Change default credentials from example values
- [ ] Review and update password strength
- [ ] Encrypt sensitive configuration values
- [ ] Configure HTTPS/TLS certificates
- [ ] Review network security groups
- [ ] Set up secrets management (Vault)
- [ ] Configure authentication provider

### 4. Build & Test
- [ ] Run `mvn clean package`
- [ ] Run all tests: `mvn test`
- [ ] Build Docker image: `./scripts/docker-build.sh`
- [ ] Test Docker image locally
- [ ] Verify health endpoints

## Development Deployment

### Local Development
- [ ] Copy `.env.example` to `.env`
- [ ] Set `SPRING_PROFILES_ACTIVE=dev`
- [ ] Run `docker-compose up -d`
- [ ] Verify services are running
- [ ] Test health endpoint: `curl http://localhost:8888/actuator/health`
- [ ] Test config retrieval with sample data

### Docker Compose
```bash
# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f config-service

# Test health
curl http://localhost:8888/actuator/health

# Stop services
docker-compose down
```

## Staging Deployment

### Pre-Staging
- [ ] Set `SPRING_PROFILES_ACTIVE=staging`
- [ ] Configure staging Git repository/branch
- [ ] Set up staging Consul instance
- [ ] Set up staging Vault instance
- [ ] Update staging credentials
- [ ] Configure staging database/services

### Deploy
- [ ] Build production Docker image
- [ ] Tag image with version: `docker tag config-service:latest config-service:1.0.0`
- [ ] Push to container registry
- [ ] Deploy to staging environment
- [ ] Run smoke tests
- [ ] Verify service registration with Consul
- [ ] Check Vault connectivity
- [ ] Monitor logs for errors

### Post-Deployment
- [ ] Verify health checks: `GET /actuator/health`
- [ ] Test configuration retrieval
- [ ] Check Prometheus metrics
- [ ] Verify logs are being collected
- [ ] Test with client applications

## Production Deployment

### Pre-Production
- [ ] Set `SPRING_PROFILES_ACTIVE=prod`
- [ ] Configure production Git repository
- [ ] Set up production Consul cluster
- [ ] Set up production Vault cluster
- [ ] Update production credentials
- [ ] Configure production resources (CPU, memory)
- [ ] Set up monitoring (Prometheus + Grafana)
- [ ] Configure log aggregation
- [ ] Set up alerting rules
- [ ] Review security settings

### Deployment Steps
- [ ] Build production image: `docker build -t config-service:1.0.0 .`
- [ ] Run security scan on image
- [ ] Push to production registry
- [ ] Apply Kubernetes/cloud manifests
- [ ] Verify rolling deployment
- [ ] Check service discovery registration
- [ ] Monitor deployment metrics

### Post-Deployment Verification
```bash
# Health check
curl https://config-service.example.com/actuator/health

# Config retrieval
curl -u admin:password https://config-service.example.com/myapp/prod

# Metrics
curl -u admin:password https://config-service.example.com/actuator/prometheus

# Custom health
curl -u admin:password https://config-service.example.com/api/v1/config/health
```

### Verification Checklist
- [ ] Service is healthy and responding
- [ ] Consul shows service as registered
- [ ] Vault connectivity working
- [ ] Configuration retrieval working
- [ ] Metrics being collected
- [ ] Logs being aggregated
- [ ] Alerts configured
- [ ] SSL/TLS working
- [ ] Authentication working
- [ ] Client applications can fetch config

## Monitoring Setup

### Prometheus
- [ ] Configure Prometheus to scrape metrics endpoint
- [ ] Add alerting rules
- [ ] Set up dashboards in Grafana
- [ ] Monitor key metrics:
  - `config.health.check` - Health check duration
  - `http.server.requests` - Request metrics
  - `jvm.memory.used` - Memory usage
  - `system.cpu.usage` - CPU usage

### Logging
- [ ] Configure log aggregation (ELK, Splunk, etc.)
- [ ] Set up log retention policies
- [ ] Create log-based alerts
- [ ] Configure log levels appropriately

### Alerting
- [ ] Service down alert
- [ ] High error rate alert
- [ ] Git connectivity failure alert
- [ ] Consul connectivity failure alert
- [ ] Vault connectivity failure alert
- [ ] High memory usage alert
- [ ] High CPU usage alert

## Rollback Plan

### If Deployment Fails
1. Check logs: `docker-compose logs config-service`
2. Verify environment variables
3. Check Git repository connectivity
4. Verify Consul/Vault connectivity
5. Rollback to previous version:
   ```bash
   kubectl rollout undo deployment/config-service
   # or
   docker-compose down
   docker-compose up -d
   ```

### Rollback Checklist
- [ ] Identify issue from logs
- [ ] Revert to previous image version
- [ ] Verify rollback successful
- [ ] Test with health checks
- [ ] Document issue for post-mortem

## Kubernetes Deployment (Optional)

### Create Kubernetes Resources
```bash
# Create namespace
kubectl create namespace config-service

# Create secret for Git credentials
kubectl create secret generic git-credentials \
  --from-literal=username=your-username \
  --from-literal=password=your-token \
  -n config-service

# Create secret for config service credentials
kubectl create secret generic config-credentials \
  --from-literal=username=admin \
  --from-literal=password=secure-password \
  -n config-service

# Apply deployment
kubectl apply -f k8s/deployment.yaml -n config-service

# Apply service
kubectl apply -f k8s/service.yaml -n config-service

# Apply ingress
kubectl apply -f k8s/ingress.yaml -n config-service
```

### Kubernetes Checklist
- [ ] Create namespace
- [ ] Create secrets
- [ ] Configure resource limits
- [ ] Set up liveness/readiness probes
- [ ] Configure ingress/load balancer
- [ ] Set up horizontal pod autoscaling
- [ ] Configure persistent volumes (if needed)
- [ ] Apply network policies

## Post-Deployment

### Documentation
- [ ] Update deployment documentation
- [ ] Document any configuration changes
- [ ] Update runbooks
- [ ] Document troubleshooting steps

### Team Communication
- [ ] Notify team of deployment
- [ ] Share deployment notes
- [ ] Update status page
- [ ] Schedule post-deployment review

### Monitoring
- [ ] Monitor for 24 hours post-deployment
- [ ] Check error rates
- [ ] Verify metrics collection
- [ ] Review logs for warnings/errors
- [ ] Test failover scenarios

## Troubleshooting

### Common Issues

**Service won't start**
```bash
# Check logs
docker logs config-service

# Verify environment variables
docker exec config-service env | grep -E "GIT|CONSUL|VAULT"

# Test Git connectivity
git ls-remote $GIT_REPO_URI
```

**Can't connect to Consul**
```bash
# Check Consul status
curl http://consul:8500/v1/status/leader

# Disable Consul temporarily
export CONSUL_ENABLED=false
```

**Can't connect to Vault**
```bash
# Check Vault status
curl http://vault:8200/v1/sys/health

# Disable Vault temporarily
export VAULT_ENABLED=false
```

**Authentication failures**
```bash
# Verify credentials
echo $CONFIG_USERNAME
echo $CONFIG_PASSWORD

# Test authentication
curl -u $CONFIG_USERNAME:$CONFIG_PASSWORD http://localhost:8888/actuator/metrics
```

## Maintenance

### Regular Tasks
- [ ] Review logs weekly
- [ ] Check metrics dashboards daily
- [ ] Update dependencies monthly
- [ ] Review and rotate credentials quarterly
- [ ] Test backup/restore procedures monthly
- [ ] Review and update documentation
- [ ] Conduct security audits quarterly

### Updates
- [ ] Test updates in dev/staging first
- [ ] Review change logs
- [ ] Update dependencies
- [ ] Run full test suite
- [ ] Deploy during maintenance window
- [ ] Monitor closely after updates

---

**Remember**: Always test in dev/staging before production deployment!
