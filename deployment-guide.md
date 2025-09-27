# Hall Management Service - Deployment Guide

## 🚀 Deployment Overview

This guide covers the deployment of the Rubizz Hotel Inn Hall Management Service across different environments (development, staging, production) using various deployment strategies.

## 📋 Prerequisites

### System Requirements
- **Node.js**: 18.0.0 or higher
- **PostgreSQL**: 13.0 or higher
- **Redis**: 6.0 or higher
- **Memory**: Minimum 2GB RAM
- **Storage**: Minimum 10GB free space
- **CPU**: Minimum 2 cores

### Infrastructure Requirements
- **Load Balancer**: For high availability
- **SSL Certificate**: For HTTPS
- **Domain**: For service discovery
- **Monitoring**: Prometheus, Grafana
- **Logging**: ELK Stack or similar

## 🏗️ Environment Setup

### 1. Development Environment

#### Local Development
```bash
# Clone repository
git clone <repository-url>
cd rubizz-hall-service

# Install dependencies
npm install

# Setup environment
cp env.example .env
# Edit .env with development values

# Setup database
npm run prisma:generate
npm run prisma:migrate

# Start development server
npm run dev
```

#### Docker Development
```bash
# Build development image
docker build -t rubizz/hall-service:dev .

# Run with docker-compose
docker-compose -f docker-compose.dev.yml up
```

### 2. Staging Environment

#### Kubernetes Deployment
```yaml
# staging-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hall-service-staging
  namespace: staging
spec:
  replicas: 2
  selector:
    matchLabels:
      app: hall-service
      environment: staging
  template:
    metadata:
      labels:
        app: hall-service
        environment: staging
    spec:
      containers:
      - name: hall-service
        image: rubizz/hall-service:staging
        ports:
        - containerPort: 3007
        env:
        - name: NODE_ENV
          value: "staging"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: hall-service-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: hall-service-secrets
              key: redis-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3007
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3007
          initialDelaySeconds: 5
          periodSeconds: 5
```

### 3. Production Environment

#### High Availability Setup
```yaml
# production-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hall-service-prod
  namespace: production
spec:
  replicas: 5
  selector:
    matchLabels:
      app: hall-service
      environment: production
  template:
    metadata:
      labels:
        app: hall-service
        environment: production
    spec:
      containers:
      - name: hall-service
        image: rubizz/hall-service:latest
        ports:
        - containerPort: 3007
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: hall-service-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: hall-service-secrets
              key: redis-url
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3007
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3007
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        securityContext:
          runAsNonRoot: true
          runAsUser: 1000
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL
```

## 🐳 Docker Deployment

### Dockerfile
```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3007

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3007/health/live', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start application
CMD ["node", "dist/index.js"]
```

### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  hall-service:
    build: .
    ports:
      - "3007:3007"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:password@postgres:5432/hall_db
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3007/health/live"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=hall_db
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

## ☸️ Kubernetes Deployment

### Namespace
```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: hall-service
  labels:
    name: hall-service
```

### ConfigMap
```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: hall-service-config
  namespace: hall-service
data:
  NODE_ENV: "production"
  PORT: "3007"
  LOG_LEVEL: "info"
  RATE_LIMIT_WINDOW_MS: "900000"
  RATE_LIMIT_MAX_REQUESTS: "100"
```

### Secrets
```yaml
# secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: hall-service-secrets
  namespace: hall-service
type: Opaque
data:
  DATABASE_URL: <base64-encoded-database-url>
  REDIS_URL: <base64-encoded-redis-url>
  JWT_SECRET: <base64-encoded-jwt-secret>
  API_GATEWAY_SECRET: <base64-encoded-api-gateway-secret>
```

### Service
```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: hall-service
  namespace: hall-service
spec:
  selector:
    app: hall-service
  ports:
  - port: 3007
    targetPort: 3007
    protocol: TCP
  type: ClusterIP
```

### Ingress
```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: hall-service-ingress
  namespace: hall-service
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - hall-service.rubizzhotel.com
    secretName: hall-service-tls
  rules:
  - host: hall-service.rubizzhotel.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: hall-service
            port:
              number: 3007
```

### Horizontal Pod Autoscaler
```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: hall-service-hpa
  namespace: hall-service
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: hall-service
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## 🔄 CI/CD Pipeline

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy Hall Service

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    - run: npm ci
    - run: npm run lint
    - run: npm test
    - run: npm run test:coverage

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    - run: npm ci
    - run: npm run build
    - uses: actions/upload-artifact@v3
      with:
        name: build-files
        path: dist/

  docker:
    needs: build
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/download-artifact@v3
      with:
        name: build-files
        path: dist/
    - uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: |
          rubizz/hall-service:latest
          rubizz/hall-service:${{ github.sha }}

  deploy:
    needs: docker
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - uses: actions/checkout@v3
    - uses: azure/k8s-deploy@v1
      with:
        manifests: |
          k8s/namespace.yaml
          k8s/configmap.yaml
          k8s/secrets.yaml
          k8s/deployment.yaml
          k8s/service.yaml
          k8s/ingress.yaml
          k8s/hpa.yaml
        kubeconfig: ${{ secrets.KUBE_CONFIG }}
```

## 📊 Monitoring & Observability

### Prometheus Metrics
```yaml
# prometheus-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
    scrape_configs:
    - job_name: 'hall-service'
      static_configs:
      - targets: ['hall-service:3007']
      metrics_path: /metrics
      scrape_interval: 30s
```

### Grafana Dashboard
```json
{
  "dashboard": {
    "title": "Hall Service Dashboard",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{endpoint}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])",
            "legendFormat": "5xx errors"
          }
        ]
      }
    ]
  }
}
```

## 🔒 Security

### Security Policies
```yaml
# security-policy.yaml
apiVersion: v1
kind: PodSecurityPolicy
metadata:
  name: hall-service-psp
spec:
  privileged: false
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
    - ALL
  volumes:
    - 'configMap'
    - 'emptyDir'
    - 'projected'
    - 'secret'
    - 'downwardAPI'
    - 'persistentVolumeClaim'
  runAsUser:
    rule: 'MustRunAsNonRoot'
  seLinux:
    rule: 'RunAsAny'
  fsGroup:
    rule: 'RunAsAny'
```

### Network Policies
```yaml
# network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: hall-service-netpol
  namespace: hall-service
spec:
  podSelector:
    matchLabels:
      app: hall-service
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: api-gateway
    ports:
    - protocol: TCP
      port: 3007
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: database
    ports:
    - protocol: TCP
      port: 5432
  - to:
    - namespaceSelector:
        matchLabels:
          name: redis
    ports:
    - protocol: TCP
      port: 6379
```

## 🚨 Troubleshooting

### Common Issues

#### Service Not Starting
```bash
# Check logs
kubectl logs -f deployment/hall-service -n hall-service

# Check events
kubectl get events -n hall-service --sort-by='.lastTimestamp'

# Check pod status
kubectl get pods -n hall-service
```

#### Database Connection Issues
```bash
# Test database connectivity
kubectl exec -it deployment/hall-service -n hall-service -- \
  npx prisma db pull

# Check database secrets
kubectl get secret hall-service-secrets -n hall-service -o yaml
```

#### High Memory Usage
```bash
# Check resource usage
kubectl top pods -n hall-service

# Check memory limits
kubectl describe pod <pod-name> -n hall-service
```

### Health Check Failures
```bash
# Manual health check
curl -f http://hall-service.rubizzhotel.com/health/detailed

# Check readiness
kubectl get pods -n hall-service -o wide
```

## 📈 Performance Tuning

### Database Optimization
```sql
-- Add indexes for common queries
CREATE INDEX idx_hall_bookings_date ON hall_bookings(start_date, end_date);
CREATE INDEX idx_hall_bookings_customer ON hall_bookings(customer_id);
CREATE INDEX idx_hall_bookings_status ON hall_bookings(status);

-- Optimize queries
EXPLAIN ANALYZE SELECT * FROM hall_bookings 
WHERE start_date >= '2024-01-01' AND end_date <= '2024-12-31';
```

### Redis Optimization
```bash
# Configure Redis for production
redis-cli CONFIG SET maxmemory 1gb
redis-cli CONFIG SET maxmemory-policy allkeys-lru
redis-cli CONFIG SET save "900 1 300 10 60 10000"
```

### Application Tuning
```javascript
// Increase connection pool size
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'info', 'warn', 'error'],
});

// Configure Redis connection pool
const redis = createClient({
  url: process.env.REDIS_URL,
  socket: {
    connectTimeout: 10000,
    lazyConnect: true,
  },
});
```

## 🔄 Backup & Recovery

### Database Backup
```bash
# Create backup
pg_dump -h localhost -U user -d hall_db > hall_db_backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
psql -h localhost -U user -d hall_db < hall_db_backup_20240101_120000.sql
```

### Kubernetes Backup
```bash
# Backup all resources
kubectl get all -n hall-service -o yaml > hall-service-backup.yaml

# Restore resources
kubectl apply -f hall-service-backup.yaml
```

## 📚 Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Redis Configuration](https://redis.io/docs/manual/config/)
- [Prometheus Monitoring](https://prometheus.io/docs/)

---

**For additional support, contact the DevOps team at devops@rubizzhotel.com**
