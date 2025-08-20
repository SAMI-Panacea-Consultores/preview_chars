# 📝 Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere al [Versionado Semántico](https://semver.org/lang/es/).

## [2.0.0] - 2025-01-XX

### 🚀 API First Architecture - Major Release

#### ✨ Nuevas Funcionalidades Principales
- **🔌 API First Architecture**: Migración completa a arquitectura API-first
- **📚 Documentación OpenAPI/Swagger**: Documentación interactiva completa
- **✅ Validación con Zod**: Validación robusta de tipos TypeScript-first
- **💾 Base de Datos Prisma**: Persistencia con SQLite y ORM Prisma
- **🔄 Manejo de Duplicados**: Detección y gestión inteligente de duplicados CSV
- **📊 Paginación Avanzada**: Endpoints con paginación y filtros avanzados
- **🎯 APIs RESTful**: Endpoints estructurados y documentados

#### 🔧 APIs Implementadas
- **`POST /api/upload-csv`**: Carga de archivos CSV con validación
- **`GET /api/publicaciones`**: Consulta de publicaciones con filtros
- **`GET /api/docs`**: Especificación OpenAPI completa
- **Documentación Interactiva**: `/api-docs` (SwaggerUI) y `/api-docs-simple`

#### 💾 Persistencia y Base de Datos
- **SQLite + Prisma**: Base de datos relacional con ORM type-safe
- **Migración desde localStorage**: Datos ahora persisten en base de datos
- **Índices Optimizados**: Consultas eficientes por red, perfil, categoría, fecha
- **Gestión de Duplicados**: Detección por ID único con opciones de sobrescritura

#### 🎨 Mejoras de UI/UX
- **🏗️ Componentes Modulares**: `CSVUploader`, `CSVStatusBanner` separados
- **📍 Estado en Tiempo Real**: Banner flotante con progreso de carga CSV
- **🎛️ Controles Reorganizados**: Botón "Cargar CSV" movido al header
- **📤 Exportación de Imágenes**: Exportar gráficas como PNG en páginas de detalle
- **🎨 UI Minimalista**: Rediseño de la sección "Configuración"

#### ⚡ Performance y Optimización
- **🧠 Custom Hooks**: `useCSVUpload`, `usePublicaciones` para lógica reutilizable
- **📊 Agregaciones Optimizadas**: Cálculos del lado del servidor
- **🎯 Consultas Eficientes**: Filtros y ordenamiento a nivel de base de datos
- **💨 Carga Asíncrona**: Mejor experiencia de usuario durante operaciones

#### 🔒 Validación y Seguridad
- **✅ Esquemas Zod**: Validación completa de entrada y salida
- **🛡️ Manejo de Errores**: Respuestas estructuradas y consistentes
- **🔍 Validación de Archivos**: Verificación de formato y estructura CSV
- **📋 Logs Estructurados**: Trazabilidad completa de operaciones

#### 🛠️ Dependencias Nuevas
```json
{
  "prisma": "^5.22.0",
  "@prisma/client": "^5.22.0", 
  "zod": "^3.23.8",
  "swagger-jsdoc": "^6.2.8",
  "html2canvas": "^1.4.1"
}
```

#### 📁 Nuevos Archivos Creados
- `src/app/api/docs/route.ts` - Endpoint de especificación OpenAPI
- `src/app/api/publicaciones/route.ts` - API principal de datos
- `src/app/api/upload-csv/route.ts` - API de carga CSV
- `src/app/api-docs/page.tsx` - SwaggerUI interactivo
- `src/app/api-docs-simple/page.tsx` - Documentación HTML
- `src/components/CSVUploader.tsx` - Componente de carga
- `src/components/CSVStatusBanner.tsx` - Banner de estado
- `src/hooks/useCSVUpload.ts` - Hook para carga CSV
- `src/hooks/usePublicaciones.ts` - Hook para datos
- `src/lib/api-utils.ts` - Utilidades de API
- `src/lib/prisma.ts` - Cliente Prisma
- `src/lib/schemas.ts` - Esquemas Zod
- `src/lib/swagger.ts` - Configuración OpenAPI
- `prisma/schema.prisma` - Esquema de base de datos
- `.env` - Variables de entorno

#### 🔄 Migraciones y Cambios Breaking
- **⚠️ BREAKING**: localStorage ya no es la fuente principal de datos
- **⚠️ BREAKING**: Estructura de datos cambió para incluir IDs únicos
- **⚠️ BREAKING**: URLs de API cambiaron de cliente a servidor
- **✅ COMPATIBLE**: Interfaz de usuario mantiene funcionalidad existente
- **✅ COMPATIBLE**: Formato CSV sigue siendo el mismo

#### 🐛 Correcciones de v2.0.0
- **Styled-jsx Errors**: Eliminados errores de compilación en páginas de documentación
- **SwaggerUI Loading**: Mejorado manejo de errores de carga CDN
- **Date Parsing**: Corregido parsing de fechas M/D/YYYY H:MM am/pm
- **Duplicate Handling**: Implementado manejo robusto de duplicados
- **Memory Issues**: Solucionado QuotaExceededError con base de datos
- **Type Safety**: Eliminados errores de TypeScript con validación Zod

#### 📊 Estadísticas v2.0.0
- **Archivos nuevos**: 15
- **APIs implementadas**: 3
- **Esquemas Zod**: 8
- **Custom Hooks**: 2
- **Componentes nuevos**: 2
- **Líneas de código agregadas**: ~4,000
- **Dependencias nuevas**: 5

#### 🎯 URLs de Documentación
- **SwaggerUI**: `/api-docs`
- **Documentación HTML**: `/api-docs-simple` 
- **OpenAPI JSON**: `/api/docs`
- **GitHub**: `https://github.com/SAMI-Panacea-Consultores/preview_chars`

## [1.0.0] - 2025-01-15

### 🎉 Versión Inicial (Legacy)

#### ✨ Agregado
- **Dashboard Principal** con cuatro modos de visualización:
  - Vista Global: Resumen por red social
  - Vista por Perfil: Análisis específico de un perfil
  - Vista Mosaico: Grid comparativo de todos los perfiles
  - Vista Comparación: Comparación directa entre dos perfiles
- **Carga de CSV** con procesamiento automático usando PapaParse
- **Gráficas Interactivas** usando Recharts:
  - Gráficas circulares (pie charts) para distribución de categorías
  - Gráficas de líneas para tendencias temporales
  - Tooltips personalizados estilo Apple
- **Filtros Avanzados**:
  - Filtro por rango de fechas
  - Selector de red social
  - Ordenamiento por publicaciones o impacto (impresiones)
- **Página de Detalle por Perfil** (`/perfil/[red]/[perfil]`):
  - Sección "Eficiencia por Categoría" con análisis de impacto
  - Resumen general con métricas totales
  - Gráficas de líneas para tendencias diarias
  - Gráfica circular de distribución de publicaciones
- **Diseño Apple-Style**:
  - Efectos glassmorphism con backdrop-filter
  - Gradientes azules multi-capa
  - Tipografía SF Pro Display
  - Sombras sutiles y transiciones suaves
- **Scroll Horizontal** para secciones con múltiples elementos
- **Persistencia de Datos** usando localStorage
- **Navegación Fluida** entre dashboard y páginas de detalle

#### 🧮 Lógica de Datos
- **División Proporcional** de métricas en publicaciones multi-categoría
- **Normalización Automática** de categorías del CSV
- **Parsing de Números** con formato de miles (comas como separadores)
- **Parsing de Fechas** en formato americano (M/D/YYYY H:MM am/pm)
- **Agregaciones Inteligentes** por red, perfil y categoría

#### 🎨 Sistema de Diseño
- **Paleta de Colores Apple**:
  - SEGURIDAD: #007AFF (System Blue)
  - INVERTIR PARA CRECER: #34C759 (System Green)
  - TRANSPARENCIA PÚBLICA: #5856D6 (System Purple)
  - Error en procesamiento: #FF3B30 (System Red)
  - Sin categoría: #8E8E93 (System Gray)
- **Variables CSS** para espaciado, colores y efectos
- **Responsive Design** con breakpoints móvil/tablet/desktop
- **Animaciones CSS** con keyframes personalizados

#### 🔧 Configuración Técnica
- **Next.js 14** con App Router
- **TypeScript** para type safety
- **Recharts** para visualizaciones
- **PapaParse** para procesamiento CSV
- **ESLint** para calidad de código

#### 📊 Métricas Soportadas
- **Impresiones**: Número total de visualizaciones
- **Alcance**: Número de usuarios únicos alcanzados
- **Me gusta**: Número de reacciones positivas
- **Publicaciones**: Conteo de posts por categoría

#### 🗂️ Categorías Soportadas
- SEGURIDAD
- INVERTIR PARA CRECER
- TRANSPARENCIA PÚBLICA
- Error en procesamiento
- Sin categoría (para datos sin categorizar)

### 🐛 Correcciones

#### Problemas Resueltos en Desarrollo
- **Duplicación de Impresiones**: Solucionado mediante división proporcional en publicaciones multi-categoría
- **Normalización de Categorías**: Corregido el orden de reglas regex para capturar correctamente "INVERTIR PARA CRECER"
- **Parsing de Números**: Implementado manejo de comas como separadores de miles
- **Navegación Perdida**: Solucionado con persistencia en localStorage
- **Overflow de Leyendas**: Implementado scroll horizontal para contenido que no cabe
- **Orden de Categorías**: "Sin categoría" ahora aparece siempre al final
- **Layout de Métricas**: Cambiado de grid horizontal a layout vertical para mejor visualización

### 🔄 Cambios Técnicos

#### Refactorizaciones Importantes
- **Migración de Chart.js a Recharts**: Mayor compatibilidad con React y mejores animaciones
- **Eliminación de Tailwind CSS**: Cambio a CSS puro para mayor control y estabilidad
- **Reorganización de Funciones**: Separación clara entre agregación de publicaciones y cálculo de impacto
- **Optimización de useMemo**: Memoización de cálculos pesados para mejor performance

#### Estructura de Archivos
```
src/app/
├── globals.css              # Estilos globales Apple-style
├── layout.tsx               # Layout principal con metadatos
├── page.tsx                 # Dashboard principal (987 líneas)
└── perfil/[red]/[perfil]/
    └── page.tsx             # Página de detalle (900+ líneas)
```

### 📚 Documentación
- **README.md**: Documentación completa para usuarios finales
- **TECHNICAL_DOCS.md**: Documentación técnica para desarrolladores
- **PROJECT_CONFIG.md**: Configuraciones y setup del proyecto
- **CHANGELOG.md**: Historial de cambios y versiones

## [Futuras Versiones]

### 🔮 Roadmap v2.1.0 - Mejoras y Optimizaciones
- [ ] **PostgreSQL Migration**: Migrar de SQLite a PostgreSQL para producción
- [ ] **Redis Caching**: Implementar cache con Redis para mejor performance
- [ ] **Rate Limiting**: Protección de APIs con límites de requests
- [ ] **Metrics & Monitoring**: Dashboard de métricas de APIs
- [ ] **Bulk Operations**: Carga masiva de múltiples archivos CSV

### 🔮 Roadmap v2.2.0 - Funcionalidades Avanzadas  
- [ ] **Autenticación JWT**: Sistema de usuarios y roles
- [ ] **Webhooks**: Notificaciones automáticas de cambios
- [ ] **Reportes PDF**: Exportación automática de reportes
- [ ] **Filtros Avanzados**: Búsqueda por texto y rangos numéricos
- [ ] **Dashboard Admin**: Panel de administración de datos

### 🔮 Roadmap v3.0.0 - Escalabilidad Empresarial
- [ ] **Microservicios**: Arquitectura distribuida
- [ ] **GraphQL**: API GraphQL junto con REST
- [ ] **Real-time Updates**: WebSockets para actualizaciones en vivo
- [ ] **Machine Learning**: Análisis predictivo y tendencias
- [ ] **Multi-tenant**: Soporte para múltiples organizaciones
- [ ] **API Gateway**: Gateway centralizado con balanceador

### ✅ Completado en v2.0.0
- [x] **API REST completa** ✅
- [x] **Base de datos para persistencia** ✅ 
- [x] **Documentación OpenAPI/Swagger** ✅
- [x] **Validación robusta** ✅
- [x] **Exportar gráficas como imágenes** ✅

---

## 📋 Formato de Versionado

Este proyecto sigue [Versionado Semántico](https://semver.org/lang/es/):

- **MAJOR** (X.0.0): Cambios incompatibles en la API
- **MINOR** (1.X.0): Nueva funcionalidad compatible hacia atrás
- **PATCH** (1.1.X): Corrección de bugs compatible hacia atrás

## 🏷️ Tipos de Cambios

- **✨ Agregado**: Para nuevas funcionalidades
- **🔄 Cambiado**: Para cambios en funcionalidades existentes
- **❌ Deprecado**: Para funcionalidades que serán removidas
- **🗑️ Removido**: Para funcionalidades removidas
- **🐛 Corregido**: Para corrección de bugs
- **🔒 Seguridad**: Para vulnerabilidades de seguridad

## 📊 Estadísticas del Proyecto

### Líneas de Código (v1.0.0)
- **Total**: ~2,000 líneas
- **TypeScript**: ~1,900 líneas
- **CSS**: ~800 líneas
- **Documentación**: ~1,500 líneas

### Archivos Principales
- `src/app/page.tsx`: 987 líneas (Dashboard principal)
- `src/app/perfil/[red]/[perfil]/page.tsx`: 900+ líneas (Página de detalle)
- `src/app/globals.css`: 800 líneas (Estilos globales)

### Funcionalidades Implementadas
- ✅ 4 modos de visualización
- ✅ 5 tipos de gráficas
- ✅ 6 filtros diferentes
- ✅ 3 métricas principales
- ✅ 5 categorías soportadas
- ✅ Diseño responsive completo
- ✅ Persistencia de datos
- ✅ Navegación fluida

---

**Mantenido por**: Equipo de Desarrollo Dashboard
**Última actualización**: Enero 2025
