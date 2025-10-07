# 📁 CSV Sessions - Changelog

Todas las mejoras y cambios importantes del componente CSV Sessions se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-10-06

### 🤖 Categorización Automática con GPT-5
- **Nuevo API Endpoint**: `/api/categorize-pending` para procesamiento automático de registros pendientes
- **Integración GPT-5**: Conexión con `gpt-5-chat-latest` usando endpoint `/v1/responses`
- **Prompt Gubernamental**: Prompt especializado para análisis de contenido gubernamental de Cali
- **Procesamiento en Lotes**: Configuración de `batchSize` y `delayMs` para optimizar requests
- **Hook Frontend**: `useCategorizePending` para integración con la interfaz

### 🧹 Sistema de Limpieza de Datos
- **Nuevo API Endpoint**: `/api/cleanup-pending` para eliminar registros sin contenido
- **Limpieza Inteligente**: Elimina solo registros con `categoria = 'Pendiente'` y `publicar IS NULL`
- **Hook Frontend**: `useCleanupPending` para operaciones de limpieza desde la UI
- **Estadísticas Detalladas**: Reporte completo de registros eliminados y conservados

### 🎨 Mejoras de Interfaz
- **Botón GPT-5**: "🤖 Procesar con GPT-5" en la tarjeta de Registros Pendientes
- **Botón Limpieza**: "🗑️ Limpiar Sin Contenido" para registros no procesables
- **Estados de Carga**: Spinners animados durante procesamiento y limpieza
- **Resultados en Tiempo Real**: Estadísticas inmediatas de éxito/errores
- **Diseño Moderno**: Gradientes, animaciones y efectos hover mejorados

### 📊 Categorías Detectadas por GPT-5
- **SEGURIDAD**: Seguridad ciudadana, prevención del delito, orden público
- **TRANSPARENCIA PÚBLICA**: Rendición de cuentas, gestión pública, procesos administrativos
- **INVERTIR PARA CRECER**: Proyectos de infraestructura y desarrollo del alcalde Alejandro Eder
- **N/A**: Publicaciones que no encajan en las categorías principales

### 🔧 Mejoras Técnicas
- **Manejo de Errores**: Sistema robusto de error handling y logging
- **Documentación Swagger**: APIs completamente documentadas
- **Validación de Datos**: Schemas Zod para validación de requests
- **Optimización de Performance**: Delays configurables para no saturar OpenAI API
- **Estadísticas Avanzadas**: Métricas detalladas de procesamiento

### 🧪 Testing y Validación
- **Scripts de Prueba**: `test-gpt-categorization.js`, `test-api-categorize.js`, `test-cleanup-api.js`
- **Verificación Completa**: Procesamiento exitoso de 773+ registros pendientes
- **Limpieza Verificada**: Eliminación exitosa de 23 registros sin contenido
- **Base de Datos Limpia**: 0 registros pendientes después del procesamiento completo

## [1.1.0] - 2025-10-06

### 🆕 Nuevas Funcionalidades
- **Nueva Columna "Publicar"**: Añadida columna `publicar` al esquema de base de datos para guardar el contenido de la columna "Publicar" de los CSVs
- **Detección Automática**: El sistema ahora detecta automáticamente la columna "Publicar" en los CSVs subidos
- **Migración de Base de Datos**: Aplicada migración para añadir la nueva columna sin afectar datos existentes

### 🔧 Mejoras Técnicas
- Actualizado el procesamiento CSV para incluir la nueva columna en `publicacionesToInsert`
- Mejorada la documentación del API para reflejar el nuevo campo "Publicar"
- Añadida validación y manejo de la columna "Publicar" en el endpoint `/api/upload-csv`
- Actualizado el mapeo de columnas detectadas para incluir `publicarKey`

### 📋 Cambios en el Esquema
```sql
ALTER TABLE publicaciones ADD COLUMN publicar TEXT;
```

## [1.0.0] - 2025-10-06

### 🎉 Lanzamiento Inicial
- Sistema completo de gestión de cargas CSV
- Dashboard con estadísticas en tiempo real
- Filtros avanzados y paginación
- Manejo inteligente de duplicados

### ✨ Funcionalidades Principales Añadidas
- **Dashboard de estadísticas**: 6 tarjetas con métricas clave
- **Lista paginada de sesiones**: Con filtros por estado, nombre y fechas
- **Páginas de detalle**: Información completa por sesión
- **Integración de uploader**: CSVUploader embebido en la página principal
- **Estados de sesión**: processing, completed, failed, partial

### 🔧 Características Técnicas
- **API REST completa**: `/api/csv-sessions` y `/api/csv-sessions/[id]`
- **Base de datos optimizada**: Tabla `csv_sessions` con índices
- **Diseño responsivo**: Mobile-first con CSS Grid
- **Manejo de errores**: Estados y mensajes informativos

### 📊 Sistema de Métricas
- Total de sesiones procesadas
- Sesiones completadas vs fallidas
- Registros procesados globalmente
- Duplicados detectados y no subidos
- Tiempo de procesamiento por sesión

## [1.1.0] - 2025-10-06

### 🆕 Funcionalidad de Registros Pendientes
- **Nueva tarjeta**: "Registros Pendientes" en dashboard
- **Categorización inteligente**: Diferencia entre columna faltante vs vacía
- **Lógica mejorada**: CSVs sin columna "categoría" → "Pendiente"

### 🔧 Mejoras Técnicas
- **API extendido**: Campo `pendingRecords` en estadísticas
- **Query optimizada**: Conteo de registros con categoría "Pendiente"
- **Grid responsivo**: Ajustado para 6 tarjetas (160px min-width)

### 🐛 Correcciones Críticas
- **Bug de categorización**: Corregida lógica que asignaba incorrectamente "Sin categoría"
- **Detección de columnas**: Mejorada para distinguir columna faltante vs vacía
- **Normalización consistente**: Actualizada en todos los componentes

### 🎨 Mejoras de UI/UX
- **Indicadores visuales**: Color azul (info) para registros pendientes
- **Distinción clara**: Naranja para duplicados, azul para pendientes
- **Layout optimizado**: Mejor distribución de tarjetas en diferentes pantallas

### 📋 Flujo de Categorización Mejorado
```
CSV sin columna "categoría" → "Pendiente" (necesita categorización)
CSV con columna vacía → "Sin categoría" (intencionalmente sin categorizar)
CSV con valores → Categorías normalizadas según reglas
```

### 🔄 Cambios en Procesamiento
- **Detección previa**: Verificar existencia de columna antes de procesar
- **Asignación condicional**: Lógica separada para cada caso
- **Consistencia**: Misma lógica en frontend y backend

## [1.2.0] - 2025-10-06 (Planificado)

### 🎯 Mejoras Planificadas
- **Exportación de datos**: Descargar sesiones en Excel/CSV
- **Notificaciones**: Alertas por email para fallos
- **Análisis de tendencias**: Gráficos históricos de cargas
- **Validación avanzada**: Reglas personalizables

### 🔧 Optimizaciones Técnicas
- **Procesamiento en lotes**: Para archivos muy grandes
- **Cache inteligente**: Optimización de consultas frecuentes
- **Compresión**: Almacenamiento eficiente de metadatos
- **Índices adicionales**: Para consultas complejas

### 📱 Mejoras de UX
- **Drag & Drop mejorado**: Múltiples archivos simultáneos
- **Progress tracking**: Barra de progreso en tiempo real
- **Predicciones**: Tiempo estimado de procesamiento
- **Shortcuts**: Atajos de teclado para acciones comunes

---

## 📋 Tipos de Cambios

- **🎉 Lanzamiento**: Nueva versión mayor
- **✨ Añadido**: Nuevas funcionalidades
- **🔧 Cambiado**: Cambios en funcionalidades existentes
- **🐛 Corregido**: Corrección de bugs
- **🗑️ Eliminado**: Funcionalidades removidas
- **🔒 Seguridad**: Vulnerabilidades corregidas
- **📊 Datos**: Cambios en esquema de base de datos
- **🎨 UI/UX**: Mejoras de interfaz y experiencia
- **⚡ Performance**: Optimizaciones de rendimiento
- **📚 Documentación**: Actualizaciones de documentación

---

## 🔗 Links Útiles

- **Documentación completa**: [CSV_SESSIONS_COMPONENT.md](./CSV_SESSIONS_COMPONENT.md)
- **README del componente**: [CSV_SESSIONS_README.md](./CSV_SESSIONS_README.md)
- **Issues del proyecto**: GitHub Issues
- **Pull Requests**: GitHub PRs

---

## 📝 Notas de Versión

### Compatibilidad
- **Base de datos**: Requiere migración para nuevos campos
- **API**: Retrocompatible con versiones anteriores
- **UI**: Cambios no rompen funcionalidad existente

### Migración entre Versiones

#### De 1.0.0 a 1.1.0
```sql
-- No requiere migración de BD, solo reiniciar servidor
-- Los nuevos campos se calculan dinámicamente
```

#### Configuración Requerida
```env
# Variables de entorno requeridas
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_MAX_FILE_SIZE=10485760
```

### Testing
- **Unit tests**: Funciones de procesamiento CSV
- **Integration tests**: Flujos completos de carga
- **UI tests**: Componentes de interfaz
- **Performance tests**: Cargas de archivos grandes

---

*Changelog mantenido por el equipo de desarrollo*  
*Formato basado en [Keep a Changelog](https://keepachangelog.com/)*
