# 🏗️ Arquitectura del Sistema

## Índice
- [Vista General](#vista-general)
- [Patrones de Diseño](#patrones-de-diseño)
- [Flujos de Datos](#flujos-de-datos)
- [Decisiones de Arquitectura](#decisiones-de-arquitectura)
- [Escalabilidad](#escalabilidad)

---

## Vista General

### Stack Tecnológico Completo

```
┌────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                       │
│                                                                │
│  Next.js 14 App Router + React 18 + TypeScript                │
│  • Client Components ('use client')                           │
│  • Server Components (RSC - default)                          │
│  • Streaming & Suspense                                       │
│                                                                │
│  UI Libraries:                                                │
│  • Recharts (charts)                                          │
│  • TradingView Lightweight Charts                            │
│  • Custom CSS (no framework CSS)                             │
└────────────────────────────────────────────────────────────────┘
                            ↓ HTTP/Fetch
┌────────────────────────────────────────────────────────────────┐
│                         API LAYER                              │
│                                                                │
│  Next.js API Routes (App Router)                              │
│  • Route Handlers (route.ts)                                 │
│  • RESTful conventions                                        │
│  • Zod validation on entry                                   │
│  • Error boundaries & handling                               │
│                                                                │
│  Utilities:                                                   │
│  • api-utils.ts (wrappers, CORS, logging)                    │
│  • schemas.ts (Zod schemas)                                  │
│  • swagger.ts (OpenAPI generation)                           │
└────────────────────────────────────────────────────────────────┘
                            ↓ ORM
┌────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                             │
│                                                                │
│  Prisma ORM 6.14                                              │
│  • Type-safe queries                                          │
│  • Migration system                                           │
│  • Generated client                                           │
│                                                                │
│  Database:                                                    │
│  • SQLite (dev) - file-based                                 │
│  • PostgreSQL (prod) - recommended                           │
│                                                                │
│  Models:                                                      │
│  • Publicacion (core data)                                   │
│  • CsvSession (upload tracking)                              │
└────────────────────────────────────────────────────────────────┘
                            ↓ External
┌────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                         │
│                                                                │
│  • OpenAI GPT-5 API (categorization)                          │
│  • (Future: Redis for caching)                               │
│  • (Future: S3/Storage for file uploads)                     │
└────────────────────────────────────────────────────────────────┘
```

---

## Patrones de Diseño

### 1. **API-First Architecture**

Todo el acceso a datos pasa por APIs, incluso el frontend interno.

**Ventajas:**
- Frontend desacoplado del backend
- Fácil crear múltiples clientes (web, mobile, CLI)
- Testing más simple
- Documentación automática con OpenAPI

**Implementación:**
```typescript
// ❌ MAL: Acceso directo a Prisma desde componentes
export default function Page() {
  const data = await prisma.publicacion.findMany()
  return <div>{data}</div>
}

// ✅ BIEN: Siempre usar APIs
export default function Page() {
  const { data } = usePublicaciones()
  return <div>{data}</div>
}
```

### 2. **Repository Pattern (implícito en Prisma)**

Prisma actúa como repositorio, abstrayendo el acceso a la base de datos.

```typescript
// lib/prisma.ts - Singleton pattern
import { PrismaClient } from '@/generated/prisma'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

### 3. **Custom Hooks Pattern**

Lógica reutilizable encapsulada en hooks personalizados.

```typescript
// hooks/usePublicaciones.ts
export function usePublicaciones(params) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  
  // Global cache (singleton-like)
  // Fetch logic
  // Error handling
  
  return { data, loading, error, refetch, fetchAllData }
}
```

**Beneficios:**
- Lógica reutilizable
- Separación de concerns
- Testing más fácil
- State management encapsulado

### 4. **Validator Pattern (Zod)**

Validación en la entrada de APIs para garantizar type safety.

```typescript
// lib/schemas.ts
export const PublicationQuerySchema = z.object({
  red: z.string().optional(),
  perfil: z.string().optional(),
  categoria: z.string().optional(),
  // ...
})

// api/publicaciones/route.ts
const validatedData = PublicationQuerySchema.parse(queryParams)
```

### 5. **Middleware Pattern**

Composición de funciones para agregar funcionalidad a APIs.

```typescript
// lib/api-utils.ts
export function withErrorHandling(handler) {
  return async (req) => {
    try {
      return await handler(req)
    } catch (error) {
      return handleError(error)
    }
  }
}

export function withCORS(handler) {
  return async (req) => {
    const res = await handler(req)
    res.headers.set('Access-Control-Allow-Origin', '*')
    return res
  }
}

// Uso:
export const GET = withCORS(withErrorHandling(handleGET))
```

### 6. **Facade Pattern (api-utils)**

Simplificar interfaces complejas con wrappers.

```typescript
// lib/api-utils.ts
export const ApiResponse = {
  success: (data, meta) => NextResponse.json({ success: true, data, meta }),
  error: (code, message) => NextResponse.json({ success: false, error: { code, message } }),
}
```

---

## Flujos de Datos

### Flujo 1: Carga y Visualización del Dashboard

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant NextJS
    participant API
    participant Prisma
    participant SQLite

    User->>Browser: Navega a /
    Browser->>NextJS: GET /
    NextJS->>Browser: HTML + Client JS
    Browser->>Browser: usePublicaciones hook
    Browser->>Browser: Check cache (5min TTL)
    
    alt Cache Hit
        Browser->>User: Render with cached data
    else Cache Miss
        Browser->>API: GET /api/publicaciones?limit=50000
        API->>Prisma: findMany({ take: 50000 })
        Prisma->>SQLite: SELECT * FROM publicaciones LIMIT 50000
        SQLite->>Prisma: Return rows
        Prisma->>API: Return typed objects
        API->>API: Transform to frontend format
        API->>Browser: JSON (3.6MB)
        Browser->>Browser: Cache data (5min)
        Browser->>Browser: Calculate aggregations
        Browser->>Browser: Apply filters
        Browser->>User: Render charts (Recharts)
    end
```

**Tiempo estimado:**
- Cache hit: 50-100ms
- Cache miss: 2-5 segundos

**Optimizaciones futuras:**
- Backend aggregation (reducir de 3.6MB a ~5KB)
- Redis caching (compartir entre usuarios)
- Streaming responses

### Flujo 2: Upload CSV con Procesamiento

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant API
    participant PapaParse
    participant Prisma
    participant SQLite

    User->>Browser: Selecciona CSV
    Browser->>Browser: Validate file (client-side)
    Browser->>API: POST /api/upload-csv (FormData)
    API->>API: Zod validation
    API->>PapaParse: Parse CSV
    PapaParse->>API: Return parsed rows
    
    API->>API: For each row:
    API->>API: - Validate data
    API->>API: - Normalize category
    API->>API: - Check if Historia (exclude)
    API->>API: - Detect duplicate by ID
    
    API->>Prisma: $transaction start
    Prisma->>SQLite: BEGIN TRANSACTION
    
    loop For each valid row
        API->>Prisma: upsert(publicacion)
        Prisma->>SQLite: INSERT OR UPDATE
    end
    
    API->>Prisma: create(CsvSession)
    Prisma->>SQLite: INSERT csv_session
    Prisma->>SQLite: COMMIT
    
    API->>Browser: JSON (stats + sessionId)
    Browser->>User: Show success message
```

**Tiempo estimado:**
- 1000 rows: 1-2 segundos
- 5000 rows: 5-10 segundos
- 10000 rows: 15-20 segundos

**Características:**
- Transaccional (all-or-nothing)
- Detección de duplicados
- Filtrado de Historias
- Tracking de sesión

### Flujo 3: Categorización con GPT-5

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant API
    participant Prisma
    participant OpenAI
    participant SQLite

    User->>Browser: Click "Procesar con GPT-5"
    Browser->>API: POST /api/categorize-pending
    API->>Prisma: findMany({ where: { categoria: 'Pendiente' }, take: batchSize })
    Prisma->>SQLite: SELECT * WHERE categoria='Pendiente' LIMIT 10
    SQLite->>Prisma: Return pending records
    
    loop For each record
        API->>API: Build prompt with profile + content
        API->>OpenAI: POST /v1/responses (GPT-5)
        OpenAI->>API: Return category
        API->>API: Parse response
        API->>Prisma: update({ id, categoria })
        Prisma->>SQLite: UPDATE publicaciones SET categoria=...
        API->>API: Delay (1000ms)
    end
    
    API->>Browser: JSON (stats)
    Browser->>User: Show results (9/10 successful)
```

**Tiempo estimado:**
- 10 registros: ~15 segundos
- 50 registros: ~60 segundos
- Rate limit: ~1 request/second

**Características:**
- Batch processing
- Configurable delay (avoid rate limits)
- Error resilience (continues on failure)
- Detailed statistics

---

## Decisiones de Arquitectura

### ADR-001: API-First sobre Direct DB Access

**Contexto:** Next.js permite acceso directo a Prisma desde Server Components.

**Decisión:** Usar siempre APIs, incluso para el frontend interno.

**Razones:**
1. **Separación de concerns**: Frontend no conoce la estructura de la DB
2. **Documentación automática**: OpenAPI/Swagger genera docs
3. **Validación centralizada**: Zod valida todos los inputs
4. **Testing más simple**: Endpoints testables independientemente
5. **Escalabilidad**: Fácil cambiar a microservicios

**Consecuencias:**
- ✅ Mejor arquitectura a largo plazo
- ✅ Documentación automática
- ❌ Ligero overhead en requests internos
- ❌ Más código boilerplate

### ADR-002: Client-Side Aggregation sobre Server-Side

**Contexto:** El mosaico del dashboard requiere cálculos complejos.

**Decisión:** Traer todos los datos al frontend y calcular ahí (temporal).

**Razones:**
1. **Desarrollo más rápido**: Lógica en un solo lugar
2. **Filtros instantáneos**: No esperar network en cada cambio
3. **Flexibilidad**: Fácil probar nuevos cálculos
4. **SQLite limitation**: No es ideal para agregaciones complejas

**Consecuencias:**
- ✅ UX fluida después de carga inicial
- ✅ Prototipado rápido
- ❌ Carga inicial lenta (3.6MB)
- ❌ No escala a 100K+ registros

**Plan de migración (v1.1):**
- Mover cálculos a backend
- Crear endpoint `/api/analytics/mosaico`
- Reducir payload de 3.6MB a ~5KB

### ADR-003: SQLite (Dev) + PostgreSQL (Prod)

**Contexto:** Necesitamos persistencia de datos.

**Decisión:** SQLite para desarrollo, PostgreSQL para producción.

**Razones:**
1. **SQLite en dev**:
   - Zero configuration
   - Archivo local simple
   - Perfecto para prototipado
2. **PostgreSQL en prod**:
   - Mejor concurrencia
   - JSON queries avanzadas
   - Escalabilidad horizontal
   - Managed services (Neon, Supabase)

**Consecuencias:**
- ✅ Setup rápido
- ✅ Producción robusta
- ⚠️ Diferencias menores en queries
- ⚠️ Testing en prod requiere PostgreSQL

### ADR-004: In-Memory Cache sobre Redis (v1.0)

**Contexto:** Datos se cargan frecuentemente.

**Decisión:** Caché JavaScript en memoria (5min TTL) en v1.0.

**Razones:**
1. **Simplicidad**: No requiere infraestructura externa
2. **Velocidad**: Acceso instantáneo
3. **Desarrollo**: Un componente menos que configurar

**Consecuencias:**
- ✅ Setup inmediato
- ✅ Latencia cero
- ❌ No compartido entre usuarios
- ❌ Se pierde al refrescar página

**Plan futuro (v1.2):**
- Implementar Redis
- TTL: 5min para queries, 1h para agregaciones
- Invalidación automática en CSV upload

### ADR-005: Zod sobre TypeScript Interfaces

**Contexto:** Validación de datos de entrada en APIs.

**Decisión:** Usar Zod para runtime validation.

**Razones:**
1. **Runtime safety**: TypeScript solo valida en compile-time
2. **Auto-parsing**: Convierte strings a tipos correctos
3. **Error messages**: Mensajes claros para debugging
4. **OpenAPI integration**: Genera specs automáticamente

**Consecuencias:**
- ✅ Type safety en runtime
- ✅ Validación robusta
- ✅ Mejor DX
- ⚠️ Overhead mínimo de performance

---

## Escalabilidad

### Limitaciones Actuales

| Aspecto | Límite Actual | Consecuencia |
|---------|---------------|--------------|
| Registros en DB | ~50,000 | Queries lentas |
| Payload frontend | 3.6MB | Carga inicial lenta |
| Usuarios concurrentes | ~10 | SQLite lock contention |
| GPT-5 rate limit | 1 req/sec | Categorización lenta |
| Cache scope | Por usuario | Desperdicio de recursos |

### Plan de Escalabilidad

#### **Fase 1: Optimización de Queries (v1.1)**

**Objetivo:** Soportar 100K registros sin degradación.

1. **Backend Aggregation**
   ```typescript
   // Nuevo endpoint
   GET /api/analytics/mosaico
   
   // Calcula en backend:
   {
     perfiles: [
       {
         perfil: "alcaldiadecali",
         categorias: {
           SEGURIDAD: { publicaciones: 45, impresiones: 12000 },
           // ...
         }
       }
     ]
   }
   
   // Payload: 5KB vs 3.6MB actual
   ```

2. **Database Indexes**
   ```sql
   CREATE INDEX idx_fecha_perfil ON publicaciones(fecha, perfil);
   CREATE INDEX idx_categoria_red ON publicaciones(categoria, red);
   ```

3. **Query Optimization**
   ```typescript
   // ❌ Malo: N+1 queries
   for (const perfil of perfiles) {
     const data = await prisma.publicacion.findMany({ where: { perfil } })
   }
   
   // ✅ Bueno: Single query
   const data = await prisma.publicacion.groupBy({
     by: ['perfil', 'categoria'],
     _sum: { impresiones: true },
   })
   ```

#### **Fase 2: Caching Layer (v1.2)**

**Objetivo:** Reducir carga en DB, compartir datos entre usuarios.

1. **Redis Implementation**
   ```typescript
   // lib/redis.ts
   import { Redis } from 'ioredis'
   
   const redis = new Redis(process.env.REDIS_URL)
   
   export async function getCached<T>(key: string, fetcher: () => Promise<T>, ttl = 300) {
     const cached = await redis.get(key)
     if (cached) return JSON.parse(cached)
     
     const data = await fetcher()
     await redis.setex(key, ttl, JSON.stringify(data))
     return data
   }
   ```

2. **Cache Strategy**
   ```typescript
   // Cache keys
   mosaico:{red}:{fechaInicio}:{fechaFin}  // TTL: 1h
   publicaciones:all                        // TTL: 5min
   csv-sessions:list                        // TTL: 1min
   
   // Invalidation
   On CSV upload: redis.del('publicaciones:all', 'mosaico:*')
   ```

3. **Expected Improvements**
   - Response time: 2s → 50ms
   - DB load: -90%
   - Concurrent users: 10 → 100+

#### **Fase 3: Database Migration (v2.0)**

**Objetivo:** Soportar 1M+ registros, 1000+ usuarios concurrentes.

1. **PostgreSQL Migration**
   ```bash
   # 1. Setup PostgreSQL
   DATABASE_URL="postgresql://user:pass@host:5432/andi"
   
   # 2. Update schema.prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   
   # 3. Migrate data
   npm run migrate:from-sqlite
   ```

2. **Partitioning Strategy**
   ```sql
   -- Partition by fecha (monthly)
   CREATE TABLE publicaciones_2025_10 PARTITION OF publicaciones
     FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');
   ```

3. **Read Replicas**
   ```
   Primary (writes) ←→ Replica 1 (reads - dashboard)
                    ↘ Replica 2 (reads - analytics)
   ```

#### **Fase 4: Microservices (v3.0)**

**Objetivo:** Escalar componentes independientemente.

```
┌──────────────────────────────────────────┐
│          API Gateway (Kong/Tyk)          │
└──────────────────────────────────────────┘
        ↓          ↓           ↓
   ┌─────────┐ ┌──────────┐ ┌─────────────┐
   │Dashboard│ │Analytics │ │Categorization│
   │Service  │ │Service   │ │Service (IA)  │
   └─────────┘ └──────────┘ └─────────────┘
        ↓          ↓           ↓
   ┌─────────┐ ┌──────────┐ ┌─────────────┐
   │ Postgres│ │  Redis   │ │  OpenAI     │
   └─────────┘ └──────────┘ └─────────────┘
```

**Beneficios:**
- Escala independiente
- Deploy independiente
- Tecnologías especializadas
- Fault isolation

---

## Métricas y Monitoreo

### KPIs a Monitorear

#### **Performance**
```typescript
// Server-side
- API response time (p50, p95, p99)
- Database query time
- Cache hit rate
- Memory usage
- CPU usage

// Client-side
- Time to First Byte (TTFB)
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)
- Time to Interactive (TTI)
```

#### **Business**
```typescript
- Total publicaciones en DB
- CSV uploads por día
- Registros pendientes
- GPT-5 categorizaciones exitosas
- Usuarios activos (futuro)
```

### Herramientas Recomendadas

1. **Vercel Analytics** (integrado)
   - Web Vitals
   - Edge requests
   - Function execution time

2. **Prisma Metrics**
   ```typescript
   prisma.$on('query', (e) => {
     console.log('Query: ' + e.query)
     console.log('Duration: ' + e.duration + 'ms')
   })
   ```

3. **Custom Logging**
   ```typescript
   // lib/logger.ts
   export function logAPIRequest(req, res, duration) {
     console.log({
       method: req.method,
       url: req.url,
       status: res.status,
       duration: `${duration}ms`,
       timestamp: new Date().toISOString()
     })
   }
   ```

---

## Seguridad

### Vulnerabilidades y Mitigaciones

#### **SQL Injection**
- ✅ **Mitigado**: Prisma usa prepared statements
- ❌ **Pendiente**: Rate limiting en queries costosas

#### **XSS (Cross-Site Scripting)**
- ✅ **Mitigado**: React escapa por default
- ✅ **Mitigado**: No usamos `dangerouslySetInnerHTML`

#### **CSRF (Cross-Site Request Forgery)**
- ⚠️ **Pendiente**: Implementar tokens CSRF (v2.0)

#### **File Upload Vulnerabilities**
- ✅ **Mitigado**: Solo CSVs permitidos
- ✅ **Mitigado**: Validación de contenido
- ⚠️ **Pendiente**: Límite de tamaño de archivo

#### **API Rate Limiting**
- ⚠️ **Pendiente**: Implementar rate limiting (v1.2)
  ```typescript
  import rateLimit from 'express-rate-limit'
  
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 100 // max requests
  })
  ```

#### **Authentication & Authorization**
- ❌ **Pendiente**: Sistema completo de auth (v2.0)
- **Plan**: JWT + roles (admin, viewer, editor)

---

## Conclusión

Esta arquitectura está diseñada para:
1. **Desarrollo rápido** (v1.0)
2. **Optimización progresiva** (v1.1-1.2)
3. **Escalabilidad futura** (v2.0-3.0)

El enfoque es **pragmático**: empezar simple y escalar cuando sea necesario, evitando sobre-ingeniería prematura.

---

**Próximos pasos recomendados:**
1. Implementar backend aggregation (mayor impacto)
2. Agregar Redis caching
3. Migrar a PostgreSQL
4. Implementar autenticación

**Última actualización:** Octubre 2025

