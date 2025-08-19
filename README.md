# 📊 Dashboard de Análisis de Redes Sociales

Un dashboard moderno y interactivo para analizar métricas de publicaciones en redes sociales, construido con Next.js y diseño estilo Apple.

## 🚀 Características Principales

### 📈 **Visualización de Datos**
- **Vista Global**: Resumen general por red social
- **Vista por Perfil**: Análisis específico de un perfil
- **Vista Mosaico**: Comparación visual de todos los perfiles
- **Vista Comparación**: Comparación directa entre dos perfiles

### 🎯 **Métricas Avanzadas**
- **Impacto por Categoría**: Análisis de eficiencia por temática
- **Filtros de Fecha**: Análisis por rangos temporales específicos
- **Ordenamiento Inteligente**: Por publicaciones o por impacto (impresiones)
- **Datos Proporcionales**: División correcta de métricas en publicaciones multi-categoría

### 🎨 **Diseño Moderno**
- **Estilo Apple**: Interfaz limpia con gradientes y efectos glassmorphism
- **Responsive**: Adaptable a diferentes tamaños de pantalla
- **Scroll Horizontal**: Navegación fluida en secciones con muchos elementos
- **Animaciones Suaves**: Transiciones y efectos visuales modernos

## 🛠️ Tecnologías Utilizadas

- **Framework**: Next.js 14 con App Router
- **Lenguaje**: TypeScript
- **Gráficas**: Recharts
- **Procesamiento CSV**: PapaParse
- **Estilos**: CSS Modules con variables CSS personalizadas
- **Persistencia**: localStorage para datos CSV

## 📁 Estructura del Proyecto

```
andi_pre/
├── src/
│   ├── app/
│   │   ├── globals.css           # Estilos globales y tema Apple
│   │   ├── layout.tsx            # Layout principal
│   │   ├── page.tsx              # Dashboard principal
│   │   └── perfil/[red]/[perfil]/
│   │       └── page.tsx          # Página de detalle por perfil
├── public/
│   └── input.csv                 # Archivo CSV de ejemplo
├── package.json                  # Dependencias del proyecto
└── README.md                     # Esta documentación
```

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18 o superior
- npm o yarn

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd andi_pre
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Ejecutar en desarrollo**
```bash
npm run dev
```

4. **Abrir en el navegador**
```
http://localhost:3000
```

## 📊 Formato de Datos CSV

El dashboard espera un archivo CSV con las siguientes columnas principales:

### Columnas Requeridas
| Columna | Descripción | Ejemplo |
|---------|-------------|---------|
| `Fecha` | Fecha de publicación | `8/5/2025 11:48 pm` |
| `Red` | Red social | `Facebook`, `Instagram` |
| `Perfil` | Nombre del perfil | `Secretaría de Infraestructura` |
| `categoria` | Categorías (separadas por comas) | `SEGURIDAD,TRANSPARENCIA PÚBLICA` |
| `Impresiones` | Número de impresiones | `32,374` |
| `Alcance` | Alcance de la publicación | `31,051` |
| `Me gusta` | Número de likes | `479` |

### Formato de Números
- Los números pueden incluir comas como separadores de miles: `32,374`
- El sistema parsea automáticamente estos formatos

### Categorías Soportadas
- `SEGURIDAD` 🔵
- `INVERTIR PARA CRECER` 🟢
- `TRANSPARENCIA PÚBLICA` 🟣
- `Error en procesamiento` 🔴
- `Sin categoría` 🔘 (para datos sin categorizar)

## 🎯 Funcionalidades Detalladas

### 1. **Dashboard Principal** (`/`)

#### Modos de Vista
- **Global**: Agregación de todas las publicaciones por red
- **Por Perfil**: Análisis específico de un perfil seleccionado
- **Mosaico**: Grid de gráficas circulares para todos los perfiles
- **Comparar**: Comparación lado a lado de dos perfiles

#### Controles Disponibles
- **Selector de CSV**: Carga de archivos de datos
- **Filtros de Fecha**: Rango temporal específico
- **Selector de Red**: Facebook, Instagram, etc.
- **Ordenamiento**: Por número de publicaciones o por impacto (impresiones)

### 2. **Página de Detalle** (`/perfil/[red]/[perfil]`)

#### Secciones Principales

**🎯 Eficiencia por Categoría**
- Tarjetas con métricas detalladas por categoría
- Porcentajes de impacto vs. total de la red
- Scroll horizontal para visualización completa
- Orden inteligente (categorías específicas primero, "Sin categoría" al final)

**📊 Resumen General**
- Métricas totales del perfil
- Tarjetas compactas con totales agregados

**📈 Métricas por Categoría**
- Gráficas de líneas para tendencias temporales
- Impresiones, Alcance, Me Gusta por fecha
- Gráfica circular de distribución de publicaciones

## 🧮 Lógica de Cálculo de Datos

### Problema de Múltiples Categorías
Cuando una publicación tiene múltiples categorías (ej: `"SEGURIDAD,TRANSPARENCIA"`), el sistema:

1. **Divide proporcionalmente las métricas**:
   ```javascript
   // Ejemplo: 1000 impresiones en 2 categorías
   SEGURIDAD: 1000 ÷ 2 = 500 impresiones
   TRANSPARENCIA: 1000 ÷ 2 = 500 impresiones
   TOTAL REAL: 1000 impresiones ✅ (sin duplicación)
   ```

2. **Mantiene el conteo completo de publicaciones**:
   ```javascript
   // Cada categoría cuenta la publicación completa
   SEGURIDAD: +1 publicación
   TRANSPARENCIA: +1 publicación
   ```

### Normalización de Categorías
El sistema normaliza automáticamente las categorías del CSV:
```javascript
"ESTRATEGIA \"INVERTIR PARA CRECER\"" → "INVERTIR PARA CRECER"
"ESTRATEGIA \"SEGURIDAD\"" → "SEGURIDAD"
"N/A" → "Sin categoría"
"-" → "Sin categoría"
```

## 🎨 Guía de Estilos

### Paleta de Colores (Estilo Apple)
```css
--system-blue: #007AFF      /* SEGURIDAD */
--system-green: #34C759     /* INVERTIR PARA CRECER */
--system-purple: #5856D6    /* TRANSPARENCIA PÚBLICA */
--system-red: #FF3B30       /* Error en procesamiento */
--system-gray: #8E8E93      /* Sin categoría */
```

### Efectos Visuales
- **Glassmorphism**: `backdrop-filter: blur(16px)`
- **Gradientes**: Múltiples gradientes azules para fondos
- **Sombras**: Sombras sutiles estilo Apple
- **Transiciones**: Animaciones suaves de 0.3s

### Tipografía
- **Fuente**: SF Pro Display (fallback: system fonts)
- **Pesos**: 400 (regular), 600 (semibold), 700 (bold), 800 (heavy)

## 🔧 Configuración Avanzada

### Personalización de Categorías
Para agregar nuevas categorías, editar en `src/app/page.tsx` y `src/app/perfil/[red]/[perfil]/page.tsx`:

```javascript
const CATEGORY_COLOR: Record<string, string> = {
  'NUEVA_CATEGORIA': '#FF9500', // System Orange
  // ... otras categorías
};

const ALL_CATEGORIES = [
  'NUEVA_CATEGORIA',
  // ... otras categorías
  'Sin categoría' // Siempre al final
];
```

### Personalización de Colores
Modificar variables CSS en `src/app/globals.css`:

```css
:root {
  --custom-color: #FF9500;
  --gradient-custom: linear-gradient(135deg, #FF9500 0%, #FF6B35 100%);
}
```

## 📱 Responsive Design

### Breakpoints
- **Móvil**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Adaptaciones
- **Scroll Horizontal**: En dispositivos pequeños para tarjetas
- **Grid Responsivo**: Ajuste automático de columnas
- **Touch-friendly**: Controles optimizados para dispositivos táctiles

## 🚀 Despliegue

### Vercel (Recomendado)
1. Conectar repositorio a Vercel
2. Configurar variables de entorno si es necesario
3. Deploy automático en cada push

### Build Local
```bash
npm run build
npm start
```

## 🐛 Solución de Problemas Comunes

### 1. **CSV no se carga**
- Verificar que el archivo tenga las columnas requeridas
- Comprobar formato de fechas: `M/D/YYYY H:MM am/pm`
- Revisar encoding del archivo (UTF-8 recomendado)

### 2. **Números aparecen en 0**
- Verificar formato de números en CSV (comas como separadores de miles)
- Comprobar nombres de columnas exactos: `Impresiones`, `Alcance`, `Me gusta`

### 3. **Categorías no se muestran correctamente**
- Revisar normalización en función `normalizeCategory`
- Verificar orden de reglas regex (específicas antes que genéricas)

### 4. **Problemas de navegación**
- Limpiar localStorage: `localStorage.removeItem('csvData')`
- Refrescar página después de cambios en CSV

## 🔮 Futuras Mejoras

### Funcionalidades Planeadas
- [ ] Exportar reportes en PDF
- [ ] Filtros avanzados por engagement
- [ ] Comparación de múltiples períodos
- [ ] Dashboard de tendencias históricas
- [ ] Integración con APIs de redes sociales
- [ ] Sistema de alertas y notificaciones

### Optimizaciones Técnicas
- [ ] Implementar React Query para cache
- [ ] Optimizar renderizado de gráficas grandes
- [ ] Implementar lazy loading
- [ ] Agregar tests unitarios
- [ ] Optimizar bundle size

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver archivo `LICENSE` para más detalles.

## 👥 Contribuciones

Las contribuciones son bienvenidas. Para contribuir:

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📞 Soporte

Para soporte o preguntas:
- Crear issue en GitHub
- Revisar documentación de troubleshooting
- Verificar logs de consola del navegador

---

**Desarrollado con ❤️ usando Next.js y diseño estilo Apple**
