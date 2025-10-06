# 📁 CSV Sessions - Sistema de Gestión de Cargas

## Descripción
Sistema completo para gestionar, monitorear y auditar cargas de archivos CSV con seguimiento de estados, manejo de duplicados y categorización inteligente.

## 🚀 Características Principales

### ✨ Dashboard de Estadísticas
- **Total de sesiones** procesadas
- **Sesiones completadas/fallidas** con indicadores visuales
- **Registros procesados** globalmente
- **Duplicados no subidos** para revisión
- **Registros pendientes** de categorización

### 📊 Gestión Inteligente de Datos
- **Categorización automática**:
  - Sin columna "categoría" → `"Pendiente"`
  - Columna vacía → `"Sin categoría"`
  - Con valores → Categorías normalizadas
- **Detección de duplicados** con confirmación
- **Exclusión automática** de publicaciones tipo "Historia"

### 🤖 Categorización Automática con GPT-5
- **Procesamiento Inteligente**: Categoriza registros "Pendiente" usando GPT-5
- **Prompt Gubernamental**: Análisis especializado para contenido de Cali
- **Categorías Detectadas**:
  - 🔒 **SEGURIDAD**: Seguridad ciudadana, prevención del delito
  - 📋 **TRANSPARENCIA PÚBLICA**: Rendición de cuentas, gestión pública
  - 🏗️ **INVERTIR PARA CRECER**: Proyectos de infraestructura del alcalde Eder
  - ❓ **N/A**: Contenido que no encaja en categorías principales
- **Procesamiento en Lotes**: Configuración de velocidad y cantidad
- **Estadísticas en Tiempo Real**: Progreso y resultados inmediatos

### 🧹 Sistema de Limpieza de Datos
- **Limpieza Inteligente**: Elimina registros pendientes sin contenido
- **Seguridad**: Solo elimina registros que no pueden ser procesados
- **Estadísticas Detalladas**: Reporte completo de limpieza
- **Un Clic**: Operación simple desde la interfaz

### 🔍 Filtros y Búsqueda
- Filtro por **estado** (completed, failed, processing, partial)
- Búsqueda por **nombre de archivo**
- Filtros por **rango de fechas**
- **Paginación** configurable

### 📱 Interfaz Moderna
- **Diseño responsivo** mobile-first
- **Indicadores visuales** claros por estado
- **Navegación intuitiva** entre sesiones
- **Integración de uploader** en la misma página

## 🛠️ Estructura del Sistema

```
/csv-sessions/
├── page.tsx              # Página principal con lista y estadísticas
├── [id]/
│   └── page.tsx          # Página de detalle de sesión específica
└── components/
    └── CSVUploader.tsx   # Componente de carga integrado

/api/csv-sessions/
├── route.ts              # GET: Lista paginada con filtros
└── [id]/
    └── route.ts          # GET: Detalle de sesión específica

/api/upload-csv/
└── route.ts              # POST: Procesamiento de archivos CSV
```

## 📋 Estados de Sesión

| Estado | Descripción | Color |
|--------|-------------|-------|
| `processing` | En proceso de carga | 🔵 Azul |
| `completed` | Completada exitosamente | 🟢 Verde |
| `failed` | Falló durante procesamiento | 🔴 Rojo |
| `partial` | Completada con duplicados | 🟠 Naranja |

## 🔄 Flujo de Procesamiento

1. **Selección de archivo** → Validación inicial
2. **Creación de sesión** → Parseo con Papa Parse
3. **Validación de estructura** → Detección de columnas
4. **Procesamiento de filas** → Aplicación de reglas de negocio
5. **Detección de duplicados** → Confirmación si es necesario
6. **Inserción en BD** → Actualización de estadísticas
7. **Finalización** → Estado final y métricas

## 🎯 Casos de Uso

### Para Administradores
- **Monitorear** estado de todas las cargas
- **Identificar** problemas de procesamiento
- **Gestionar** duplicados y conflictos
- **Revisar** registros pendientes de categorización

### Para Analistas
- **Analizar** patrones de errores
- **Optimizar** formatos de CSV
- **Monitorear** calidad de datos
- **Generar** reportes de procesamiento

### Para Usuarios Finales
- **Subir** archivos CSV fácilmente
- **Ver** progreso de procesamiento
- **Recibir** feedback sobre duplicados
- **Acceder** al historial de cargas

## 🚨 Manejo de Errores

### Errores Comunes
- **Archivo inválido**: Formato no CSV o corrupto
- **Estructura incorrecta**: Faltan columnas requeridas
- **Duplicados detectados**: Requiere confirmación
- **Timeout de procesamiento**: Archivo muy grande
- **Error de base de datos**: Problemas de conexión

### Recuperación
- **Reintentos automáticos** para errores temporales
- **Estados parciales** para duplicados
- **Logs detallados** para debugging
- **Limpieza automática** de sesiones colgadas

## 📊 Métricas y KPIs

### Por Sesión
- **Tasa de éxito**: (Insertados + Actualizados) / Total
- **Tasa de error**: Errores / Total
- **Tasa de duplicados**: Duplicados / Total
- **Tiempo de procesamiento**: Duración total
- **Throughput**: Registros por segundo

### Globales
- **Volumen total** de registros procesados
- **Distribución de estados** de sesiones
- **Tendencias temporales** de cargas
- **Categorías más frecuentes**
- **Perfiles más activos**

## 🔧 Configuración

### Variables de Entorno
```env
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_MAX_FILE_SIZE=10485760  # 10MB
NEXT_PUBLIC_MAX_ROWS_PER_BATCH=1000
```

### Límites del Sistema
- **Tamaño máximo de archivo**: 10MB
- **Registros por página**: 20 (configurable hasta 100)
- **Timeout de procesamiento**: 5 minutos
- **Retención de sesiones**: Ilimitada (configurable)

## 🚀 Inicio Rápido

### 1. Acceder al Sistema
```bash
http://localhost:3000/csv-sessions
```

### 2. Subir un Archivo
1. Hacer clic en "📤 Subir Nuevo Archivo CSV"
2. Seleccionar archivo o arrastrar
3. Esperar procesamiento
4. Revisar resultados en la tabla

### 3. Monitorear Estado
- Ver **tarjetas de estadísticas** para resumen global
- Usar **filtros** para encontrar sesiones específicas
- Hacer clic en **"Ver Detalles"** para información completa

### 4. Gestionar Duplicados
1. Identificar sesiones con estado **"partial"**
2. Revisar detalles de duplicados
3. Decidir si re-procesar con `overwrite=true`

## 📚 API Reference

### GET `/api/csv-sessions`
```typescript
// Parámetros
{
  page?: number;        // Página (default: 1)
  limit?: number;       // Por página (default: 20)
  status?: string;      // Filtro estado
  fileName?: string;    // Búsqueda nombre
  startDate?: string;   // Fecha inicio
  endDate?: string;     // Fecha fin
}

// Respuesta
{
  success: boolean;
  data: CsvSession[];
  pagination: PaginationInfo;
  stats: GlobalStats;
}
```

### GET `/api/csv-sessions/[id]`
```typescript
// Respuesta
{
  success: boolean;
  data: {
    // Información completa de la sesión
    id: string;
    fileName: string;
    status: SessionStatus;
    // ... más campos
  };
}
```

## 🤝 Contribuir

### Reportar Bugs
1. Verificar que no exista ya el issue
2. Incluir pasos para reproducir
3. Adjuntar logs relevantes
4. Especificar entorno (OS, browser, etc.)

### Solicitar Features
1. Describir el caso de uso
2. Explicar el beneficio esperado
3. Proponer implementación si es posible
4. Considerar impacto en performance

### Desarrollo
1. Fork del repositorio
2. Crear branch para feature/bugfix
3. Seguir convenciones de código
4. Añadir tests si es necesario
5. Crear pull request con descripción detallada

---

## 📞 Soporte

Para soporte técnico o preguntas sobre el sistema:
- **Documentación completa**: `docs/CSV_SESSIONS_COMPONENT.md`
- **Issues**: GitHub Issues del repositorio
- **Wiki**: Documentación adicional en el wiki del proyecto

---

*Sistema desarrollado con Next.js, Prisma, y SQLite*  
*Versión: 1.0.0 | Última actualización: $(date)*
