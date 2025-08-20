# 📊 Dashboard de Análisis de Redes Sociales

Un dashboard moderno y interactivo para analizar métricas de publicaciones en redes sociales, construido con **Next.js 14**, **API First**, y diseño estilo Apple.

## 🚀 Características Principales

### 📈 **Visualización de Datos**
- **Vista Global**: Resumen general por red social
- **Vista por Perfil**: Análisis específico de un perfil
- **Vista Mosaico**: Comparación visual de todos los perfiles
- **Vista Comparación**: Comparación directa entre dos perfiles
- **Exportación de Imágenes**: Exportar gráficas como imágenes PNG

### 🎯 **Métricas Avanzadas**
- **Impacto por Categoría**: Análisis de eficiencia por temática
- **Filtros de Fecha**: Análisis por rangos temporales específicos
- **Ordenamiento Inteligente**: Por publicaciones o por impacto (impresiones)
- **Datos Proporcionales**: División correcta de métricas en publicaciones multi-categoría
- **Estadísticas en Tiempo Real**: Métricas actualizadas automáticamente

### 🎨 **Diseño Moderno**
- **Estilo Apple**: Interfaz limpia con gradientes y efectos glassmorphism
- **Responsive**: Adaptable a diferentes tamaños de pantalla
- **Scroll Horizontal**: Navegación fluida en secciones con muchos elementos
- **Animaciones Suaves**: Transiciones y efectos visuales modernos
- **UI Minimalista**: Controles reorganizados para mejor UX

### 🔌 **API First Architecture**
- **APIs RESTful**: Endpoints documentados y validados
- **Documentación OpenAPI/Swagger**: Documentación interactiva completa
- **Validación con Zod**: Validación robusta de tipos y datos
- **Manejo de Errores**: Respuestas estructuradas y consistentes
- **Paginación y Filtros**: Consultas optimizadas con parámetros avanzados

## 🛠️ Tecnologías Utilizadas

### **Frontend**
- **Framework**: Next.js 14 con App Router
- **Lenguaje**: TypeScript
- **Gráficas**: Recharts
- **Procesamiento CSV**: PapaParse
- **Estilos**: CSS Modules con variables CSS personalizadas
- **Exportación**: html2canvas para exportar gráficas

### **Backend & APIs**
- **Base de Datos**: SQLite con Prisma ORM
- **Validación**: Zod para esquemas TypeScript-first
- **Documentación**: swagger-jsdoc + SwaggerUI
- **APIs**: Next.js API Routes con App Router
- **Manejo de Archivos**: Procesamiento de CSV con validación

### **Documentación**
- **OpenAPI 3.0**: Especificación completa de APIs
- **SwaggerUI**: Documentación interactiva
- **Fallbacks**: Documentación HTML siempre disponible

## 📁 Estructura del Proyecto

```
andi_pre/
├── src/
│   ├── app/
│   │   ├── api/                      # API Routes
│   │   │   ├── docs/route.ts         # OpenAPI spec endpoint
│   │   │   ├── publicaciones/route.ts # Publicaciones API
│   │   │   └── upload-csv/route.ts   # CSV upload API
│   │   ├── api-docs/                 # SwaggerUI interactivo
│   │   │   └── page.tsx
│   │   ├── api-docs-simple/          # Documentación HTML
│   │   │   └── page.tsx
│   │   ├── globals.css               # Estilos globales y tema Apple
│   │   ├── layout.tsx                # Layout principal
│   │   ├── page.tsx                  # Dashboard principal
│   │   └── perfil/[red]/[perfil]/    # Páginas de detalle
│   │       └── page.tsx
│   ├── components/                   # Componentes React
│   │   ├── CSVUploader.tsx          # Componente de carga CSV
│   │   └── CSVStatusBanner.tsx      # Banner de estado
│   ├── hooks/                       # Custom hooks
│   │   ├── useCSVUpload.ts         # Hook para carga CSV
│   │   └── usePublicaciones.ts     # Hook para datos DB
│   ├── lib/                        # Utilidades y configuración
│   │   ├── api-utils.ts           # Utilidades para APIs
│   │   ├── prisma.ts              # Cliente Prisma
│   │   ├── schemas.ts             # Esquemas Zod
│   │   └── swagger.ts             # Configuración OpenAPI
│   └── generated/                 # Código generado por Prisma
├── prisma/
│   ├── schema.prisma             # Esquema de base de datos
│   └── dev.db                    # Base de datos SQLite
├── public/
│   └── input.csv                 # Archivo CSV de ejemplo
├── package.json                  # Dependencias del proyecto
├── .env                         # Variables de entorno
└── README.md                    # Esta documentación
```

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18 o superior
- npm o yarn
- Git

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/SAMI-Panacea-Consultores/preview_chars.git
cd andi_pre
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar base de datos**
```bash
# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones (si existen)
npx prisma db push
```

4. **Configurar variables de entorno**
```bash
# Crear archivo .env
echo "DATABASE_URL=\"file:./dev.db\"" > .env
```

5. **Ejecutar en desarrollo**
```bash
npm run dev
```

6. **Abrir en el navegador**
```
http://localhost:3000
```

## 📚 APIs y Documentación

### 🔗 **Endpoints Disponibles**

#### **Documentación Interactiva**
- **SwaggerUI**: `http://localhost:3000/api-docs`
- **Documentación HTML**: `http://localhost:3000/api-docs-simple`
- **Especificación OpenAPI**: `http://localhost:3000/api/docs`

#### **APIs de Datos**

**📤 Subir CSV** - `POST /api/upload-csv`
```javascript
// Subir archivo CSV con validación y manejo de duplicados
const formData = new FormData();
formData.append('file', csvFile);
formData.append('overwrite', 'false'); // o 'true'

const response = await fetch('/api/upload-csv', {
  method: 'POST',
  body: formData
});
```

**📊 Obtener Publicaciones** - `GET /api/publicaciones`
```javascript
// Obtener publicaciones con filtros y paginación
const params = new URLSearchParams({
  red: 'Instagram',
  fechaInicio: '2024-01-01T00:00:00.000Z',
  fechaFin: '2024-12-31T23:59:59.999Z',
  limit: '50',
  offset: '0',
  sortBy: 'fecha',
  sortOrder: 'desc'
});

const response = await fetch(`/api/publicaciones?${params}`);
const data = await response.json();
```

### 📋 **Parámetros de API**

#### **Filtros Disponibles**
- `red`: Red social (`Instagram`, `Facebook`, `TikTok`, `Twitter`)
- `perfil`: Nombre del perfil específico
- `categoria`: Categoría de publicaciones
- `fechaInicio`: Fecha de inicio (ISO string)
- `fechaFin`: Fecha de fin (ISO string)

#### **Paginación**
- `limit`: Número de resultados (1-100, default: 10)
- `offset`: Desplazamiento (default: 0)
- `sortBy`: Campo de ordenamiento (`fecha`, `impresiones`, `alcance`, `meGusta`)
- `sortOrder`: Dirección (`asc`, `desc`)

#### **Respuestas Estructuradas**
```typescript
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: {
    total: number;
    limit: number;
    offset: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  stats?: {
    totalPublicaciones: number;
    redes: string[];
    perfiles: string[];
    categorias: string[];
  };
}
```

## 💾 Base de Datos y Persistencia

### **Esquema de Datos (Prisma)**
```prisma
model Publicacion {
  id          String   @id // ID único de la publicación
  fecha       DateTime
  red         String   // Instagram, Facebook, etc.
  perfil      String   // Nombre del perfil
  categoria   String   // Categoría de la publicación
  impresiones Int      @default(0)
  alcance     Int      @default(0)
  meGusta     Int      @default(0) @map("me_gusta")
  
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  @@index([red])
  @@index([perfil])
  @@index([categoria])
  @@index([fecha])
  @@map("publicaciones")
}
```

### **Gestión de Duplicados**
- **Detección automática**: Por campo `id` único
- **Opciones del usuario**: Sobrescribir o saltar duplicados
- **Validación robusta**: Con Zod y Prisma

### **Comandos de Base de Datos**
```bash
# Ver datos en la base de datos
npx prisma studio

# Resetear base de datos
npx prisma db push --force-reset

# Generar cliente después de cambios
npx prisma generate
```

## 📊 Formato de Datos CSV

### Columnas Requeridas
| Columna | Descripción | Ejemplo |
|---------|-------------|---------|
| `ID` | Identificador único | `post_123456` |
| `Fecha` | Fecha de publicación | `8/5/2025 11:48 pm` |
| `Red` | Red social | `Facebook`, `Instagram` |
| `Perfil` | Nombre del perfil | `Secretaría de Infraestructura` |
| `categoria` | Categorías (separadas por comas) | `SEGURIDAD,TRANSPARENCIA PÚBLICA` |
| `Impresiones` | Número de impresiones | `32,374` |
| `Alcance` | Alcance de la publicación | `31,051` |
| `Me gusta` | Número de likes | `479` |

### Validaciones Automáticas
- **Formato de fecha**: `M/D/YYYY H:MM am/pm`
- **Números**: Soporte para separadores de miles (`,`)
- **Categorías**: Normalización automática de nombres
- **IDs únicos**: Detección de duplicados

## 🎯 Funcionalidades Detalladas

### 1. **Dashboard Principal** (`/`)

#### **Carga de Datos**
- **Upload CSV**: Botón en header con validación en tiempo real
- **Estado de carga**: Banner flotante con progreso
- **Manejo de duplicados**: Modal interactivo para decisiones

#### **Modos de Vista**
- **Global**: Agregación por red social
- **Por Perfil**: Análisis específico
- **Mosaico**: Grid interactivo (clickeable para detalles)
- **Comparar**: Comparación lado a lado

#### **Controles Avanzados**
- **Filtros de Fecha**: Selector de rangos
- **Selector de Red**: Con estadísticas en tiempo real
- **Ordenamiento**: Por publicaciones o impacto

### 2. **Página de Detalle** (`/perfil/[red]/[perfil]`)

#### **Métricas Temporales**
- **Gráficas de líneas**: Impresiones, Alcance, Me Gusta
- **Datos filtrados**: Por rango de fechas seleccionado
- **Tendencias**: Visualización de patrones temporales

#### **Eficiencia por Categoría**
- **Tarjetas detalladas**: Métricas por categoría
- **Porcentajes de impacto**: Vs. total de la red
- **Exportación**: Botón para exportar como imagen
- **Scroll horizontal**: Para muchas categorías

#### **Navegación**
- **Breadcrumbs**: Navegación clara
- **Enlaces directos**: URLs amigables
- **Estado compartible**: URLs con parámetros

## 🧮 Lógica de Cálculo de Datos

### **División Proporcional**
Cuando una publicación tiene múltiples categorías:

```javascript
// Ejemplo: 1000 impresiones en 2 categorías
const categorias = ["SEGURIDAD", "TRANSPARENCIA"];
const impresiones = 1000;
const divisionPorCategoria = impresiones / categorias.length; // 500

// Resultado:
// SEGURIDAD: 500 impresiones
// TRANSPARENCIA: 500 impresiones
// TOTAL REAL: 1000 impresiones ✅ (sin duplicación)
```

### **Normalización de Categorías**
```javascript
const normalizaciones = {
  'ESTRATEGIA "INVERTIR PARA CRECER"': 'INVERTIR PARA CRECER',
  'ESTRATEGIA "SEGURIDAD"': 'SEGURIDAD',
  'N/A': 'Sin categoría',
  '-': 'Sin categoría',
  '': 'Sin categoría'
};
```

### **Agregaciones por Perfil**
```javascript
// Cálculo de impacto por categoría dentro de una red
const impactoPorcentaje = (impresionesCategoria / totalImpresionesRed) * 100;
```

## 🎨 Guía de Estilos

### **Paleta de Colores (Estilo Apple)**
```css
:root {
  --system-blue: #007AFF;      /* SEGURIDAD */
  --system-green: #34C759;     /* INVERTIR PARA CRECER */
  --system-purple: #5856D6;    /* TRANSPARENCIA PÚBLICA */
  --system-red: #FF3B30;       /* Error en procesamiento */
  --system-gray: #8E8E93;      /* Sin categoría */
  
  /* Gradientes */
  --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --gradient-glass: rgba(255, 255, 255, 0.1);
}
```

### **Efectos Visuales**
- **Glassmorphism**: `backdrop-filter: blur(16px)`
- **Sombras Apple**: `box-shadow: 0 8px 32px rgba(0,0,0,0.1)`
- **Transiciones**: `transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)`

## 🔧 Configuración Avanzada

### **Variables de Entorno**
```bash
# .env
DATABASE_URL="file:./dev.db"                    # SQLite local
# DATABASE_URL="postgresql://..."               # PostgreSQL (futuro)
NODE_ENV="development"                          # Entorno
```

### **Personalización de APIs**
```typescript
// src/lib/schemas.ts
export const CustomQuerySchema = z.object({
  customField: z.string().optional(),
  // ... más campos personalizados
});
```

### **Nuevas Categorías**
```typescript
// Agregar en CATEGORY_COLORS y ALL_CATEGORIES
const CATEGORY_COLORS = {
  'NUEVA_CATEGORIA': '#FF9500',
  // ... otras
};
```

## 🚀 Despliegue

### **Vercel (Recomendado)**
1. Conectar repositorio a Vercel
2. Configurar variables de entorno
3. Deploy automático

### **Docker (Opcional)**
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### **Build Local**
```bash
npm run build
npm start
```

## 🧪 Testing y Validación

### **Validación de APIs**
```bash
# Probar endpoints con curl
curl -X GET "http://localhost:3000/api/publicaciones?limit=5"
curl -X POST "http://localhost:3000/api/upload-csv" -F "file=@input.csv"
```

### **Validación de Esquemas**
```typescript
// Todas las APIs usan validación Zod automática
import { PublicationQuerySchema } from '@/lib/schemas';

const result = PublicationQuerySchema.safeParse(queryParams);
if (!result.success) {
  // Manejo de errores estructurado
}
```

## 🐛 Solución de Problemas

### **1. Problemas de Base de Datos**
```bash
# Regenerar cliente Prisma
npx prisma generate

# Verificar conexión
npx prisma db push

# Ver datos
npx prisma studio
```

### **2. Errores de CSV**
- **Formato de fecha**: Verificar `M/D/YYYY H:MM am/pm`
- **Columnas requeridas**: ID, Fecha, Red, Perfil, categoria
- **Encoding**: Usar UTF-8

### **3. Problemas de API**
- **Documentación**: Visitar `/api-docs` para probar endpoints
- **Logs**: Revisar consola del servidor para errores
- **Validación**: Verificar esquemas Zod en respuestas

### **4. Problemas de UI**
```bash
# Limpiar caché de Next.js
rm -rf .next

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

## 🔮 Roadmap y Futuras Mejoras

### **Fase 1 - API First** ✅
- [x] Implementar APIs RESTful
- [x] Documentación OpenAPI/Swagger
- [x] Validación con Zod
- [x] Base de datos con Prisma

### **Fase 2 - Escalabilidad** 🔄
- [ ] Migrar a PostgreSQL
- [ ] Implementar Redis para cache
- [ ] Rate limiting avanzado
- [ ] Métricas y monitoring

### **Fase 3 - Funcionalidades Avanzadas**
- [ ] Autenticación y autorización
- [ ] Webhooks para actualizaciones
- [ ] Exportación de reportes PDF
- [ ] Integración con APIs de redes sociales
- [ ] Dashboard de tendencias históricas
- [ ] Sistema de alertas

### **Fase 4 - Optimización**
- [ ] Server-side rendering optimizado
- [ ] Bundle splitting avanzado
- [ ] Progressive Web App (PWA)
- [ ] Tests automatizados
- [ ] CI/CD pipeline

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver archivo `LICENSE` para más detalles.

## 👥 Contribuciones

Las contribuciones son bienvenidas. Para contribuir:

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

### **Guías de Contribución**
- Seguir convenciones de TypeScript
- Documentar APIs con JSDoc/OpenAPI
- Validar datos con Zod
- Mantener cobertura de tests
- Seguir guía de estilos Apple

## 📞 Soporte y Recursos

### **Documentación Técnica**
- **API Docs**: `/api-docs` (SwaggerUI interactivo)
- **Especificación**: `/api/docs` (OpenAPI JSON)
- **Schemas**: Ver `src/lib/schemas.ts`

### **Herramientas de Desarrollo**
- **Prisma Studio**: `npx prisma studio`
- **API Testing**: SwaggerUI try-it-out
- **Database**: SQLite browser

### **Enlaces Útiles**
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Zod Documentation](https://zod.dev)
- [OpenAPI Specification](https://swagger.io/specification/)

---

**🚀 Desarrollado con Next.js 14, API First, y diseño estilo Apple**

*Dashboard moderno para análisis de redes sociales con arquitectura escalable y documentación completa.*