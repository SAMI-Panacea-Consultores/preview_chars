# 📚 Documentación Completa - Andi Analytics Dashboard

> Centro de documentación para desarrolladores y equipos que trabajarán con este proyecto.

---

## 📑 Índice de Documentación

### 🚀 **Getting Started**

| Documento | Descripción | Audiencia |
|-----------|-------------|-----------|
| [README Principal](../README.md) | Introducción, instalación y uso básico | Todos |
| [CHANGELOG](../CHANGELOG.md) | Historial de cambios del proyecto | Todos |

### 🏗️ **Arquitectura y Diseño**

| Documento | Descripción | Audiencia |
|-----------|-------------|-----------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Arquitectura completa del sistema, patrones de diseño, flujos de datos | Arquitectos, Devs Senior |
| [TECHNICAL_DOCS.md](../TECHNICAL_DOCS.md) | Detalles técnicos de implementación | Desarrolladores |

### 🔌 **APIs y Integración**

| Documento | Descripción | Audiencia |
|-----------|-------------|-----------|
| [API_REFERENCE.md](./API_REFERENCE.md) | Referencia completa de todos los endpoints, schemas, ejemplos | API consumers, Frontend Devs |
| **[SwaggerUI](/api-docs)** | Documentación interactiva en vivo | Todos |
| **[Docs Simples](/api-docs-simple)** | Documentación HTML estática | Todos |

### 💾 **Base de Datos**

| Documento | Descripción | Audiencia |
|-----------|-------------|-----------|
| [DATABASE.md](./DATABASE.md) | Schema, migraciones, queries, optimización, backup/restore | DBAs, Backend Devs |
| [schema.prisma](../prisma/schema.prisma) | Esquema Prisma actualizado | Backend Devs |

### 🚀 **Despliegue y DevOps**

| Documento | Descripción | Audiencia |
|-----------|-------------|-----------|
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Guía completa de despliegue para Vercel, Docker, AWS, Railway | DevOps, SREs |
| [PROJECT_CONFIG.md](../PROJECT_CONFIG.md) | Configuraciones de Next.js, TypeScript, ESLint | Desarrolladores |

### 📦 **Módulos Específicos**

| Documento | Descripción | Audiencia |
|-----------|-------------|-----------|
| [CSV_SESSIONS_README.md](./CSV_SESSIONS_README.md) | Guía del módulo de gestión de CSV | Desarrolladores |
| [CSV_SESSIONS_COMPONENT.md](./CSV_SESSIONS_COMPONENT.md) | Detalles técnicos del componente CSV | Frontend Devs |
| [CSV_SESSIONS_CHANGELOG.md](./CSV_SESSIONS_CHANGELOG.md) | Historial del módulo CSV | Todos |

---

## 🎯 Guías por Rol

### 👨‍💻 **Desarrollador Frontend**

**Primeros Pasos:**
1. Leer [README Principal](../README.md) → Instalación
2. Revisar [ARCHITECTURE.md](./ARCHITECTURE.md) → Presentation Layer
3. Explorar [API_REFERENCE.md](./API_REFERENCE.md) → Endpoints que usarás
4. Ver código en `/src/app/` y `/src/components/`

**Tareas Comunes:**
- **Crear nueva página**: Seguir convenciones en `/src/app/`
- **Consumir API**: Usar hooks en `/src/hooks/`
- **Styling**: Ver sistema de diseño en `globals.css`
- **Componentes**: Reutilizar de `/src/components/`

### 🔧 **Desarrollador Backend**

**Primeros Pasos:**
1. Leer [README Principal](../README.md) → Instalación
2. Revisar [ARCHITECTURE.md](./ARCHITECTURE.md) → API Layer
3. Estudiar [DATABASE.md](./DATABASE.md) → Schema y queries
4. Explorar [API_REFERENCE.md](./API_REFERENCE.md) → Estructura de endpoints

**Tareas Comunes:**
- **Crear nuevo endpoint**: Seguir patrón en `/src/app/api/`
- **Modificar schema**: Editar `prisma/schema.prisma` + migración
- **Validación**: Agregar schemas Zod en `/src/lib/schemas.ts`
- **Optimizar queries**: Consultar [DATABASE.md](./DATABASE.md)

### 🏗️ **Arquitecto / Tech Lead**

**Lectura Recomendada:**
1. [ARCHITECTURE.md](./ARCHITECTURE.md) → Vista completa del sistema
2. [DATABASE.md](./DATABASE.md) → Decisiones de persistencia
3. [DEPLOYMENT.md](./DEPLOYMENT.md) → Opciones de infraestructura
4. [API_REFERENCE.md](./API_REFERENCE.md) → Contratos de API

**Responsabilidades:**
- Revisar ADRs (Architecture Decision Records) en ARCHITECTURE.md
- Evaluar escalabilidad (sección en ARCHITECTURE.md)
- Planificar migraciones (PostgreSQL, Redis)
- Definir roadmap técnico

### 🚀 **DevOps / SRE**

**Lectura Recomendada:**
1. [DEPLOYMENT.md](./DEPLOYMENT.md) → Guías de deploy
2. [DATABASE.md](./DATABASE.md) → Backup y restore
3. [ARCHITECTURE.md](./ARCHITECTURE.md) → Flujos y dependencias
4. [PROJECT_CONFIG.md](../PROJECT_CONFIG.md) → Configuraciones

**Tareas Comunes:**
- **Deploy**: Seguir [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Monitoring**: Configurar logging y alertas
- **Backup**: Scripts en [DATABASE.md](./DATABASE.md)
- **CI/CD**: Ejemplos en DEPLOYMENT.md

### 🎨 **Diseñador / UX**

**Recursos:**
1. [README Principal](../README.md) → Sistema de diseño
2. `/src/app/globals.css` → Paleta de colores, tipografía
3. Páginas en vivo: `/`, `/sin-categoria`, `/csv-sessions`

**Explorar:**
- Headers y navegación modernos
- Filtros y controles intuitivos
- Gráficas y visualizaciones
- Responsive design

---

## 📖 Documentación por Tema

### 🔍 **Buscar por Pregunta**

| Pregunta | Documento | Sección |
|----------|-----------|---------|
| ¿Cómo instalar el proyecto? | [README](../README.md) | Instalación |
| ¿Cómo funciona la arquitectura? | [ARCHITECTURE](./ARCHITECTURE.md) | Vista General |
| ¿Qué APIs hay disponibles? | [API_REFERENCE](./API_REFERENCE.md) | Endpoints |
| ¿Cómo crear una migración? | [DATABASE](./DATABASE.md) | Migraciones |
| ¿Cómo desplegar a producción? | [DEPLOYMENT](./DEPLOYMENT.md) | Vercel / AWS |
| ¿Cómo funciona el upload de CSV? | [CSV_SESSIONS_README](./CSV_SESSIONS_README.md) | Guía Completa |
| ¿Cómo categorizar con IA? | [API_REFERENCE](./API_REFERENCE.md) | Categorización IA |
| ¿Cómo optimizar queries? | [DATABASE](./DATABASE.md) | Optimización |
| ¿Qué tecnologías se usan? | [README](../README.md) | Tecnologías |
| ¿Cómo hacer backup de la DB? | [DATABASE](./DATABASE.md) | Backup & Restore |
| ¿Cómo configurar environment vars? | [DEPLOYMENT](./DEPLOYMENT.md) | Variables de Entorno |
| ¿Cuál es el roadmap? | [README](../README.md) | Roadmap |
| ¿Cómo contribuir? | [README](../README.md) | Contribuciones |

---

## 🆕 **Onboarding para Nuevos Desarrolladores**

### Día 1: Setup y Familiarización

**Mañana (2-3 horas):**
1. ✅ Clonar repositorio
2. ✅ Leer [README Principal](../README.md)
3. ✅ Seguir pasos de instalación
4. ✅ Ejecutar `npm run dev` y explorar en http://localhost:3000
5. ✅ Revisar estructura de carpetas

**Tarde (2-3 horas):**
6. ✅ Leer [ARCHITECTURE.md](./ARCHITECTURE.md) → Secciones relevantes a tu rol
7. ✅ Explorar código en `/src/app/` (páginas principales)
8. ✅ Probar endpoints en `/api-docs`
9. ✅ Revisar Prisma Studio: `npx prisma studio`

### Día 2: Deep Dive

**Mañana:**
- Backend Dev: [DATABASE.md](./DATABASE.md) + [API_REFERENCE.md](./API_REFERENCE.md)
- Frontend Dev: Componentes + Hooks + Sistema de diseño

**Tarde:**
- Hacer tu primera contribución:
  - Fix de bug simple
  - Mejora de documentación
  - Agregar test

### Día 3-5: Primera Feature

**Tarea Guiada:**
- Implementar una feature pequeña end-to-end
- Seguir convenciones del proyecto
- PR review con el equipo
- Deploy a staging

---

## 🛠️ **Herramientas y Recursos**

### IDEs y Extensiones Recomendadas

**VS Code:**
- ESLint
- Prisma (oficial)
- TypeScript (built-in)
- GitLens
- Thunder Client (API testing)

**WebStorm / IntelliJ:**
- Prisma plugin
- Database Tools

### Comandos Útiles

```bash
# Desarrollo
npm run dev              # Iniciar dev server
npx prisma studio        # Ver base de datos
npx prisma migrate dev   # Crear migración

# Testing
npm run build            # Test build
npm run type-check       # Verificar TypeScript

# Database
npx prisma generate      # Regenerar cliente
npx prisma migrate deploy # Aplicar migraciones (prod)

# Deploy
vercel                   # Deploy a Vercel
railway up               # Deploy a Railway
```

### Links Externos

- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Vercel**: https://vercel.com/docs
- **OpenAI API**: https://platform.openai.com/docs

---

## 📊 **Métricas del Proyecto**

| Métrica | Valor |
|---------|-------|
| **Lenguaje Principal** | TypeScript (95%) |
| **Framework** | Next.js 14 |
| **Líneas de Código** | ~15,000 |
| **Archivos** | ~50 |
| **APIs** | 7 endpoints principales |
| **Modelos DB** | 2 (Publicacion, CsvSession) |
| **Dependencias** | 30 |
| **Última Actualización** | Octubre 2025 |

---

## 🔄 **Flujo de Trabajo Recomendado**

### Feature Development

```
1. Create branch
   git checkout -b feature/descripcion

2. Develop
   - Escribir código
   - Seguir convenciones
   - Actualizar docs si es necesario

3. Test
   npm run build
   npm run type-check

4. Commit
   git commit -m "feat: descripción"
   (Seguir Conventional Commits)

5. Push
   git push origin feature/descripcion

6. Pull Request
   - Descripción clara
   - Screenshots si aplica
   - Link a issue si existe

7. Code Review
   - Esperar aprobación
   - Aplicar feedback

8. Merge
   - Squash and merge
   - Delete branch

9. Deploy
   - Automático en Vercel/Railway
   - Verificar en producción
```

### Bug Fix

Similar a feature, pero:
- Branch: `fix/descripcion`
- Commit: `fix: descripción`
- Prioridad: Alta si es critical

### Documentation Update

- Branch: `docs/descripcion`
- Commit: `docs: descripción`
- No requiere tests exhaustivos

---

## ❓ **FAQ**

### General

**P: ¿Puedo usar npm/yarn/pnpm?**  
R: El proyecto usa `npm`. Para consistencia, mantener npm.

**P: ¿Hay tests?**  
R: Actualmente no. Roadmap para v1.1 incluye testing con Jest.

**P: ¿Cómo reporto un bug?**  
R: Abre un issue en GitHub con label "bug" y template.

### Desarrollo

**P: ¿Dónde pongo una nueva página?**  
R: `/src/app/nombre-pagina/page.tsx`

**P: ¿Dónde pongo un nuevo endpoint?**  
R: `/src/app/api/nombre-endpoint/route.ts`

**P: ¿Cómo agrego una nueva columna a la DB?**  
R: Edita `schema.prisma` → `npx prisma migrate dev --name add_columna`

**P: ¿Puedo usar otra librería de UI?**  
R: Preferible no agregar frameworks CSS grandes. Evaluar con el equipo.

### Deploy

**P: ¿Cuánto tarda el deploy?**  
R: Vercel: ~2 minutos. Railway: ~3 minutos.

**P: ¿Cómo hago rollback?**  
R: Ver [DEPLOYMENT.md](./DEPLOYMENT.md) → Rollback

**P: ¿Puedo usar SQLite en producción?**  
R: No recomendado. Usar PostgreSQL.

---

## 🔐 **Seguridad**

### Reportar Vulnerabilidades

**No abrir issues públicos.**

Enviar email privado a: [tu-email@dominio.com]

Incluir:
- Descripción de la vulnerabilidad
- Pasos para reproducir
- Impacto potencial
- Sugerencia de fix (si tienes)

### Buenas Prácticas

- ✅ Never commit `.env` files
- ✅ Rotar API keys regularmente
- ✅ Usar HTTPS en producción
- ✅ Validar todos los inputs (Zod)
- ✅ Sanitizar queries (Prisma)
- ✅ Rate limiting en producción

---

## 📞 **Soporte y Contacto**

### Canales

- **Issues de GitHub**: Para bugs y features
- **Discussions**: Para preguntas generales
- **Email**: [tu-email@dominio.com]
- **Slack/Discord**: [Link si aplica]

### Respuesta Esperada

- **Bugs críticos**: < 24 horas
- **Bugs menores**: < 1 semana
- **Features**: Depende del roadmap
- **Preguntas**: < 48 horas

---

## 🎓 **Recursos de Aprendizaje**

### Para Nuevos en Next.js

- [Next.js Tutorial](https://nextjs.org/learn)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Vercel Guide to Next.js](https://vercel.com/docs/frameworks/nextjs)

### Para Nuevos en Prisma

- [Prisma Quickstart](https://www.prisma.io/docs/getting-started/quickstart)
- [Prisma with Next.js](https://www.prisma.io/nextjs)

### Para Nuevos en TypeScript

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

---

## 🗺️ **Roadmap de Documentación**

### Completado ✅

- [x] README principal
- [x] Guía de arquitectura
- [x] Referencia de APIs
- [x] Documentación de base de datos
- [x] Guía de despliegue
- [x] Módulo de CSV sessions

### En Progreso 🔄

- [ ] Testing guide
- [ ] Contributing guide detallada
- [ ] Code style guide

### Planeado 📋

- [ ] Video walkthroughs
- [ ] Diagramas interactivos
- [ ] Storybook para componentes
- [ ] API changelog automático

---

## 📜 **Licencia**

Este proyecto está bajo la licencia MIT. Ver [LICENSE](../LICENSE) para detalles.

---

## 🙏 **Agradecimientos**

- Equipo de desarrollo original
- Comunidad open source
- Contributors actuales y futuros

---

<div align="center">

**¿Tienes preguntas? ¿Encontraste un error en la documentación?**

👉 [Abre un issue](https://github.com/your-repo/issues)  
👉 [Contribuye con mejoras](#)

**Hecho con ❤️ para desarrolladores**

**Última actualización:** Octubre 2025

</div>
