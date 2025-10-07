# 💾 Database Documentation

## Índice
- [Overview](#overview)
- [Schema](#schema)
- [Migraciones](#migraciones)
- [Queries Comunes](#queries-comunes)
- [Optimización](#optimización)
- [Backup & Restore](#backup--restore)
- [Migración a PostgreSQL](#migración-a-postgresql)

---

## Overview

### Tecnología

**Desarrollo:**
- **Database**: SQLite 3
- **ORM**: Prisma 6.14
- **Location**: `prisma/dev.db`

**Producción (Recomendado):**
- **Database**: PostgreSQL 14+
- **ORM**: Prisma 6.14
- **Hosting**: Neon, Supabase, Render, o AWS RDS

### Ventajas y Limitaciones

#### SQLite (Development)

**✅ Ventajas:**
- Zero configuration
- Archivo local simple (`dev.db`)
- Perfecto para prototipos
- Portátil (copiar/compartir DB)
- ACID compliant

**❌ Limitaciones:**
- Concurrencia limitada (1 writer a la vez)
- No soporta algunos tipos avanzados (JSON queries limitadas)
- Max DB size: ~281 TB (en práctica, <10 GB recomendado)
- No escalable horizontalmente

#### PostgreSQL (Production)

**✅ Ventajas:**
- Alta concurrencia (múltiples writers)
- JSON/JSONB support completo
- Full-text search
- Replicación y high availability
- Partitioning
- Escalable horizontalmente

**⚠️ Consideraciones:**
- Requiere servidor dedicado o managed service
- Más complejo de configurar localmente

---

## Schema

### Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Publicacion                          │
├─────────────────────────────────────────────────────────────┤
│ id               STRING      PK                             │
│ fecha            DATETIME                                    │
│ red              STRING      INDEX                          │
│ perfil           STRING      INDEX                          │
│ categoria        STRING      INDEX                          │
│ tipoPublicacion  STRING      INDEX                          │
│ publicar         STRING?     (contenido)                    │
│ impresiones      INT                                        │
│ alcance          INT                                        │
│ meGusta          INT                                        │
│ comentarios      INT                                        │
│ compartidos      INT                                        │
│ guardados        INT                                        │
│ csvSessionId     STRING?     FK → CsvSession.id             │
│ createdAt        DATETIME                                    │
│ updatedAt        DATETIME                                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ 1:N
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        CsvSession                           │
├─────────────────────────────────────────────────────────────┤
│ id                   STRING      PK (CUID)                  │
│ fileName             STRING                                 │
│ uploadedAt           DATETIME                               │
│ status               STRING      (completed/partial/error)  │
│ totalRows            INT                                    │
│ insertedRows         INT                                    │
│ updatedRows          INT                                    │
│ errorRows            INT                                    │
│ duplicateRows        INT                                    │
│ excludedHistorias    INT                                    │
│ detectedColumns      STRING?     (JSON array)               │
│ errorDetails         STRING?     (JSON)                     │
└─────────────────────────────────────────────────────────────┘
```

### Prisma Schema (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Publicacion {
  id              String   @id
  fecha           DateTime
  red             String
  perfil          String
  categoria       String
  tipoPublicacion String   @default("Publicar") @map("tipo_publicacion")
  publicar        String?  @map("publicar")
  impresiones     Int      @default(0)
  alcance         Int      @default(0)
  meGusta         Int      @default(0) @map("me_gusta")
  comentarios     Int      @default(0)
  compartidos     Int      @default(0)
  guardados       Int      @default(0)
  
  csvSessionId    String?  @map("csv_session_id")
  csvSession      CsvSession? @relation(fields: [csvSessionId], references: [id])
  
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  
  @@index([red])
  @@index([perfil])
  @@index([categoria])
  @@index([tipoPublicacion])
  @@index([fecha])
  @@index([csvSessionId])
  @@map("publicaciones")
}

model CsvSession {
  id                String        @id @default(cuid())
  fileName          String        @map("file_name")
  uploadedAt        DateTime      @default(now()) @map("uploaded_at")
  status            String        @default("completed")
  totalRows         Int           @default(0) @map("total_rows")
  insertedRows      Int           @default(0) @map("inserted_rows")
  updatedRows       Int           @default(0) @map("updated_rows")
  errorRows         Int           @default(0) @map("error_rows")
  duplicateRows     Int           @default(0) @map("duplicate_rows")
  excludedHistorias Int           @default(0) @map("excluded_historias")
  detectedColumns   String?       @map("detected_columns")
  errorDetails      String?       @map("error_details")
  
  publicaciones     Publicacion[]
  
  @@map("csv_sessions")
}
```

### Índices

Los índices están diseñados para optimizar las queries más comunes:

```sql
-- Búsqueda por red social
CREATE INDEX "Publicacion_red_idx" ON "publicaciones"("red");

-- Búsqueda por perfil
CREATE INDEX "Publicacion_perfil_idx" ON "publicaciones"("perfil");

-- Filtrado por categoría
CREATE INDEX "Publicacion_categoria_idx" ON "publicaciones"("categoria");

-- Filtrado por tipo de publicación
CREATE INDEX "Publicacion_tipoPublicacion_idx" ON "publicaciones"("tipo_publicacion");

-- Filtrado por rango de fechas (muy común)
CREATE INDEX "Publicacion_fecha_idx" ON "publicaciones"("fecha");

-- Join con CsvSession
CREATE INDEX "Publicacion_csvSessionId_idx" ON "publicaciones"("csv_session_id");
```

**Índices Compuestos (Futuro):**
```sql
-- Para dashboard principal
CREATE INDEX "idx_red_fecha" ON "publicaciones"("red", "fecha");

-- Para mosaico
CREATE INDEX "idx_perfil_categoria" ON "publicaciones"("perfil", "categoria");

-- Para análisis temporal
CREATE INDEX "idx_fecha_categoria" ON "publicaciones"("fecha", "categoria");
```

---

## Migraciones

### Historia de Migraciones

#### 1. `20250820042157_init`
**Fecha:** 20 de Agosto, 2025

**Cambios:**
- Creación de tabla `publicaciones`
- Campos básicos: id, fecha, red, perfil, categoria, métricas
- Índices básicos

```sql
CREATE TABLE "publicaciones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fecha" DATETIME NOT NULL,
    "red" TEXT NOT NULL,
    "perfil" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "impresiones" INTEGER NOT NULL DEFAULT 0,
    "alcance" INTEGER NOT NULL DEFAULT 0,
    "me_gusta" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

CREATE INDEX "Publicacion_red_idx" ON "publicaciones"("red");
CREATE INDEX "Publicacion_perfil_idx" ON "publicaciones"("perfil");
CREATE INDEX "Publicacion_categoria_idx" ON "publicaciones"("categoria");
```

#### 2. `20250915094009_add_tipo_publicacion`
**Fecha:** 15 de Septiembre, 2025

**Cambios:**
- Agregada columna `tipo_publicacion`
- Índice en `tipo_publicacion`
- Agregados campos: comentarios, compartidos, guardados

```sql
ALTER TABLE "publicaciones" ADD COLUMN "tipo_publicacion" TEXT NOT NULL DEFAULT 'Publicar';
ALTER TABLE "publicaciones" ADD COLUMN "comentarios" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "publicaciones" ADD COLUMN "compartidos" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "publicaciones" ADD COLUMN "guardados" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "Publicacion_tipoPublicacion_idx" ON "publicaciones"("tipo_publicacion");
```

#### 3. `20251006001019_add_csv_sessions`
**Fecha:** 6 de Octubre, 2025

**Cambios:**
- Creación de tabla `csv_sessions`
- Agregada columna `csv_session_id` a `publicaciones`
- Relación FK entre tablas
- Tracking completo de uploads

```sql
CREATE TABLE "csv_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "file_name" TEXT NOT NULL,
    "uploaded_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "total_rows" INTEGER NOT NULL DEFAULT 0,
    "inserted_rows" INTEGER NOT NULL DEFAULT 0,
    "updated_rows" INTEGER NOT NULL DEFAULT 0,
    "error_rows" INTEGER NOT NULL DEFAULT 0,
    "duplicate_rows" INTEGER NOT NULL DEFAULT 0,
    "excluded_historias" INTEGER NOT NULL DEFAULT 0,
    "detected_columns" TEXT,
    "error_details" TEXT
);

ALTER TABLE "publicaciones" ADD COLUMN "csv_session_id" TEXT;
ALTER TABLE "publicaciones" ADD COLUMN "publicar" TEXT;

CREATE INDEX "Publicacion_csvSessionId_idx" ON "publicaciones"("csv_session_id");
```

### Comandos de Migración

#### Crear Nueva Migración

```bash
# Modificar schema.prisma primero, luego:
npx prisma migrate dev --name descripcion_del_cambio
```

**Ejemplo:**
```bash
npx prisma migrate dev --name add_engagement_rate
```

#### Aplicar Migraciones (Producción)

```bash
npx prisma migrate deploy
```

#### Ver Estado de Migraciones

```bash
npx prisma migrate status
```

#### Rollback (No soportado nativamente)

Prisma no tiene rollback automático. Para revertir:

```bash
# 1. Crear migración inversa manualmente
npx prisma migrate dev --name revert_engagement_rate --create-only

# 2. Editar el archivo SQL generado con comandos inversos
# Por ejemplo, si agregaste una columna:
ALTER TABLE "publicaciones" DROP COLUMN "engagement_rate";

# 3. Aplicar
npx prisma migrate dev
```

#### Reset Completo (¡Cuidado!)

```bash
# Elimina TODA la data y re-aplica migraciones
npx prisma migrate reset
```

### Regenerar Cliente Prisma

Después de cambios en el schema:

```bash
npx prisma generate
```

---

## Queries Comunes

### Via Prisma (Recomendado)

#### 1. Obtener publicaciones con filtros

```typescript
const publicaciones = await prisma.publicacion.findMany({
  where: {
    red: 'Instagram',
    perfil: 'alcaldiadecali',
    fecha: {
      gte: new Date('2025-10-01'),
      lte: new Date('2025-10-31'),
    },
  },
  orderBy: {
    fecha: 'desc',
  },
  take: 100,
  skip: 0,
})
```

#### 2. Contar publicaciones por categoría

```typescript
const counts = await prisma.publicacion.groupBy({
  by: ['categoria'],
  _count: {
    id: true,
  },
  _sum: {
    impresiones: true,
  },
})
```

#### 3. Obtener perfiles con más publicaciones

```typescript
const topPerfiles = await prisma.publicacion.groupBy({
  by: ['perfil'],
  _count: {
    id: true,
  },
  orderBy: {
    _count: {
      id: 'desc',
    },
  },
  take: 10,
})
```

#### 4. Estadísticas globales

```typescript
const stats = await prisma.publicacion.aggregate({
  _count: { id: true },
  _sum: {
    impresiones: true,
    alcance: true,
    meGusta: true,
  },
  _avg: {
    impresiones: true,
  },
})
```

#### 5. Buscar publicaciones pendientes

```typescript
const pendientes = await prisma.publicacion.findMany({
  where: {
    categoria: 'Pendiente',
    publicar: {
      not: null,
    },
  },
  take: 10,
})
```

#### 6. Obtener sesiones CSV con publicaciones

```typescript
const session = await prisma.csvSession.findUnique({
  where: { id: sessionId },
  include: {
    publicaciones: {
      take: 100,
    },
  },
})
```

### Via SQL Directo

Para debugging o queries complejas:

```bash
# Abrir SQLite CLI
sqlite3 prisma/dev.db

# O usar Prisma Studio
npx prisma studio
```

#### Queries SQL útiles

```sql
-- Top 10 publicaciones por impresiones
SELECT perfil, impresiones, fecha, categoria
FROM publicaciones
ORDER BY impresiones DESC
LIMIT 10;

-- Distribución de publicaciones por red y categoría
SELECT red, categoria, COUNT(*) as count
FROM publicaciones
GROUP BY red, categoria;

-- Engagement rate promedio por perfil
SELECT 
  perfil,
  AVG((me_gusta + comentarios + compartidos) * 1.0 / NULLIF(alcance, 0)) as engagement_rate
FROM publicaciones
WHERE alcance > 0
GROUP BY perfil
ORDER BY engagement_rate DESC;

-- Publicaciones por mes
SELECT 
  strftime('%Y-%m', fecha) as mes,
  COUNT(*) as total,
  SUM(impresiones) as total_impresiones
FROM publicaciones
GROUP BY mes
ORDER BY mes DESC;

-- Detectar duplicados potenciales
SELECT id, COUNT(*) as count
FROM publicaciones
GROUP BY id
HAVING count > 1;

-- Tamaño de la base de datos
SELECT page_count * page_size as size_bytes
FROM pragma_page_count(), pragma_page_size();
```

---

## Optimización

### Análisis de Performance

#### 1. Explain Query Plan (SQLite)

```sql
EXPLAIN QUERY PLAN
SELECT * FROM publicaciones
WHERE red = 'Instagram' AND fecha > '2025-10-01'
ORDER BY impresiones DESC
LIMIT 100;
```

**Resultado esperado:**
```
SEARCH TABLE publicaciones USING INDEX Publicacion_red_idx (red=?)
USE TEMP B-TREE FOR ORDER BY
```

#### 2. Identificar Queries Lentas (Prisma)

```typescript
prisma.$on('query', (e) => {
  if (e.duration > 1000) { // > 1 segundo
    console.warn('Slow query detected:', {
      query: e.query,
      duration: `${e.duration}ms`,
      params: e.params,
    })
  }
})
```

### Mejores Prácticas

#### 1. Usar Select Específico

```typescript
// ❌ Malo: Trae todas las columnas
const pubs = await prisma.publicacion.findMany()

// ✅ Bueno: Solo columnas necesarias
const pubs = await prisma.publicacion.findMany({
  select: {
    id: true,
    perfil: true,
    impresiones: true,
  },
})
```

#### 2. Batch Queries

```typescript
// ❌ Malo: N+1 query problem
for (const perfil of perfiles) {
  const count = await prisma.publicacion.count({ where: { perfil } })
}

// ✅ Bueno: Una sola query
const counts = await prisma.publicacion.groupBy({
  by: ['perfil'],
  _count: { id: true },
})
```

#### 3. Usar Transactions para Writes Múltiples

```typescript
// Garantiza atomicidad
await prisma.$transaction([
  prisma.publicacion.create({ data: pub1 }),
  prisma.publicacion.create({ data: pub2 }),
  prisma.csvSession.create({ data: session }),
])
```

#### 4. Pagination Eficiente

```typescript
// Para tablas grandes, usa cursor-based pagination
const publicaciones = await prisma.publicacion.findMany({
  take: 100,
  skip: 1, // Solo para la primera página
  cursor: lastId ? { id: lastId } : undefined,
  orderBy: { fecha: 'desc' },
})
```

### Vacuum y Maintenance (SQLite)

```bash
# Reducir tamaño de archivo después de deletes
sqlite3 prisma/dev.db "VACUUM;"

# Analizar tabla para optimizar queries
sqlite3 prisma/dev.db "ANALYZE publicaciones;"

# Ver estadísticas de índices
sqlite3 prisma/dev.db "SELECT * FROM sqlite_stat1;"
```

---

## Backup & Restore

### SQLite

#### Backup Manual

```bash
# Backup simple (copia del archivo)
cp prisma/dev.db prisma/backup_$(date +%Y%m%d_%H%M%S).db

# Backup con compresión
tar -czf backup_$(date +%Y%m%d).tar.gz prisma/dev.db

# Backup SQL dump
sqlite3 prisma/dev.db .dump > backup_$(date +%Y%m%d).sql
```

#### Restore

```bash
# Desde archivo
cp prisma/backup_20251007_120000.db prisma/dev.db

# Desde SQL dump
sqlite3 prisma/dev.db < backup_20251007.sql
```

#### Script Automático

```bash
#!/bin/bash
# backup-db.sh

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_FILE="prisma/dev.db"

mkdir -p $BACKUP_DIR

# Backup with rotation (keep last 7 days)
cp $DB_FILE $BACKUP_DIR/db_$DATE.db
find $BACKUP_DIR -name "db_*.db" -mtime +7 -delete

echo "✅ Backup created: $BACKUP_DIR/db_$DATE.db"
```

**Agregar a crontab:**
```bash
# Backup diario a las 2 AM
0 2 * * * /path/to/backup-db.sh
```

### PostgreSQL (Producción)

#### Backup

```bash
# Backup completo
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Backup comprimido
pg_dump $DATABASE_URL | gzip > backup_$(date +%Y%m%d).sql.gz

# Backup de solo datos (sin schema)
pg_dump --data-only $DATABASE_URL > data_backup_$(date +%Y%m%d).sql
```

#### Restore

```bash
# Restore completo
psql $DATABASE_URL < backup_20251007.sql

# Restore desde comprimido
gunzip -c backup_20251007.sql.gz | psql $DATABASE_URL
```

#### Automated Backups (Managed Services)

La mayoría de servicios managed tienen backups automáticos:

- **Neon**: Backups automáticos cada 24h, retención 7 días
- **Supabase**: Point-in-time recovery, retención configurable
- **Render**: Backups diarios automáticos

---

## Migración a PostgreSQL

### Paso a Paso

#### 1. Setup PostgreSQL

```bash
# Opción A: Neon (Recomendado - Serverless)
# 1. Crear cuenta en https://neon.tech
# 2. Crear proyecto
# 3. Copiar connection string

# Opción B: Local (para testing)
# macOS
brew install postgresql
brew services start postgresql
createdb andi_dashboard

# Opción C: Docker
docker run -d \
  --name andi-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=andi_dashboard \
  -p 5432:5432 \
  postgres:14
```

#### 2. Actualizar `.env`

```bash
# Comentar SQLite
# DATABASE_URL="file:./prisma/dev.db"

# Agregar PostgreSQL
DATABASE_URL="postgresql://user:password@host:5432/andi_dashboard"
```

#### 3. Actualizar `schema.prisma`

```prisma
datasource db {
  provider = "postgresql"  // Cambiar de "sqlite"
  url      = env("DATABASE_URL")
}
```

#### 4. Crear Migraciones

```bash
# Genera migraciones para PostgreSQL
npx prisma migrate dev --name init_postgresql

# O aplicar directamente (sin migración)
npx prisma db push
```

#### 5. Migrar Datos de SQLite a PostgreSQL

**Script de Migración:**

```typescript
// migrate-to-postgres.ts
import { PrismaClient as SQLiteClient } from './prisma-sqlite'
import { PrismaClient as PostgresClient } from '@prisma/client'

const sqlite = new SQLiteClient({
  datasources: { db: { url: 'file:./prisma/dev.db' } }
})

const postgres = new PostgresClient()

async function migrate() {
  console.log('🚀 Starting migration...')
  
  // Migrar publicaciones
  const publicaciones = await sqlite.publicacion.findMany()
  console.log(`📊 Found ${publicaciones.length} publicaciones`)
  
  for (const pub of publicaciones) {
    await postgres.publicacion.create({
      data: {
        id: pub.id,
        fecha: pub.fecha,
        red: pub.red,
        perfil: pub.perfil,
        categoria: pub.categoria,
        tipoPublicacion: pub.tipoPublicacion,
        publicar: pub.publicar,
        impresiones: pub.impresiones,
        alcance: pub.alcance,
        meGusta: pub.meGusta,
        comentarios: pub.comentarios,
        compartidos: pub.compartidos,
        guardados: pub.guardados,
        createdAt: pub.createdAt,
        updatedAt: pub.updatedAt,
      },
    })
    
    if (publicaciones.indexOf(pub) % 100 === 0) {
      console.log(`Progress: ${publicaciones.indexOf(pub)}/${publicaciones.length}`)
    }
  }
  
  // Migrar CSV sessions
  const sessions = await sqlite.csvSession.findMany()
  console.log(`📁 Found ${sessions.length} CSV sessions`)
  
  for (const session of sessions) {
    await postgres.csvSession.create({
      data: session,
    })
  }
  
  console.log('✅ Migration completed!')
  
  await sqlite.$disconnect()
  await postgres.$disconnect()
}

migrate().catch(console.error)
```

**Ejecutar:**
```bash
npx ts-node migrate-to-postgres.ts
```

#### 6. Verificar Migración

```typescript
// verify-migration.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verify() {
  const totalPublicaciones = await prisma.publicacion.count()
  const totalSessions = await prisma.csvSession.count()
  
  console.log(`📊 Total publicaciones: ${totalPublicaciones}`)
  console.log(`📁 Total CSV sessions: ${totalSessions}`)
  
  const sample = await prisma.publicacion.findFirst()
  console.log('Sample record:', sample)
  
  await prisma.$disconnect()
}

verify().catch(console.error)
```

### Diferencias SQLite vs PostgreSQL

| Feature | SQLite | PostgreSQL |
|---------|--------|------------|
| **Tipos de Datos** | Limitados (TEXT, INTEGER, REAL, BLOB) | Ricos (UUID, JSONB, Arrays, etc.) |
| **Case Sensitivity** | Case-insensitive por default | Case-sensitive |
| **Boolean Type** | No nativo (usa INTEGER) | Nativo (TRUE/FALSE) |
| **JSON** | Soporte básico | JSONB con índices y queries avanzados |
| **Full-Text Search** | FTS5 extension | Built-in, muy potente |
| **Concurrency** | Lock de tabla | MVCC (múltiples writers) |

**Ajustes en código:**

```typescript
// SQLite: Case-insensitive
where: { perfil: 'AlcaldiaDeCali' }  // Encuentra "alcaldiadecali"

// PostgreSQL: Case-sensitive
where: { perfil: { equals: 'alcaldiadecali', mode: 'insensitive' } }
```

---

## Troubleshooting

### Problema: "Database locked"

**Causa:** SQLite no permite múltiples writers.

**Solución:**
```bash
# Cerrar todas las conexiones
pkill -9 node

# O aumentar timeout
datasource db {
  provider = "sqlite"
  url      = "file:./prisma/dev.db?connection_limit=1&timeout=30"
}
```

### Problema: Prisma Client desactualizado

**Síntoma:** TypeScript errors sobre tipos Prisma.

**Solución:**
```bash
npx prisma generate
```

### Problema: Migraciones fuera de sync

**Síntoma:** "Migration ... is not applied"

**Solución:**
```bash
npx prisma migrate resolve --applied <migration_name>
```

### Problema: DB corrupta

**SQLite:**
```bash
# Verificar integridad
sqlite3 prisma/dev.db "PRAGMA integrity_check;"

# Si está corrupta, restaurar backup
cp prisma/backup_YYYYMMDD.db prisma/dev.db
```

---

**Última actualización:** Octubre 2025  
**Schema Version:** v1.0 (3 migraciones)  
**Próxima actualización planeada:** PostgreSQL migration (v2.0)

