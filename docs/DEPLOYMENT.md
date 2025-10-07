# 🚀 Deployment Guide

## Índice
- [Pre-Deploy Checklist](#pre-deploy-checklist)
- [Vercel (Recomendado)](#vercel-recomendado)
- [Docker](#docker)
- [Railway](#railway)
- [AWS](#aws)
- [Variables de Entorno](#variables-de-entorno)
- [Database Setup](#database-setup)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

---

## Pre-Deploy Checklist

Antes de desplegar a producción, asegúrate de:

- [ ] **Tests pasando**: Todos los tests unitarios e integración
- [ ] **Build exitoso**: `npm run build` sin errores
- [ ] **Environment variables**: Configuradas en el servicio de hosting
- [ ] **Database**: PostgreSQL configurado (no usar SQLite en producción)
- [ ] **API Keys**: OpenAI API key válida
- [ ] **Backup**: Backup de la base de datos actual
- [ ] **Prisma**: `npx prisma generate` ejecutado
- [ ] **Migraciones**: Todas las migraciones aplicadas
- [ ] **Documentation**: README y docs actualizados
- [ ] **Security**: Variables sensibles NO committeadas

---

## Vercel (Recomendado)

Vercel es la plataforma recomendada para desplegar apps Next.js.

### Ventajas
- ✅ Deploy automático desde Git
- ✅ Edge network global
- ✅ Serverless functions incluidas
- ✅ SSL/HTTPS automático
- ✅ Preview deployments
- ✅ Analytics incluido
- ✅ Zero config para Next.js

### Paso a Paso

#### 1. Preparación Local

```bash
# Verificar que el build funciona
npm run build

# Verificar variables de entorno
cp .env.example .env.production

# Verificar Prisma
npx prisma generate
```

#### 2. Install Vercel CLI (Opcional)

```bash
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

#### 3. Deploy via GitHub (Recomendado)

**A. Push a GitHub:**
```bash
git remote add origin https://github.com/tu-usuario/andi-pre.git
git branch -M main
git push -u origin main
```

**B. Conectar en Vercel:**
1. Ve a https://vercel.com
2. Click "Add New Project"
3. Selecciona tu repositorio
4. Configuración detectada automáticamente
5. Click "Deploy"

#### 4. Configurar Variables de Entorno

En Vercel Dashboard → Settings → Environment Variables:

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# OpenAI
OPENAI_API_KEY=sk-proj-...

# Next.js
NODE_ENV=production
```

**Importante:** Marca como "Production", "Preview" y "Development" según necesites.

#### 5. Configurar Database

**Opción A: Neon (Recomendado)**

1. Crear cuenta en https://neon.tech
2. Crear proyecto "andi-dashboard"
3. Copiar connection string
4. Agregar a Vercel env vars:
   ```
   DATABASE_URL=postgresql://user:pass@host.neon.tech/andi_dashboard?sslmode=require
   ```

**Opción B: Supabase**

1. Crear proyecto en https://supabase.com
2. Ir a Settings → Database
3. Copiar connection string (Transaction pooling)
4. Agregar a Vercel

**Opción C: Vercel Postgres**

```bash
# Instalar en tu proyecto
vercel postgres create

# Conectar
vercel link
```

#### 6. Aplicar Migraciones

```bash
# Opción A: Desde local (con DATABASE_URL de producción)
DATABASE_URL="postgresql://..." npx prisma migrate deploy

# Opción B: Script de deploy en package.json
```

Agregar a `package.json`:
```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "vercel-build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

#### 7. Verificar Deploy

```bash
# URL de producción
https://tu-proyecto.vercel.app

# Verificar endpoints
curl https://tu-proyecto.vercel.app/api/publicaciones?limit=5
curl https://tu-proyecto.vercel.app/api/docs
```

### Configuración Avanzada

#### `vercel.json`

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "DATABASE_URL": "@database_url"
  },
  "build": {
    "env": {
      "ENABLE_EXPERIMENTAL_COREPACK": "1"
    }
  }
}
```

#### Configurar Dominios

1. Vercel Dashboard → Settings → Domains
2. Agregar dominio custom: `analytics.tudominio.com`
3. Configurar DNS en tu proveedor:
   ```
   CNAME analytics cname.vercel-dns.com
   ```

#### Preview Deployments

Cada push a una branch crea un preview:
```bash
git checkout -b feature/nueva-funcionalidad
git push origin feature/nueva-funcionalidad

# Vercel automáticamente deploya en:
# https://andi-pre-git-feature-nueva-funcionalidad.vercel.app
```

---

## Docker

Para deployment custom o on-premise.

### Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/andi_dashboard
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - NODE_ENV=production
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=andi_dashboard
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

volumes:
  postgres_data:
```

### Comandos

```bash
# Build
docker-compose build

# Run
docker-compose up -d

# Logs
docker-compose logs -f app

# Apply migrations
docker-compose exec app npx prisma migrate deploy

# Stop
docker-compose down
```

### next.config.js para Docker

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    largePageDataBytes: 128 * 100000,
  },
}

module.exports = nextConfig
```

---

## Railway

Alternativa simple a Vercel con PostgreSQL incluido.

### Deploy

1. **Crear cuenta en https://railway.app**

2. **New Project → Deploy from GitHub**
   - Conecta tu repositorio
   - Railway detecta Next.js automáticamente

3. **Agregar PostgreSQL**
   - Click "New" → Database → PostgreSQL
   - Railway crea `DATABASE_URL` automáticamente

4. **Variables de Entorno**
   ```
   OPENAI_API_KEY=sk-proj-...
   NODE_ENV=production
   ```

5. **Build Command**
   Settings → Build Command:
   ```bash
   npm run build
   ```

6. **Start Command**
   Settings → Start Command:
   ```bash
   npm start
   ```

7. **Deploy**
   - Push a main
   - Railway deploya automáticamente

### Aplicar Migraciones

Opción A: Desde CLI local
```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# Run migrations
railway run npx prisma migrate deploy
```

Opción B: Agregar a build
```json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

---

## AWS

Para deployment empresarial con control total.

### Arquitectura

```
┌────────────────────────────────────────────┐
│           CloudFront (CDN)                 │
└────────────────┬───────────────────────────┘
                 │
┌────────────────▼───────────────────────────┐
│         Application Load Balancer          │
└────────────────┬───────────────────────────┘
                 │
       ┌─────────┴─────────┐
       ▼                   ▼
┌──────────────┐    ┌──────────────┐
│   ECS Task 1 │    │   ECS Task 2 │
│  (Container) │    │  (Container) │
└──────┬───────┘    └──────┬───────┘
       │                   │
       └────────┬──────────┘
                ▼
┌────────────────────────────────────────────┐
│         RDS PostgreSQL (Multi-AZ)          │
└────────────────────────────────────────────┘
```

### Servicios AWS

- **ECS/Fargate**: Container hosting
- **RDS**: PostgreSQL managed
- **S3**: Static assets (opcional)
- **CloudFront**: CDN
- **Route 53**: DNS
- **Secrets Manager**: API keys
- **CloudWatch**: Logs y monitoring

### Setup Paso a Paso

#### 1. RDS PostgreSQL

```bash
# Via AWS Console
Region: us-east-1
Engine: PostgreSQL 14
Instance: db.t3.micro (dev) / db.t3.medium (prod)
Multi-AZ: Yes (prod)
Storage: 20 GB SSD
Backup: 7 days retention

# Security Group
Inbound: PostgreSQL (5432) from ECS security group
```

#### 2. ECR (Container Registry)

```bash
# Crear repositorio
aws ecr create-repository --repository-name andi-dashboard

# Login
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build
docker build -t andi-dashboard .

# Tag
docker tag andi-dashboard:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/andi-dashboard:latest

# Push
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/andi-dashboard:latest
```

#### 3. ECS Fargate

**Task Definition:**
```json
{
  "family": "andi-dashboard",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "app",
      "image": "YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/andi-dashboard:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:DATABASE_URL"
        },
        {
          "name": "OPENAI_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:OPENAI_API_KEY"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/andi-dashboard",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

**Service:**
```bash
aws ecs create-service \
  --cluster andi-cluster \
  --service-name andi-dashboard-service \
  --task-definition andi-dashboard \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=app,containerPort=3000"
```

#### 4. Application Load Balancer

```bash
# Target Group
Protocol: HTTP
Port: 3000
Health Check: /api/docs
Interval: 30s
Timeout: 5s

# Listener
Protocol: HTTPS
Port: 443
SSL Certificate: ACM certificate
```

#### 5. CloudFront

```bash
Origin: ALB DNS
Cache Behavior:
  - GET, HEAD allowed
  - Cache TTL: 3600s for static assets
  - No cache for /api/*
```

### CI/CD con GitHub Actions

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS ECS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build and push
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: andi-dashboard
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster andi-cluster \
            --service andi-dashboard-service \
            --force-new-deployment
```

---

## Variables de Entorno

### Desarrollo

```bash
# .env.local
DATABASE_URL="file:./prisma/dev.db"
OPENAI_API_KEY="sk-proj-..."
NODE_ENV="development"
```

### Producción

```bash
# Vercel / Railway / etc.
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
OPENAI_API_KEY="sk-proj-..."
NODE_ENV="production"

# Opcional
NEXT_PUBLIC_APP_NAME="Analytics Dashboard"
NEXT_PUBLIC_API_URL="https://api.tudominio.com"
```

### Gestión Segura

**Never commit:**
```bash
# .gitignore
.env
.env.local
.env.production
```

**Vercel:**
- Dashboard → Settings → Environment Variables
- CLI: `vercel env add`

**AWS:**
- Secrets Manager
- Parameter Store

**Docker:**
- `.env` file
- docker-compose environment
- Docker secrets

---

## Database Setup

### Neon (Serverless PostgreSQL)

```bash
# 1. Crear cuenta: https://neon.tech
# 2. Crear proyecto
# 3. Copiar connection string

CONNECTION_STRING="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/main?sslmode=require"

# 4. Aplicar migraciones
DATABASE_URL=$CONNECTION_STRING npx prisma migrate deploy

# 5. Verificar
DATABASE_URL=$CONNECTION_STRING npx prisma studio
```

**Features:**
- Branching (DB por branch de Git)
- Autoscaling
- Scale to zero (no costo cuando no se usa)
- Free tier: 0.5GB storage

### Supabase

```bash
# 1. Crear proyecto: https://supabase.com
# 2. Settings → Database
# 3. Copiar "Transaction" connection string

CONNECTION_STRING="postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres"

# 4. Aplicar migraciones
DATABASE_URL=$CONNECTION_STRING npx prisma migrate deploy
```

**Features:**
- PostgreSQL 15
- Row Level Security
- Realtime subscriptions
- Storage incluido
- Free tier: 500MB storage

### Render

```bash
# 1. Crear PostgreSQL en https://render.com
# 2. Copiar Internal/External connection string

# Internal (desde app en Render)
postgresql://user:pass@internal-host/db

# External (desde local)
postgresql://user:pass@external-host/db

# 3. Aplicar migraciones
```

---

## Monitoring

### Vercel Analytics

**Auto-incluido:**
- Web Vitals (LCP, FID, CLS)
- Page views
- Geographic distribution
- Device types

**Acceso:** Vercel Dashboard → Analytics

### Custom Logging

```typescript
// lib/logger.ts
export function logAPIRequest(req: Request, duration: number) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    duration: `${duration}ms`,
    userAgent: req.headers.get('user-agent'),
  }))
}

// En API routes
const start = Date.now()
// ... handle request
logAPIRequest(request, Date.now() - start)
```

### Error Tracking

**Opción A: Sentry**

```bash
npm install @sentry/nextjs

# Configurar
npx @sentry/wizard@latest -i nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
})
```

**Opción B: LogRocket**
**Opción C: Datadog**

### Health Checks

```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    // Check DB connection
    await prisma.$queryRaw`SELECT 1`
    
    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'up',
        api: 'up',
      },
    })
  } catch (error) {
    return Response.json({
      status: 'unhealthy',
      error: error.message,
    }, { status: 500 })
  }
}
```

**Uptime Monitoring:**
- Pingdom
- UptimeRobot
- Better Uptime

---

## Troubleshooting

### Build Failures

**Error: Prisma Client not generated**
```bash
# Solución: Agregar a build command
"build": "prisma generate && next build"
```

**Error: Module not found**
```bash
# Verificar package.json
npm install
npm run build

# Limpiar cache
rm -rf .next node_modules
npm install
```

### Runtime Errors

**Error: Database connection failed**
```bash
# Verificar DATABASE_URL
echo $DATABASE_URL

# Test connection
npx prisma studio

# Verificar SSL mode
DATABASE_URL="postgresql://...?sslmode=require"
```

**Error: API timeout**
```bash
# Vercel: Max 10s para Hobby, 60s para Pro
# Si categorizas >10 registros, implementar queue

# Solución temporal: Reducir batchSize
{
  "batchSize": 5,
  "delayMs": 1500
}
```

### Performance Issues

**Slow queries:**
```typescript
// Enable query logging
prisma.$on('query', (e) => {
  if (e.duration > 1000) {
    console.warn('Slow query:', e)
  }
})

// Optimize with indexes
// Implement Redis caching
```

**High memory usage:**
```bash
# Vercel: 1GB RAM en Hobby, 3GB en Pro
# Reducir limit en queries
# Implementar pagination
```

---

## Rollback

### Vercel

```bash
# Via Dashboard
Deployments → Click en deployment anterior → Promote to Production

# Via CLI
vercel rollback
```

### Railway

```bash
# Redeploy commit anterior
git revert HEAD
git push origin main
```

### AWS ECS

```bash
# Redeploy task definition anterior
aws ecs update-service \
  --cluster andi-cluster \
  --service andi-dashboard-service \
  --task-definition andi-dashboard:5  # versión anterior
```

---

## Costos Estimados

### Vercel

| Plan | Precio | Specs |
|------|--------|-------|
| Hobby | Free | 100GB bandwidth, 1000 build mins |
| Pro | $20/mes | 1TB bandwidth, ilimitado build |

### Neon

| Plan | Precio | Specs |
|------|--------|-------|
| Free | $0 | 0.5GB storage, 3 branches |
| Pro | $19/mes | 10GB storage, ilimitado branches |

### Railway

| Plan | Precio | Specs |
|------|--------|-------|
| Developer | $5/mes (credit) | Pay-as-you-go |

### AWS (Estimado)

- ECS Fargate: ~$30/mes (2 tasks)
- RDS t3.micro: ~$15/mes
- ALB: ~$20/mes
- CloudFront: ~$5/mes
- **Total: ~$70/mes**

---

**Última actualización:** Octubre 2025  
**Plataforma recomendada:** Vercel + Neon (simplicidad) o AWS ECS (control total)

Para soporte, consultar documentación oficial de cada plataforma o abrir un issue en GitHub.

