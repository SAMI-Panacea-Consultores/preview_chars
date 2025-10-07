# 📊 Analytics Dashboard - Análisis de Redes Sociales

> Dashboard moderno y completo para análisis de publicaciones en redes sociales con arquitectura API-First, construido con Next.js 14, Prisma, TypeScript y diseño minimalista premium.

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.14-2D3748)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📑 Tabla de Contenidos

- [🎯 Características Principales](#-características-principales)
- [🏗️ Arquitectura del Sistema](#️-arquitectura-del-sistema)
- [🛠️ Tecnologías](#️-tecnologías)
- [📁 Estructura del Proyecto](#-estructura-del-proyecto)
- [🚀 Instalación](#-instalación)
- [📖 Uso](#-uso)
- [🔌 APIs y Endpoints](#-apis-y-endpoints)
- [💾 Base de Datos](#-base-de-datos)
- [🎨 Sistema de Diseño](#-sistema-de-diseño)
- [🧪 Testing](#-testing)
- [🚀 Despliegue](#-despliegue)
- [🔮 Roadmap](#-roadmap)
- [👥 Equipo y Contribuciones](#-equipo-y-contribuciones)

---

## 🎯 Características Principales

### 📈 **Visualización de Datos Avanzada**

#### **Dashboard Principal** (`/`)
- **Mosaico de Perfiles**: Vista panorámica con gráficas de torta por perfil
- **Análisis por Categoría**: Distribución de publicaciones en 3 categorías:
  - 🛡️ SEGURIDAD
  - 📊 TRANSPARENCIA PÚBLICA
  - 💰 INVERTIR PARA CRECER
- **Filtros Inteligentes**: Panel collapsible con:
  - Rango de fechas (con validación de datos disponibles)
  - Red social (Instagram/Facebook)
  - Tipos de publicación (Historia, Publicar, Reel, Video, etc.)
- **Métricas en Tiempo Real**: Impresiones, Alcance, Me Gusta, Comentarios, Compartidos, Guardados

#### **Análisis de Desalineación** (`/sin-categoria`)
- **Tabla de Perfiles**: Ordenada por % de desalineación narrativa
- **Columnas Sortables**: Click en headers para ordenar por cualquier métrica
- **Indicadores de Rendimiento**:
  - % Desalineación (publicaciones sin categorizar)
  - Total de publicaciones
  - Métricas de engagement
- **Exportación PDF**: Reportes ejecutivos descargables con diseño personalizado
- **Filtros Sincronizados**: Mismos filtros del dashboard principal

#### **Visualización de Gráficas** (`/charts-test`)
- **TradingView Lightweight Charts**: Gráficas financieras de alta performance
- **Gráficas de Área**: Evolución temporal de métricas
- **Gráficas de Torta**: Distribución porcentual interactiva
- **Responsive**: Adaptadas a cualquier tamaño de pantalla

### 🔄 **Gestión de Datos CSV**

#### **Historial de Sesiones** (`/csv-sessions`)
- **Dashboard de Uploads**: Vista completa de todas las cargas
- **Estadísticas Globales**:
  - Total de registros en base de datos
  - Registros pendientes de categorización
  - Total de sesiones de carga
  - Duplicados detectados
- **Tabla de Sesiones**: Cada sesión muestra:
  - Nombre del archivo
  - Fecha de carga
  - Estado (completo/parcial/error)
  - Registros insertados/actualizados/duplicados/excluidos
  - Columnas detectadas
- **Vista Detallada**: Click en cualquier sesión para ver detalles completos

#### **Carga de CSV** (integrado en `/csv-sessions`)
- **Drag & Drop**: Interface moderna para subir archivos
- **Validación Automática**:
  - Formato de fechas (M/D/YYYY H:MM am/pm)
  - Columnas requeridas
  - Detección de duplicados
- **Filtros Inteligentes**:
  - Exclusión automática de publicaciones "Historia"
  - Asignación de categoría "Pendiente" si no existe la columna
- **Feedback en Tiempo Real**: Progreso y resultados detallados

### 🤖 **Categorización Automática con IA**

#### **Procesamiento con GPT-5**
- **Análisis de Contenido**: Categorización inteligente basada en el texto de la publicación
- **Batch Processing**: Procesamiento por lotes con delays configurables
- **Prompt Especializado**: Análisis de comunicación gubernamental
- **Categorías Automáticas**:
  - SEGURIDAD
  - TRANSPARENCIA PÚBLICA
  - INVERTIR PARA CRECER
  - Sin categoría (si no aplica)

#### **Limpieza de Registros**
- **Detección de Registros Vacíos**: Identifica publicaciones sin contenido
- **Eliminación Masiva**: Botón para limpiar registros pendientes sin contenido
- **Estadísticas Post-Limpieza**: Feedback inmediato de registros eliminados

### 🔌 **APIs RESTful Completas**

#### **Documentación Interactiva**
- **SwaggerUI** (`/api-docs`): Documentación interactiva completa
- **Versión Simple** (`/api-docs-simple`): Documentación HTML estática
- **OpenAPI 3.0**: Especificación estándar de la industria
- **Try It Out**: Probar endpoints directamente desde el navegador

#### **Endpoints Principales**
```
GET    /api/publicaciones          # Listar publicaciones con filtros
POST   /api/upload-csv             # Subir archivo CSV
GET    /api/csv-sessions           # Listar sesiones de carga
GET    /api/csv-sessions/[id]      # Detalle de sesión específica
POST   /api/categorize-pending     # Categorizar con GPT-5
DELETE /api/cleanup-pending        # Limpiar registros vacíos
GET    /api/docs                   # OpenAPI specification
```

### 🎨 **Diseño Premium**

- **Header Moderno**: Navegación compacta estilo pill con gradientes
- **Glassmorphism**: Efectos de cristal translúcido
- **Responsive**: Mobile-first, optimizado para todos los dispositivos
- **Animaciones Suaves**: Transiciones CSS y micro-interacciones
- **Paleta de Colores**: Esquema profesional con acentos en indigo/púrpura
- **Tipografía**: SF Pro Display para una estética Apple-like

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js 14 + React)               │
├─────────────────────────────────────────────────────────────────┤
│  Pages                │  Components        │  Hooks             │
│  • Dashboard (/)      │  • CSVUploader     │  • usePublicaciones│
│  • Sin Categoría      │  • TradingView     │  • useCSVUpload    │
│  • CSV Sessions       │  • StatusBanner    │  • useCategorizePending│
│  • Charts Test        │                    │  • useCleanupPending│
│  • API Docs           │                    │                    │
├─────────────────────────────────────────────────────────────────┤
│                      API LAYER (Next.js API Routes)             │
├─────────────────────────────────────────────────────────────────┤
│  Validation           │  Routes            │  External Services │
│  • Zod Schemas        │  • Publicaciones   │  • OpenAI GPT-5    │
│  • Type Safety        │  • Upload CSV      │                    │
│  • Error Handling     │  • CSV Sessions    │                    │
│                       │  • Categorization  │                    │
│                       │  • Cleanup         │                    │
├─────────────────────────────────────────────────────────────────┤
│                   DATA LAYER (Prisma ORM + SQLite)              │
├─────────────────────────────────────────────────────────────────┤
│  Models               │  Database          │  Caching           │
│  • Publicacion        │  • SQLite (dev)    │  • In-Memory (5min)│
│  • CsvSession         │  • PostgreSQL(prod)│  • Redis (futuro)  │
│                       │  • Indexes         │                    │
│                       │  • Migrations      │                    │
└─────────────────────────────────────────────────────────────────┘
```

### **Flujo de Datos**

#### **1. Carga de CSV**
```
Usuario → CSV File → Frontend Validation → API /upload-csv
                                              ↓
                                    Zod Schema Validation
                                              ↓
                                    Parse CSV (PapaParse)
                                              ↓
                              Detect Duplicates & Validate Data
                                              ↓
                                    Prisma Transaction
                                              ↓
                              Insert/Update + Create CsvSession
                                              ↓
                              Return Statistics & Session ID
```

#### **2. Visualización de Dashboard**
```
Page Load → usePublicaciones Hook → Check Cache (5min TTL)
                                          ↓
                              Cache Hit? → Return Cached Data
                                    ↓ No
                        API /publicaciones?limit=50000
                                          ↓
                              Prisma Query (with filters)
                                          ↓
                              Transform to Frontend Format
                                          ↓
                              Cache + Return JSON (3.6MB)
                                          ↓
                Frontend Calculations (aggregate, normalize, filter)
                                          ↓
                            Render Charts (Recharts/TradingView)
```

#### **3. Categorización con IA**
```
User Click → useCategorizePending Hook → API /categorize-pending
                                                ↓
                                  Query Pending Records (batch)
                                                ↓
                                  For Each Record:
                                      ↓
                            OpenAI API (GPT-5) Request
                                      ↓
                            Parse Response (category)
                                      ↓
                            Update Prisma Record
                                      ↓
                            Delay (configurable)
                                      ↓
                        Return Statistics (processed/errors)
```

---

## 🛠️ Tecnologías

### **Frontend**
| Tecnología | Versión | Uso |
|------------|---------|-----|
| Next.js | 14.2.10 | Framework React con SSR y App Router |
| React | 18.3.1 | Librería UI |
| TypeScript | 5.9.2 | Type safety |
| Recharts | 3.1.2 | Gráficas de barras y torta |
| Lightweight Charts | 5.0.9 | Gráficas financieras de TradingView |
| PapaParse | 5.4.1 | Parser de CSV |
| jsPDF | 3.0.3 | Generación de PDF |

### **Backend & APIs**
| Tecnología | Versión | Uso |
|------------|---------|-----|
| Prisma | 6.14.0 | ORM para base de datos |
| Zod | 4.0.17 | Validación de schemas |
| Swagger JSDoc | 6.2.8 | Documentación OpenAPI |
| Next Swagger Doc | 0.4.1 | Integración Swagger con Next.js |

### **Servicios Externos**
| Servicio | Uso |
|----------|-----|
| OpenAI API | Categorización automática con GPT-5 |

### **DevOps & Tooling**
| Herramienta | Uso |
|-------------|-----|
| Git | Control de versiones |
| npm | Gestor de paquetes |
| ESLint | Linting de código |

---

## 📁 Estructura del Proyecto

```
andi_pre/
├── 📄 README.md                          # Este archivo
├── 📄 CHANGELOG.md                       # Historial de cambios
├── 📄 TECHNICAL_DOCS.md                  # Documentación técnica detallada
├── 📄 PROJECT_CONFIG.md                  # Configuraciones del proyecto
├── 📄 LICENSE                            # Licencia MIT
│
├── 📂 docs/                              # Documentación adicional
│   ├── README.md                         # Índice de documentación
│   ├── CSV_SESSIONS_README.md            # Guía del módulo CSV
│   ├── CSV_SESSIONS_COMPONENT.md         # Detalles técnicos del componente
│   ├── CSV_SESSIONS_CHANGELOG.md         # Historial del módulo CSV
│   ├── ARCHITECTURE.md                   # Arquitectura detallada
│   ├── API_REFERENCE.md                  # Referencia completa de APIs
│   ├── DATABASE.md                       # Esquema y migraciones
│   └── DEPLOYMENT.md                     # Guía de despliegue
│
├── 📂 src/
│   ├── 📂 app/                           # Next.js App Router
│   │   ├── 📄 layout.tsx                 # Layout global
│   │   ├── 📄 page.tsx                   # Dashboard principal
│   │   ├── 📄 globals.css                # Estilos globales
│   │   │
│   │   ├── 📂 api/                       # API Routes
│   │   │   ├── 📂 publicaciones/         # CRUD de publicaciones
│   │   │   │   └── route.ts
│   │   │   ├── 📂 upload-csv/            # Upload de CSV
│   │   │   │   └── route.ts
│   │   │   ├── 📂 csv-sessions/          # Gestión de sesiones CSV
│   │   │   │   ├── route.ts              # GET /api/csv-sessions
│   │   │   │   └── [id]/route.ts         # GET /api/csv-sessions/[id]
│   │   │   ├── 📂 categorize-pending/    # Categorización con IA
│   │   │   │   └── route.ts
│   │   │   ├── 📂 cleanup-pending/       # Limpieza de registros
│   │   │   │   └── route.ts
│   │   │   └── 📂 docs/                  # OpenAPI spec
│   │   │       └── route.ts
│   │   │
│   │   ├── 📂 sin-categoria/             # Análisis de desalineación
│   │   │   └── page.tsx
│   │   ├── 📂 csv-sessions/              # Historial de CSV uploads
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── 📂 charts-test/               # Pruebas de visualización
│   │   │   └── page.tsx
│   │   ├── 📂 api-docs/                  # SwaggerUI interactivo
│   │   │   └── page.tsx
│   │   ├── 📂 api-docs-simple/           # Docs HTML estática
│   │   │   └── page.tsx
│   │   └── 📂 perfil/[red]/[perfil]/     # Detalle de perfil (legacy)
│   │       └── page.tsx
│   │
│   ├── 📂 components/                    # Componentes React reutilizables
│   │   ├── CSVUploader.tsx               # Componente de carga CSV
│   │   ├── CSVStatusBanner.tsx           # Banner de estado de upload
│   │   ├── TradingViewChart.tsx          # Gráfica de área (TradingView)
│   │   └── TradingViewPieChart.tsx       # Gráfica de torta (TradingView)
│   │
│   ├── 📂 hooks/                         # Custom React Hooks
│   │   ├── usePublicaciones.ts           # Hook para datos de DB
│   │   ├── useCSVUpload.ts               # Hook para upload CSV
│   │   ├── useCategorizePending.ts       # Hook para categorización IA
│   │   └── useCleanupPending.ts          # Hook para limpieza
│   │
│   ├── 📂 lib/                           # Utilidades y configuración
│   │   ├── prisma.ts                     # Cliente Prisma singleton
│   │   ├── schemas.ts                    # Schemas Zod para validación
│   │   ├── swagger.ts                    # Configuración OpenAPI
│   │   └── api-utils.ts                  # Utilidades para APIs
│   │
│   └── 📂 generated/                     # Código generado (Prisma Client)
│       └── prisma/
│
├── 📂 prisma/                            # Prisma ORM
│   ├── schema.prisma                     # Esquema de base de datos
│   ├── dev.db                            # Base de datos SQLite (dev)
│   └── migrations/                       # Migraciones de DB
│       ├── 20250820042157_init/
│       ├── 20250915094009_add_tipo_publicacion/
│       └── 20251006001019_add_csv_sessions/
│
├── 📂 public/                            # Archivos estáticos
│   ├── input.csv                         # CSV de ejemplo
│   └── vercel.svg                        # Logo Vercel
│
├── 📂 test/                              # Scripts de testing (Node.js)
│   ├── test-gpt-categorization.js        # Test de GPT-5
│   ├── test-api-categorize.js            # Test del endpoint de categorización
│   └── test-cleanup-api.js               # Test del endpoint de limpieza
│
├── 📄 package.json                       # Dependencias y scripts
├── 📄 tsconfig.json                      # Configuración TypeScript
├── 📄 next.config.js                     # Configuración Next.js
└── 📄 .gitignore                         # Archivos ignorados por Git
```

### **Convenciones de Nombres**

- **Componentes React**: PascalCase (`CSVUploader.tsx`)
- **Hooks**: camelCase con prefijo `use` (`usePublicaciones.ts`)
- **API Routes**: kebab-case (`upload-csv/route.ts`)
- **Páginas**: kebab-case (`sin-categoria/page.tsx`)
- **Utilidades**: camelCase (`api-utils.ts`)
- **Constantes**: UPPER_SNAKE_CASE en el código
- **CSS Classes**: kebab-case (`.dashboard-header`)

---

## 🚀 Instalación

### **Prerrequisitos**

- **Node.js**: v18.0.0 o superior
- **npm**: v9.0.0 o superior (o yarn/pnpm)
- **Git**: Para clonar el repositorio
- **OpenAI API Key**: Para usar la categorización con IA (opcional)

### **Paso 1: Clonar el Repositorio**

```bash
git clone <repository-url>
cd andi_pre
```

### **Paso 2: Instalar Dependencias**

```bash
npm install
```

### **Paso 3: Configurar Variables de Entorno**

Crea un archivo `.env` en la raíz del proyecto:

```bash
# Base de datos
DATABASE_URL="file:./prisma/dev.db"

# OpenAI API (para categorización automática)
OPENAI_API_KEY="sk-proj-..."

# Next.js
NODE_ENV="development"
```

### **Paso 4: Inicializar Base de Datos**

```bash
# Generar cliente Prisma
npx prisma generate

# Aplicar migraciones
npx prisma db push

# (Opcional) Abrir Prisma Studio para ver la DB
npx prisma studio
```

### **Paso 5: Iniciar el Servidor de Desarrollo**

```bash
npm run dev
```

El dashboard estará disponible en: **http://localhost:3000**

---

## 📖 Uso

### **1. Dashboard Principal (`/`)**

#### **Visualizar Datos**
1. El dashboard carga automáticamente todos los datos de la base de datos
2. Por defecto muestra los últimos 7 días
3. Usa el panel de filtros para ajustar:
   - **Rango de fechas**: Fechas mínimas y máximas según datos disponibles
   - **Red social**: Instagram o Facebook
   - **Tipos de publicación**: Publicar, Reel, Historia, etc.

#### **Mosaico de Perfiles**
- Cada card muestra:
  - Nombre del perfil
  - Gráfica de torta con distribución de categorías
  - Total de publicaciones
  - Impresiones totales
- Click en "Ver detalle" para análisis profundo (coming soon)

### **2. Análisis de Desalineación (`/sin-categoria`)**

#### **Identificar Perfiles Desalineados**
1. La tabla muestra todos los perfiles ordenados por defecto por % de desalineación
2. Click en cualquier header de columna para ordenar
3. Usa los filtros para refinar el análisis

#### **Exportar Reporte PDF**
1. Click en el botón "📄 Exportar PDF"
2. Se genera un reporte ejecutivo con:
   - Fecha de generación
   - Rango de fechas analizado
   - Tabla con perfiles y % de desalineación
   - Diseño profesional listo para compartir

### **3. Gestión de CSV (`/csv-sessions`)**

#### **Subir un Nuevo CSV**
1. Click en "📤 Subir nuevo archivo CSV" o drag & drop
2. El sistema valida automáticamente:
   - Formato de fechas
   - Columnas requeridas
   - Duplicados
3. Revisa los resultados:
   - ✅ Registros insertados
   - 🔄 Registros actualizados
   - ⚠️ Duplicados detectados
   - ❌ Registros con errores
   - 🚫 Historias excluidas

#### **Formato del CSV**
```csv
ID,Fecha,Red,Tipo de publicación,Perfil,categoria,Impresiones,Alcance,Me gusta,Comentarios,Compartidos,Guardados,Publicar
123,10/7/2025 9:30 AM,Instagram,Publicar,alcaldiadecali,SEGURIDAD,5000,3000,150,10,5,2,"Texto de la publicación"
```

**Columnas Requeridas:**
- `ID`: Identificador único
- `Fecha`: Formato M/D/YYYY H:MM am/pm
- `Red`: Instagram o Facebook
- `Tipo de publicación`: Historia, Publicar, Reel, etc.
- `Perfil`: Nombre del perfil

**Columnas Opcionales:**
- `categoria`: Si no existe, se asigna "Pendiente"
- `Impresiones`, `Alcance`, `Me gusta`, etc.: Métricas (default: 0)
- `Publicar`: Contenido de la publicación (para IA)

#### **Categorización Automática con IA**
1. En la tarjeta "🤖 Registros Pendientes", click en "🤖 Procesar con GPT-5"
2. El sistema:
   - Lee el contenido de la columna "Publicar"
   - Envía a GPT-5 para análisis
   - Asigna categoría automáticamente
   - Muestra estadísticas de procesamiento
3. Configurable:
   - **Batch Size**: Cuántos registros procesar (default: 10)
   - **Delay**: Tiempo entre requests (default: 1000ms)

#### **Limpiar Registros Vacíos**
1. En la misma tarjeta, click en "🗑️ Limpiar Sin Contenido"
2. Elimina todos los registros con categoría "Pendiente" que no tengan contenido en la columna "Publicar"
3. Útil para mantener la DB limpia

### **4. Visualización de Gráficas (`/charts-test`)**

- Página de prueba con ejemplos de TradingView Lightweight Charts
- Útil para diseñadores y desarrolladores
- Muestra capacidades de visualización avanzada

### **5. Documentación de APIs**

#### **SwaggerUI Interactivo (`/api-docs`)**
- Documentación completa de todos los endpoints
- Probar APIs directamente desde el navegador
- Ver schemas, parámetros y respuestas

#### **Documentación Simple (`/api-docs-simple`)**
- Versión HTML estática
- Más rápida de cargar
- Útil para referencia rápida

---

## 🔌 APIs y Endpoints

### **Autenticación**
Actualmente no hay autenticación. **Roadmap**: Implementar JWT en v2.0.

### **Endpoints Principales**

#### **1. Publicaciones**

##### `GET /api/publicaciones`
Obtener publicaciones con filtros y paginación.

**Query Parameters:**
```typescript
{
  red?: 'Instagram' | 'Facebook'
  perfil?: string
  categoria?: string
  tipoPublicacion?: string
  fechaInicio?: string  // ISO 8601
  fechaFin?: string     // ISO 8601
  limit?: number        // default: 100, max: 50000
  offset?: number       // default: 0
  sortBy?: 'fecha' | 'impresiones' | 'alcance'
  sortOrder?: 'asc' | 'desc'
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "ID": "123",
      "Fecha": "2025-10-07T09:30:00.000Z",
      "Red": "Instagram",
      "Tipo de publicación": "Publicar",
      "Perfil": "alcaldiadecali",
      "categoria": "SEGURIDAD",
      "Impresiones": 5000,
      "Alcance": 3000,
      "Me gusta": 150,
      // ... más campos
    }
  ],
  "meta": {
    "total": 18000,
    "limit": 100,
    "offset": 0,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### **2. Upload CSV**

##### `POST /api/upload-csv`
Subir y procesar archivo CSV.

**Form Data:**
```typescript
{
  file: File          // CSV file
  overwrite: boolean  // Si true, actualiza duplicados
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "cmgef21oo0000z8mgpcj9z315",
  "inserted": 1350,
  "updated": 0,
  "errors": 0,
  "duplicates": 50,
  "excludedHistorias": 23,
  "message": "CSV procesado correctamente"
}
```

#### **3. CSV Sessions**

##### `GET /api/csv-sessions`
Listar sesiones de carga CSV.

**Query Parameters:**
```typescript
{
  limit?: number    // default: 20
  offset?: number   // default: 0
  status?: 'completed' | 'partial' | 'error'
}
```

**Response:**
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
      "detectedColumns": ["ID", "Fecha", "Red", "Perfil", "categoria"]
    }
  ],
  "stats": {
    "totalSessions": 45,
    "totalRecords": 18000,
    "pendingRecords": 234
  },
  "meta": {
    "total": 45,
    "limit": 20,
    "offset": 0
  }
}
```

##### `GET /api/csv-sessions/[id]`
Obtener detalle de una sesión específica.

#### **4. Categorización con IA**

##### `POST /api/categorize-pending`
Categorizar registros pendientes con GPT-5.

**Body:**
```json
{
  "batchSize": 10,
  "delayMs": 1000
}
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalProcessed": 10,
    "successful": 9,
    "errors": 1,
    "categorized": {
      "SEGURIDAD": 3,
      "TRANSPARENCIA PÚBLICA": 4,
      "INVERTIR PARA CRECER": 2
    }
  },
  "processingTime": "12.5s"
}
```

#### **5. Limpieza de Registros**

##### `DELETE /api/cleanup-pending`
Eliminar registros pendientes sin contenido.

**Response:**
```json
{
  "success": true,
  "stats": {
    "eliminatedCount": 23,
    "totalPendientesAntes": 234,
    "totalPendientesDespues": 211
  },
  "eliminatedRecords": ["id1", "id2", "id3"]
}
```

#### **6. OpenAPI Spec**

##### `GET /api/docs`
Obtener especificación OpenAPI 3.0 completa en JSON.

---

### **Manejo de Errores**

Todas las APIs siguen el mismo formato de error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Descripción del error",
    "details": {
      "field": "categoria",
      "issue": "Campo requerido"
    }
  }
}
```

**Códigos de Estado HTTP:**
- `200`: Éxito
- `201`: Creado exitosamente
- `400`: Error de validación
- `409`: Conflicto (duplicados)
- `422`: Datos no procesables
- `500`: Error interno del servidor

---

## 💾 Base de Datos

### **Tecnología**
- **Desarrollo**: SQLite (archivo `prisma/dev.db`)
- **Producción (recomendado)**: PostgreSQL

### **Modelos Prisma**

#### **Publicacion**
```prisma
model Publicacion {
  id              String   @id
  fecha           DateTime
  red             String
  perfil          String
  categoria       String
  tipoPublicacion String   @default("Publicar")
  publicar        String?
  impresiones     Int      @default(0)
  alcance         Int      @default(0)
  meGusta         Int      @default(0)
  comentarios     Int      @default(0)
  compartidos     Int      @default(0)
  guardados       Int      @default(0)
  
  csvSessionId    String?
  csvSession      CsvSession? @relation(fields: [csvSessionId], references: [id])
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([red])
  @@index([perfil])
  @@index([categoria])
  @@index([fecha])
  @@map("publicaciones")
}
```

#### **CsvSession**
```prisma
model CsvSession {
  id                String        @id @default(cuid())
  fileName          String
  uploadedAt        DateTime      @default(now())
  status            String        @default("completed")
  totalRows         Int           @default(0)
  insertedRows      Int           @default(0)
  updatedRows       Int           @default(0)
  errorRows         Int           @default(0)
  duplicateRows     Int           @default(0)
  excludedHistorias Int           @default(0)
  detectedColumns   String?
  errorDetails      String?
  
  publicaciones     Publicacion[]
  
  @@map("csv_sessions")
}
```

### **Índices**
Para optimizar queries, se tienen índices en:
- `red`
- `perfil`
- `categoria`
- `tipoPublicacion`
- `fecha`
- `csvSessionId`

### **Migraciones**

#### **Aplicar Migraciones**
```bash
npx prisma db push
```

#### **Crear Nueva Migración**
```bash
npx prisma migrate dev --name descripcion_cambio
```

#### **Ver Base de Datos**
```bash
npx prisma studio
```

### **Backup y Restore**

#### **Backup (SQLite)**
```bash
cp prisma/dev.db prisma/backup_$(date +%Y%m%d).db
```

#### **Restore (SQLite)**
```bash
cp prisma/backup_20251007.db prisma/dev.db
```

---

## 🎨 Sistema de Diseño

### **Paleta de Colores**

```css
:root {
  /* Colores principales */
  --primary: #6366f1;      /* Indigo 500 */
  --primary-dark: #4f46e5; /* Indigo 600 */
  --secondary: #8b5cf6;    /* Violet 500 */
  
  /* Colores de fondo */
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;
  
  /* Colores de texto */
  --text-primary: #0f172a;
  --text-secondary: #64748b;
  --text-tertiary: #94a3b8;
  
  /* Colores de estado */
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;
}
```

### **Tipografía**

```css
/* Familia de fuentes */
font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 
             'Segoe UI', Roboto, sans-serif;

/* Escalado de tamaños */
--text-xs: 12px;
--text-sm: 14px;
--text-base: 16px;
--text-lg: 18px;
--text-xl: 20px;
--text-2xl: 24px;
--text-3xl: 30px;

/* Pesos */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### **Espaciado**

Sistema de espaciado en múltiplos de 4px:
- `4px`, `8px`, `12px`, `16px`, `20px`, `24px`, `32px`, `40px`, `48px`, `64px`

### **Componentes UI**

#### **Botones**
```css
.btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
}

.btn-secondary {
  background: #f1f5f9;
  color: #0f172a;
}
```

#### **Cards**
```css
.card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
```

#### **Inputs**
```css
.input {
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.input:focus {
  border-color: #6366f1;
  outline: none;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}
```

### **Responsive Breakpoints**

```css
/* Mobile First */
@media (min-width: 640px)  { /* sm */ }
@media (min-width: 768px)  { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
```

---

## 🧪 Testing

### **Estructura de Tests (Futura)**

```
tests/
├── unit/
│   ├── utils/
│   │   ├── parseNumber.test.ts
│   │   └── normalizeCategory.test.ts
│   └── hooks/
│       └── usePublicaciones.test.ts
├── integration/
│   └── api/
│       ├── publicaciones.test.ts
│       └── upload-csv.test.ts
└── e2e/
    ├── dashboard.spec.ts
    └── csv-upload.spec.ts
```

### **Scripts de Testing Manual**

En `/test/`:
- `test-gpt-categorization.js`: Probar GPT-5 en terminal
- `test-api-categorize.js`: Probar endpoint de categorización
- `test-cleanup-api.js`: Probar endpoint de limpieza

**Uso:**
```bash
node test/test-gpt-categorization.js
```

---

## 🚀 Despliegue

### **Vercel (Recomendado)**

#### **1. Conectar Repositorio**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

#### **2. Configurar Variables de Entorno**
En Vercel Dashboard → Settings → Environment Variables:
```
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-proj-...
```

#### **3. Configurar Build**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

### **Docker (Alternativa)**

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

**Build y Run:**
```bash
docker build -t andi-dashboard .
docker run -p 3000:3000 -e DATABASE_URL="..." andi-dashboard
```

### **PostgreSQL en Producción**

1. Crear base de datos en Neon, Supabase, o Render
2. Actualizar `DATABASE_URL` en `.env`
3. Cambiar provider en `schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
4. Aplicar migraciones:
   ```bash
   npx prisma migrate deploy
   ```

---

## 🔮 Roadmap

### **v1.1 - Optimización (Q4 2025)**
- [ ] **Backend Aggregation**: Mover cálculos del mosaico al servidor
- [ ] **Redis Caching**: Implementar caché de datos agregados
- [ ] **Pagination Mejorada**: Infinite scroll en tablas
- [ ] **Dark Mode**: Tema oscuro

### **v1.2 - Analytics Avanzado (Q1 2026)**
- [ ] **Comparación de Perfiles**: Vista lado a lado de 2+ perfiles
- [ ] **Exportación Excel**: Exportar tablas a XLSX
- [ ] **Gráficas Interactivas**: Zoom, pan, tooltips avanzados
- [ ] **Trends Dashboard**: Análisis de tendencias temporales

### **v2.0 - Escalabilidad (Q2 2026)**
- [ ] **Autenticación JWT**: Sistema de usuarios y roles
- [ ] **PostgreSQL**: Migración completa a PostgreSQL
- [ ] **Rate Limiting**: Protección de APIs
- [ ] **Webhooks**: Notificaciones en tiempo real
- [ ] **API Pública**: Documentación para terceros

### **v3.0 - Machine Learning (Q3 2026)**
- [ ] **Predicción de Engagement**: ML para predecir impacto
- [ ] **Recomendaciones**: Sugerencias de categorías y contenido
- [ ] **Análisis de Sentimiento**: NLP para analizar comentarios
- [ ] **Detección de Anomalías**: Alertas automáticas

---

## 👥 Equipo y Contribuciones

### **Autor Principal**
- **Desarrollador Original**: [Tu Nombre]
- **Contacto**: [Tu Email]

### **Cómo Contribuir**

1. **Fork el repositorio**
2. **Crea una rama para tu feature**
   ```bash
   git checkout -b feature/nueva-funcionalidad
   ```
3. **Commit tus cambios**
   ```bash
   git commit -m "feat: descripción de la funcionalidad"
   ```
4. **Push a tu fork**
   ```bash
   git push origin feature/nueva-funcionalidad
   ```
5. **Abre un Pull Request**

### **Convenciones de Commits**

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `docs:` Cambios en documentación
- `style:` Cambios de formato (no afectan el código)
- `refactor:` Refactorización de código
- `test:` Agregar o modificar tests
- `chore:` Cambios en build, deps, etc.

**Ejemplos:**
```
feat: añadir exportación a Excel en tabla de perfiles
fix: corregir cálculo de porcentaje en mosaico
docs: actualizar README con instrucciones de despliegue
```

### **Código de Conducta**

- Ser respetuoso y profesional
- Proveer feedback constructivo
- Priorizar la calidad del código
- Documentar todos los cambios significativos

---

## 📞 Soporte

### **Reportar Bugs**
Abre un issue en GitHub con:
- Descripción clara del problema
- Pasos para reproducirlo
- Comportamiento esperado vs actual
- Screenshots si aplica
- Versión de Node.js y navegador

### **Solicitar Funcionalidades**
Abre un issue con etiqueta `enhancement`:
- Descripción detallada de la funcionalidad
- Casos de uso
- Mockups o ejemplos si es posible

### **Documentación Adicional**
- [TECHNICAL_DOCS.md](./TECHNICAL_DOCS.md): Detalles técnicos profundos
- [docs/API_REFERENCE.md](./docs/API_REFERENCE.md): Referencia completa de APIs
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md): Arquitectura del sistema
- [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md): Guía de despliegue detallada

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

---

## 🙏 Agradecimientos

- **Next.js Team**: Por el increíble framework
- **Prisma Team**: Por el mejor ORM de TypeScript
- **TradingView**: Por las gráficas de alta calidad
- **OpenAI**: Por la API de GPT-5
- **Comunidad Open Source**: Por todas las librerías utilizadas

---

**¿Preguntas? ¿Sugerencias? ¿Encontraste un bug?**

👉 [Abre un issue](https://github.com/your-repo/issues)  
👉 [Contribuye al proyecto](#-equipo-y-contribuciones)  
👉 [Lee la documentación técnica](./TECHNICAL_DOCS.md)

---

<div align="center">

**Hecho con ❤️ usando Next.js, TypeScript y Prisma**

⭐ Si este proyecto te fue útil, considera darle una estrella en GitHub!

</div>
