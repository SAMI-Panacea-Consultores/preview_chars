# ⚙️ Configuración del Proyecto

## 📦 Dependencias

### Dependencias de Producción

```json
{
  "next": "14.2.32",
  "react": "^18",
  "react-dom": "^18",
  "recharts": "^2.12.7",
  "papaparse": "^5.4.1"
}
```

### Dependencias de Desarrollo

```json
{
  "@types/node": "^20",
  "@types/react": "^18",
  "@types/react-dom": "^18",
  "@types/papaparse": "^5.3.14",
  "eslint": "^8",
  "eslint-config-next": "14.2.32",
  "typescript": "^5"
}
```

## 🔧 Configuraciones

### Next.js Configuration (`next.config.js`)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración para manejo de CSV grandes
  experimental: {
    largePageDataBytes: 128 * 100000, // 12.8MB
  },
  
  // Optimizaciones de imagen
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Headers de seguridad
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### TypeScript Configuration (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/utils/*": ["./src/utils/*"],
      "@/types/*": ["./src/types/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### ESLint Configuration (`.eslintrc.json`)

```json
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "@next/next/no-img-element": "error",
    "react-hooks/exhaustive-deps": "warn",
    "no-unused-vars": "warn",
    "prefer-const": "error"
  }
}
```

## 🌍 Variables de Entorno

### Archivo `.env.local` (Ejemplo)

```bash
# Configuración de desarrollo
NODE_ENV=development
NEXT_PUBLIC_APP_NAME="Dashboard Redes Sociales"
NEXT_PUBLIC_VERSION="1.0.0"

# Configuración de analytics (opcional)
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"

# Configuración de API (futuro)
API_BASE_URL="https://api.example.com"
API_KEY="your-api-key-here"

# Configuración de base de datos (futuro)
DATABASE_URL="postgresql://username:password@localhost:5432/dashboard_db"

# Configuración de almacenamiento (futuro)
STORAGE_BUCKET="dashboard-files"
STORAGE_REGION="us-east-1"
```

### Variables Públicas

```typescript
// src/config/env.ts
export const ENV = {
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Dashboard',
  VERSION: process.env.NEXT_PUBLIC_VERSION || '1.0.0',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
} as const;
```

## 📁 Estructura de Archivos Recomendada

```
src/
├── app/                          # App Router de Next.js
│   ├── globals.css              # Estilos globales
│   ├── layout.tsx               # Layout principal
│   ├── page.tsx                 # Dashboard principal
│   └── perfil/[red]/[perfil]/   # Rutas dinámicas
│       └── page.tsx             # Página de detalle
├── components/                   # Componentes reutilizables (futuro)
│   ├── charts/
│   │   ├── PieChart.tsx
│   │   ├── LineChart.tsx
│   │   └── CustomTooltip.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── Input.tsx
│   └── layout/
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── Footer.tsx
├── hooks/                        # Custom hooks (futuro)
│   ├── useCSVData.ts
│   ├── useLocalStorage.ts
│   └── useDebounce.ts
├── utils/                        # Utilidades
│   ├── csvParser.ts
│   ├── dataAggregation.ts
│   ├── dateUtils.ts
│   └── formatters.ts
├── types/                        # Definiciones de tipos
│   ├── csv.ts
│   ├── charts.ts
│   └── api.ts
├── constants/                    # Constantes
│   ├── categories.ts
│   ├── colors.ts
│   └── config.ts
└── styles/                       # Estilos adicionales
    ├── components.css
    └── utilities.css
```

## 🎨 Configuración de Estilos

### CSS Custom Properties

```css
/* src/app/globals.css */
:root {
  /* Spacing System */
  --spacing-0: 0px;
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-5: 20px;
  --spacing-6: 24px;
  --spacing-8: 32px;
  --spacing-10: 40px;
  --spacing-12: 48px;
  --spacing-16: 64px;
  --spacing-20: 80px;
  --spacing-24: 96px;
  
  /* Typography Scale */
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-base: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 20px;
  --font-size-2xl: 24px;
  --font-size-3xl: 30px;
  --font-size-4xl: 36px;
  
  /* Line Heights */
  --line-height-tight: 1.25;
  --line-height-snug: 1.375;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.625;
  --line-height-loose: 2;
  
  /* Font Weights */
  --font-weight-thin: 100;
  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-extrabold: 800;
  --font-weight-black: 900;
}
```

### Responsive Breakpoints

```css
/* Media Queries */
@custom-media --mobile (max-width: 767px);
@custom-media --tablet (min-width: 768px) and (max-width: 1023px);
@custom-media --desktop (min-width: 1024px);
@custom-media --large-desktop (min-width: 1440px);

/* Utility Classes */
.mobile-only { display: block; }
.tablet-only { display: none; }
.desktop-only { display: none; }

@media (--tablet) {
  .mobile-only { display: none; }
  .tablet-only { display: block; }
  .desktop-only { display: none; }
}

@media (--desktop) {
  .mobile-only { display: none; }
  .tablet-only { display: none; }
  .desktop-only { display: block; }
}
```

## 🚀 Scripts de Build y Desarrollo

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "build:analyze": "ANALYZE=true npm run build",
    "clean": "rm -rf .next out",
    "export": "next build && next export"
  }
}
```

### Scripts Personalizados

```bash
#!/bin/bash
# scripts/setup.sh - Configuración inicial del proyecto

echo "🚀 Configurando proyecto Dashboard..."

# Instalar dependencias
npm install

# Crear archivos de configuración si no existen
if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "✅ Archivo .env.local creado"
fi

# Crear directorio public si no existe
mkdir -p public

echo "✅ Proyecto configurado correctamente"
echo "🎯 Ejecuta 'npm run dev' para iniciar el desarrollo"
```

```bash
#!/bin/bash
# scripts/deploy.sh - Script de despliegue

echo "🚀 Iniciando despliegue..."

# Verificar que estamos en main/master
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ] && [ "$BRANCH" != "master" ]; then
  echo "❌ Error: Debes estar en la rama main/master para desplegar"
  exit 1
fi

# Verificar que no hay cambios sin commitear
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ Error: Hay cambios sin commitear"
  exit 1
fi

# Build del proyecto
npm run build

# Verificar que el build fue exitoso
if [ $? -eq 0 ]; then
  echo "✅ Build exitoso"
  echo "🚀 Listo para desplegar en Vercel"
else
  echo "❌ Error en el build"
  exit 1
fi
```

## 🔒 Configuración de Seguridad

### Content Security Policy

```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self' data:;
      connect-src 'self';
    `.replace(/\s{2,}/g, ' ').trim()
  }
];
```

### Configuración de CORS (para futuras APIs)

```javascript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // CORS headers
  const response = NextResponse.next();
  
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
```

## 📊 Configuración de Analytics

### Google Analytics 4

```typescript
// src/lib/analytics.ts
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;

export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

export const event = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};
```

### Custom Analytics Events

```typescript
// src/hooks/useAnalytics.ts
import { useEffect } from 'react';
import { event } from '@/lib/analytics';

export const useAnalytics = () => {
  const trackCSVUpload = (fileSize: number, rowCount: number) => {
    event('csv_upload', 'data', `${rowCount}_rows`, fileSize);
  };

  const trackChartView = (chartType: string, dataPoints: number) => {
    event('chart_view', 'visualization', chartType, dataPoints);
  };

  const trackFilterUsage = (filterType: string, filterValue: string) => {
    event('filter_usage', 'interaction', `${filterType}_${filterValue}`);
  };

  return {
    trackCSVUpload,
    trackChartView,
    trackFilterUsage,
  };
};
```

## 🧪 Configuración de Testing (Futuro)

### Jest Configuration

```javascript
// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/layout.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
```

---

Esta configuración proporciona una base sólida para el desarrollo, mantenimiento y escalabilidad del proyecto.
