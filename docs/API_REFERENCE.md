# 🔌 API Reference - Documentación Completa

## Índice
- [Información General](#información-general)
- [Autenticación](#autenticación)
- [Endpoints](#endpoints)
  - [Publicaciones](#publicaciones)
  - [Upload CSV](#upload-csv)
  - [CSV Sessions](#csv-sessions)
  - [Categorización IA](#categorización-ia)
  - [Limpieza](#limpieza)
  - [Documentación](#documentación)
- [Schemas](#schemas)
- [Errores](#errores)
- [Rate Limiting](#rate-limiting)
- [Ejemplos](#ejemplos)

---

## Información General

### Base URL
```
Development:  http://localhost:3000
Production:   https://your-domain.com
```

### Content-Type
Todas las requests y responses usan `application/json`, excepto el upload de CSV que usa `multipart/form-data`.

### Versionado
**Versión actual:** v1.0  
**No hay versionado en URL** (por ahora). Cambios breaking se documentarán en CHANGELOG.md.

### OpenAPI Specification
Especificación completa disponible en:
- JSON: `GET /api/docs`
- Swagger UI: `/api-docs`
- HTML Simple: `/api-docs-simple`

---

## Autenticación

**Estado actual:** No requiere autenticación.

**Roadmap (v2.0):**
```http
Authorization: Bearer <JWT_TOKEN>
```

---

## Endpoints

### Publicaciones

#### `GET /api/publicaciones`

Obtener publicaciones con filtros avanzados y paginación.

**Query Parameters:**

| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| `red` | string | No | - | Red social: "Instagram" o "Facebook" |
| `perfil` | string | No | - | Nombre del perfil (case-sensitive) |
| `categoria` | string | No | - | Categoría: "SEGURIDAD", "TRANSPARENCIA PÚBLICA", "INVERTIR PARA CRECER", "Sin categoría", "Pendiente" |
| `tipoPublicacion` | string | No | - | Tipo: "Historia", "Publicar", "Reel", "Video", etc. |
| `fechaInicio` | string | No | - | Fecha inicio en formato ISO 8601 |
| `fechaFin` | string | No | - | Fecha fin en formato ISO 8601 |
| `limit` | number | No | 100 | Cantidad de resultados (1-50000) |
| `offset` | number | No | 0 | Número de resultados a saltar |
| `sortBy` | string | No | fecha | Campo para ordenar: "fecha", "impresiones", "alcance", "meGusta" |
| `sortOrder` | string | No | desc | Orden: "asc" o "desc" |

**Request Example:**
```http
GET /api/publicaciones?red=Instagram&perfil=alcaldiadecali&fechaInicio=2025-10-01&limit=50
```

**Response 200 OK:**
```json
{
  "success": true,
  "data": [
    {
      "ID": "111057841395714_814164581186156_2",
      "Fecha": "2025-10-07T09:30:00.000Z",
      "Red": "Instagram",
      "Tipo de publicación": "Publicar",
      "Perfil": "alcaldiadecali",
      "categoria": "SEGURIDAD",
      "Impresiones": 5432,
      "Alcance": 3210,
      "Me gusta": 156,
      "Comentarios": 12,
      "Compartidos": 8,
      "Guardados": 3
    },
    // ... más registros
  ],
  "meta": {
    "total": 18000,
    "limit": 50,
    "offset": 0,
    "hasNext": true,
    "hasPrev": false
  },
  "stats": {
    "totalPublicaciones": 18000,
    "redes": ["Instagram", "Facebook"],
    "perfiles": ["alcaldiadecali", "movilidadcali", ...],
    "categorias": ["SEGURIDAD", "TRANSPARENCIA PÚBLICA", ...],
    "tiposPublicacion": ["Publicar", "Historia", "Reel", ...]
  }
}
```

**Response 400 Bad Request:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameters",
    "details": {
      "limit": "Must be a number between 1 and 50000"
    }
  }
}
```

**Response 500 Internal Server Error:**
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An error occurred while fetching data"
  }
}
```

**Performance:**
- Sin cache: 500-1500ms
- Con cache (5min): 50-200ms
- Limit=50000: 2-5 segundos

---

### Upload CSV

#### `POST /api/upload-csv`

Subir y procesar un archivo CSV con publicaciones.

**Content-Type:** `multipart/form-data`

**Form Data:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `file` | File | Sí | Archivo CSV |
| `overwrite` | string | No | "true" o "false" (default: "false") |

**CSV Format:**

```csv
ID,Fecha,Red,Tipo de publicación,Perfil,categoria,Impresiones,Alcance,Me gusta,Comentarios,Compartidos,Guardados,Publicar
123,10/7/2025 9:30 AM,Instagram,Publicar,alcaldiadecali,SEGURIDAD,5000,3000,150,10,5,2,"Contenido de la publicación..."
```

**Columnas Requeridas:**
- `ID`: Identificador único (string)
- `Fecha`: Formato `M/D/YYYY H:MM am/pm`
- `Red`: "Instagram" o "Facebook"
- `Tipo de publicación`: Cualquier string
- `Perfil`: Nombre del perfil

**Columnas Opcionales:**
- `categoria`: Si no existe, se asigna "Pendiente"
- `Impresiones`, `Alcance`, etc.: Default 0
- `Publicar`: Contenido para categorización IA

**Reglas de Procesamiento:**
1. Si `Tipo de publicación` = "Historia" → **se excluye**
2. Si columna `categoria` no existe → asigna "Pendiente"
3. Si columna `categoria` existe pero vacía → asigna "Sin categoría"
4. Si `overwrite=false` y existe el ID → cuenta como duplicado (no actualiza)
5. Si `overwrite=true` y existe el ID → actualiza el registro

**Request Example (cURL):**
```bash
curl -X POST http://localhost:3000/api/upload-csv \
  -F "file=@input.csv" \
  -F "overwrite=false"
```

**Request Example (JavaScript):**
```javascript
const formData = new FormData()
formData.append('file', fileInput.files[0])
formData.append('overwrite', 'false')

const response = await fetch('/api/upload-csv', {
  method: 'POST',
  body: formData
})

const result = await response.json()
```

**Response 201 Created:**
```json
{
  "success": true,
  "sessionId": "cmgef21oo0000z8mgpcj9z315",
  "inserted": 1350,
  "updated": 0,
  "errors": 0,
  "duplicates": 50,
  "excludedHistorias": 23,
  "detectedColumns": [
    "ID",
    "Fecha",
    "Red",
    "Tipo de publicación",
    "Perfil",
    "categoria",
    "Impresiones",
    "Alcance",
    "Me gusta",
    "Comentarios",
    "Compartidos",
    "Guardados",
    "Publicar"
  ],
  "message": "CSV procesado correctamente",
  "details": {
    "totalRows": 1423,
    "processedRows": 1400,
    "insertedRows": 1350,
    "updatedRows": 0,
    "errorRows": 0,
    "duplicateRows": 50,
    "excludedHistorias": 23
  }
}
```

**Response 400 Bad Request:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "No file uploaded"
  }
}
```

**Response 422 Unprocessable Entity:**
```json
{
  "success": false,
  "sessionId": "cmgef21oo0000z8mgpcj9z315",
  "inserted": 1200,
  "updated": 0,
  "errors": 150,
  "duplicates": 50,
  "excludedHistorias": 23,
  "message": "CSV procesado con errores",
  "errorDetails": [
    {
      "row": 145,
      "error": "Invalid date format",
      "data": { "Fecha": "invalid-date" }
    },
    // ... más errores
  ]
}
```

**Performance:**
- 1000 rows: 1-2 segundos
- 5000 rows: 5-10 segundos
- 10000 rows: 15-20 segundos

**Limits:**
- Max file size: 50MB
- Max rows: No hay límite técnico, pero >50K rows puede tardar minutos

---

### CSV Sessions

#### `GET /api/csv-sessions`

Listar todas las sesiones de carga CSV.

**Query Parameters:**

| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| `limit` | number | No | 20 | Cantidad de sesiones (1-100) |
| `offset` | number | No | 0 | Número de sesiones a saltar |
| `status` | string | No | - | Filtrar por estado: "completed", "partial", "error" |

**Request Example:**
```http
GET /api/csv-sessions?limit=10&offset=0&status=completed
```

**Response 200 OK:**
```json
{
  "success": true,
  "sessions": [
    {
      "id": "cmgef21oo0000z8mgpcj9z315",
      "fileName": "input.csv",
      "uploadedAt": "2025-10-07T12:00:00.000Z",
      "status": "completed",
      "totalRows": 1400,
      "insertedRows": 1350,
      "updatedRows": 0,
      "errorRows": 0,
      "duplicateRows": 50,
      "excludedHistorias": 23,
      "detectedColumns": [
        "ID",
        "Fecha",
        "Red",
        "Perfil",
        "categoria",
        "Publicar"
      ],
      "errorDetails": null
    },
    // ... más sesiones
  ],
  "stats": {
    "totalSessions": 45,
    "totalRecords": 18000,
    "pendingRecords": 234,
    "duplicateDetected": 523
  },
  "meta": {
    "total": 45,
    "limit": 10,
    "offset": 0,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**Status Values:**
- `completed`: Todos los registros procesados sin errores
- `partial`: Algunos registros con errores o duplicados
- `error`: La mayoría de registros fallaron

---

#### `GET /api/csv-sessions/[id]`

Obtener detalle de una sesión específica.

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | string | ID de la sesión |

**Request Example:**
```http
GET /api/csv-sessions/cmgef21oo0000z8mgpcj9z315
```

**Response 200 OK:**
```json
{
  "success": true,
  "session": {
    "id": "cmgef21oo0000z8mgpcj9z315",
    "fileName": "input.csv",
    "uploadedAt": "2025-10-07T12:00:00.000Z",
    "status": "partial",
    "totalRows": 1400,
    "insertedRows": 1200,
    "updatedRows": 0,
    "errorRows": 150,
    "duplicateRows": 50,
    "excludedHistorias": 23,
    "detectedColumns": ["ID", "Fecha", "Red", "Perfil", "categoria"],
    "errorDetails": "[{\"row\":145,\"error\":\"Invalid date\"}]"
  },
  "publicaciones": [
    {
      "id": "123",
      "perfil": "alcaldiadecali",
      "fecha": "2025-10-07T09:30:00.000Z",
      "categoria": "SEGURIDAD",
      "impresiones": 5000
    },
    // ... primeras 100 publicaciones de esta sesión
  ],
  "meta": {
    "totalPublicaciones": 1200,
    "showing": 100
  }
}
```

**Response 404 Not Found:**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "CSV session not found"
  }
}
```

---

### Categorización IA

#### `POST /api/categorize-pending`

Categorizar automáticamente registros con categoría "Pendiente" usando GPT-5.

**Body:**

| Campo | Tipo | Requerido | Default | Descripción |
|-------|------|-----------|---------|-------------|
| `batchSize` | number | No | 10 | Cantidad de registros a procesar (1-100) |
| `delayMs` | number | No | 1000 | Delay entre requests a OpenAI (ms) |

**Request Example:**
```bash
curl -X POST http://localhost:3000/api/categorize-pending \
  -H "Content-Type: application/json" \
  -d '{
    "batchSize": 10,
    "delayMs": 1000
  }'
```

**Prompt utilizado:**
El sistema envía a GPT-5:
```
Actúa como un analista especializado en comunicación gubernamental.
Analiza la siguiente publicación de {perfil} y categorízala en:
1. SEGURIDAD
2. TRANSPARENCIA PÚBLICA
3. INVERTIR PARA CRECER
4. Sin categoría (si no aplica)

Contenido: {publicar}

Responde solo con el nombre de la categoría.
```

**Response 200 OK:**
```json
{
  "success": true,
  "stats": {
    "totalPendientes": 234,
    "totalProcessed": 10,
    "successful": 9,
    "errors": 1,
    "categorized": {
      "SEGURIDAD": 3,
      "TRANSPARENCIA PÚBLICA": 4,
      "INVERTIR PARA CRECER": 2
    },
    "errorDetails": [
      {
        "recordId": "abc123",
        "error": "OpenAI API timeout"
      }
    ]
  },
  "processingTime": "12.5s",
  "message": "9 de 10 registros categorizados exitosamente"
}
```

**Response 400 Bad Request:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "batchSize must be between 1 and 100"
  }
}
```

**Response 500 Internal Server Error:**
```json
{
  "success": false,
  "error": {
    "code": "OPENAI_ERROR",
    "message": "OpenAI API unavailable",
    "details": {
      "status": 503,
      "openaiMessage": "Service temporarily unavailable"
    }
  }
}
```

**Performance & Costs:**
- Time: ~1.2s por registro (con delay de 1000ms)
- Cost: ~$0.002 por registro (GPT-5 pricing)
- 10 registros: ~12 segundos, ~$0.02
- 100 registros: ~2 minutos, ~$0.20

**Rate Limits:**
- OpenAI: Varía según tu tier (generalmente 3500 req/min)
- Recomendación: `delayMs >= 1000` para evitar rate limits

**Environment Variables:**
```env
OPENAI_API_KEY=sk-proj-...
```

---

### Limpieza

#### `DELETE /api/cleanup-pending`

Eliminar registros con categoría "Pendiente" que no tengan contenido en la columna `publicar`.

**No requiere body.**

**Request Example:**
```bash
curl -X DELETE http://localhost:3000/api/cleanup-pending
```

**Response 200 OK:**
```json
{
  "success": true,
  "stats": {
    "eliminatedCount": 23,
    "totalPendientesAntes": 234,
    "totalPendientesDespues": 211
  },
  "eliminatedRecords": [
    "111057841395714_814164581186156_2",
    "222057841395714_814164581186156_3",
    // ... IDs eliminados
  ],
  "message": "23 registros eliminados exitosamente"
}
```

**Response 500 Internal Server Error:**
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Error deleting records"
  }
}
```

**Performance:**
- 10 registros: ~100ms
- 100 registros: ~500ms
- 1000 registros: ~2 segundos

**Nota importante:** Esta operación es **irreversible**. Los registros eliminados no se pueden recuperar.

---

### Documentación

#### `GET /api/docs`

Obtener especificación OpenAPI 3.0 completa en JSON.

**Request Example:**
```http
GET /api/docs
```

**Response 200 OK:**
```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Andi Analytics API",
    "description": "API para Análisis de Publicaciones en Redes Sociales",
    "version": "1.0.0"
  },
  "servers": [
    {
      "url": "http://localhost:3000",
      "description": "Development server"
    }
  ],
  "paths": {
    "/api/publicaciones": {
      "get": {
        "summary": "Obtener publicaciones",
        "description": "Recupera publicaciones con filtros opcionales y paginación",
        "parameters": [...],
        "responses": {...}
      }
    },
    // ... todos los endpoints
  },
  "components": {
    "schemas": {...},
    "parameters": {...},
    "responses": {...}
  }
}
```

**Uso:**
- Importar en Postman/Insomnia
- Generar clientes con OpenAPI Generator
- Documentación con Swagger UI

---

## Schemas

### Publicacion

```typescript
{
  ID: string                  // Identificador único
  Fecha: string              // ISO 8601 date-time
  Red: 'Instagram' | 'Facebook'
  'Tipo de publicación': string
  Perfil: string
  categoria: string
  Impresiones: number
  Alcance: number
  'Me gusta': number
  Comentarios: number
  Compartidos: number
  Guardados: number
}
```

### CsvSession

```typescript
{
  id: string                 // CUID
  fileName: string
  uploadedAt: string         // ISO 8601 date-time
  status: 'completed' | 'partial' | 'error'
  totalRows: number
  insertedRows: number
  updatedRows: number
  errorRows: number
  duplicateRows: number
  excludedHistorias: number
  detectedColumns: string[]
  errorDetails?: string      // JSON string
}
```

### ApiResponse<T>

```typescript
{
  success: boolean
  data?: T
  meta?: {
    total: number
    limit: number
    offset: number
    hasNext: boolean
    hasPrev: boolean
  }
  error?: {
    code: string
    message: string
    details?: any
  }
}
```

---

## Errores

### Códigos de Error

| Código | HTTP Status | Descripción |
|--------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Parámetros inválidos |
| `NOT_FOUND` | 404 | Recurso no encontrado |
| `CONFLICT` | 409 | Conflicto (ej: duplicados) |
| `UNPROCESSABLE_ENTITY` | 422 | Datos no procesables |
| `INTERNAL_ERROR` | 500 | Error interno del servidor |
| `OPENAI_ERROR` | 500 | Error en la API de OpenAI |
| `DATABASE_ERROR` | 500 | Error en la base de datos |

### Estructura de Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error message",
    "details": {
      "field": "categoria",
      "issue": "Invalid category name",
      "expected": ["SEGURIDAD", "TRANSPARENCIA PÚBLICA", "INVERTIR PARA CRECER"]
    }
  }
}
```

### Manejo de Errores (Client-Side)

```typescript
try {
  const response = await fetch('/api/publicaciones')
  const data = await response.json()
  
  if (!data.success) {
    console.error('API Error:', data.error)
    // Handle error
  }
  
  // Use data.data
} catch (error) {
  console.error('Network Error:', error)
  // Handle network error
}
```

---

## Rate Limiting

**Estado actual:** Sin rate limiting implementado.

**Recomendaciones:**
- No hacer más de 10 requests/segundo
- Usar caché cuando sea posible
- Para uploads masivos, usar `delayMs` en categorización

**Roadmap (v1.2):**
```
Rate Limits:
- General: 100 req/min por IP
- Upload CSV: 5 req/min por IP
- Categorización: 30 req/min por IP (limitado por OpenAI)
```

**Headers (futuro):**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1696695600
```

---

## Ejemplos

### Ejemplo 1: Obtener publicaciones de Instagram del último mes

```javascript
const hoy = new Date()
const hace30dias = new Date()
hace30dias.setDate(hace30dias.getDate() - 30)

const response = await fetch(
  `/api/publicaciones?` +
  `red=Instagram&` +
  `fechaInicio=${hace30dias.toISOString()}&` +
  `fechaFin=${hoy.toISOString()}&` +
  `limit=1000`
)

const { data, meta } = await response.json()
console.log(`Obtenidas ${data.length} de ${meta.total} publicaciones`)
```

### Ejemplo 2: Subir CSV y esperar resultado

```javascript
async function uploadCSV(file) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('overwrite', 'false')
  
  const response = await fetch('/api/upload-csv', {
    method: 'POST',
    body: formData
  })
  
  const result = await response.json()
  
  if (result.success) {
    console.log(`✅ ${result.inserted} registros insertados`)
    console.log(`⚠️ ${result.duplicates} duplicados detectados`)
    console.log(`🚫 ${result.excludedHistorias} historias excluidas`)
    console.log(`Session ID: ${result.sessionId}`)
  } else {
    console.error('❌ Error:', result.error.message)
  }
  
  return result
}
```

### Ejemplo 3: Categorizar pendientes con feedback de progreso

```javascript
async function categorizePendientes() {
  console.log('🤖 Iniciando categorización con GPT-5...')
  
  const response = await fetch('/api/categorize-pending', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      batchSize: 20,
      delayMs: 1200  // 1.2s entre requests
    })
  })
  
  const result = await response.json()
  
  if (result.success) {
    console.log(`✅ ${result.stats.successful} de ${result.stats.totalProcessed} categorizados`)
    console.log(`⏱️ Tiempo: ${result.processingTime}`)
    console.log('📊 Distribución:')
    for (const [cat, count] of Object.entries(result.stats.categorized)) {
      console.log(`   ${cat}: ${count}`)
    }
  }
  
  return result
}
```

### Ejemplo 4: Paginación manual

```javascript
async function getAllPublicaciones() {
  const allData = []
  const limit = 1000
  let offset = 0
  let hasNext = true
  
  while (hasNext) {
    const response = await fetch(
      `/api/publicaciones?limit=${limit}&offset=${offset}`
    )
    const { data, meta } = await response.json()
    
    allData.push(...data)
    offset += limit
    hasNext = meta.hasNext
    
    console.log(`Progreso: ${allData.length} / ${meta.total}`)
  }
  
  return allData
}
```

### Ejemplo 5: Filtrado combinado

```javascript
// Obtener publicaciones de seguridad en Instagram
// del perfil de la alcaldía en septiembre
const response = await fetch(
  '/api/publicaciones?' +
  'red=Instagram&' +
  'perfil=alcaldiadecali&' +
  'categoria=SEGURIDAD&' +
  'fechaInicio=2025-09-01T00:00:00.000Z&' +
  'fechaFin=2025-09-30T23:59:59.999Z&' +
  'sortBy=impresiones&' +
  'sortOrder=desc&' +
  'limit=100'
)

const { data, meta, stats } = await response.json()

// Analizar top 10
const top10 = data.slice(0, 10)
console.log('Top 10 publicaciones por impresiones:')
top10.forEach((pub, i) => {
  console.log(`${i+1}. ${pub.Impresiones} impresiones - ${pub['Tipo de publicación']}`)
})
```

---

## Testing de APIs

### Con cURL

```bash
# GET request
curl -X GET "http://localhost:3000/api/publicaciones?limit=5"

# POST request (JSON)
curl -X POST "http://localhost:3000/api/categorize-pending" \
  -H "Content-Type: application/json" \
  -d '{"batchSize": 5, "delayMs": 1000}'

# POST request (FormData)
curl -X POST "http://localhost:3000/api/upload-csv" \
  -F "file=@input.csv" \
  -F "overwrite=false"

# DELETE request
curl -X DELETE "http://localhost:3000/api/cleanup-pending"
```

### Con Postman

1. Importar la colección desde `/api/docs`
2. Crear environment con:
   ```
   BASE_URL = http://localhost:3000
   ```
3. Usar variables: `{{BASE_URL}}/api/publicaciones`

### Con Node.js (Scripts de Test)

```bash
# Categorización GPT-5
node test/test-gpt-categorization.js

# Endpoint de categorización
node test/test-api-categorize.js

# Endpoint de limpieza
node test/test-cleanup-api.js
```

---

## Webhooks (Futuro - v2.0)

**Registro de webhooks:**
```http
POST /api/webhooks
{
  "url": "https://your-domain.com/webhook",
  "events": ["csv.uploaded", "record.categorized"]
}
```

**Eventos disponibles:**
- `csv.uploaded`: Cuando se sube un CSV
- `csv.processed`: Cuando termina el procesamiento
- `record.categorized`: Cuando se categoriza un registro
- `record.created`: Cuando se crea un registro
- `record.updated`: Cuando se actualiza un registro

**Payload de webhook:**
```json
{
  "event": "csv.uploaded",
  "timestamp": "2025-10-07T12:00:00.000Z",
  "data": {
    "sessionId": "cmgef21oo0000z8mgpcj9z315",
    "fileName": "input.csv",
    "totalRows": 1400
  }
}
```

---

## Mejores Prácticas

### 1. Caché

```javascript
// Implementar caché client-side
const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

async function fetchWithCache(url) {
  const cached = cache.get(url)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  
  const response = await fetch(url)
  const data = await response.json()
  
  cache.set(url, {
    data,
    timestamp: Date.now()
  })
  
  return data
}
```

### 2. Error Handling

```javascript
async function fetchWithRetry(url, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url)
      if (response.ok) {
        return await response.json()
      }
      
      // Retry on 5xx errors
      if (response.status >= 500 && i < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 1000 * (i + 1)))
        continue
      }
      
      throw new Error(`HTTP ${response.status}`)
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(r => setTimeout(r, 1000 * (i + 1)))
    }
  }
}
```

### 3. Batch Operations

```javascript
// Procesar registros pendientes en lotes
async function processAllPending() {
  const batchSize = 20
  const delayMs = 1200
  
  let hasMore = true
  let totalProcessed = 0
  
  while (hasMore) {
    const result = await fetch('/api/categorize-pending', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batchSize, delayMs })
    }).then(r => r.json())
    
    totalProcessed += result.stats.successful
    hasMore = result.stats.totalPendientes > totalProcessed
    
    console.log(`Progreso: ${totalProcessed} / ${result.stats.totalPendientes}`)
    
    // Delay entre batches
    if (hasMore) {
      await new Promise(r => setTimeout(r, 2000))
    }
  }
  
  console.log(`✅ Total procesado: ${totalProcessed}`)
}
```

---

## Changelog de API

### v1.0.0 (Octubre 2025)
- ✨ Initial release
- ✨ GET /api/publicaciones
- ✨ POST /api/upload-csv
- ✨ GET /api/csv-sessions
- ✨ GET /api/csv-sessions/[id]
- ✨ POST /api/categorize-pending
- ✨ DELETE /api/cleanup-pending
- ✨ GET /api/docs

### v1.1.0 (Planeado - Q4 2025)
- ✨ GET /api/analytics/mosaico (backend aggregation)
- ✨ GET /api/analytics/trends
- 🔧 Rate limiting implementation

### v2.0.0 (Planeado - Q2 2026)
- ⚠️ **BREAKING**: Authentication required (JWT)
- ✨ POST /api/auth/login
- ✨ POST /api/auth/register
- ✨ POST /api/webhooks
- ✨ GET /api/users

---

**Última actualización:** Octubre 2025  
**Versión de API:** 1.0.0  
**Mantenedor:** [Tu Nombre]

Para reportar issues o solicitar features, abre un issue en GitHub.

