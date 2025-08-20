import { createSwaggerSpec } from 'next-swagger-doc';

export const getApiDocs = () => {
  const spec = createSwaggerSpec({
    apiFolder: 'src/app/api',
    definition: {
      openapi: '3.0.3',
      info: {
        title: 'Andi Analytics API',
        description: `
# API para Análisis de Publicaciones en Redes Sociales

Esta API permite gestionar y analizar publicaciones de redes sociales, proporcionando:

- **Gestión de Publicaciones**: Crear, leer, actualizar y eliminar publicaciones
- **Importación CSV**: Carga masiva de datos desde archivos CSV
- **Analytics**: Métricas y análisis de rendimiento por red, perfil y categoría
- **Filtros Avanzados**: Búsqueda y filtrado con múltiples criterios
- **Paginación**: Manejo eficiente de grandes volúmenes de datos

## Características

- ✅ **Validación robusta** con esquemas Zod
- ✅ **Manejo de errores** estandarizado
- ✅ **Rate limiting** para protección
- ✅ **CORS** configurado
- ✅ **Paginación** automática
- ✅ **Filtros múltiples** y ordenamiento
- ✅ **Logging** de requests

## Formatos de Fecha

Todas las fechas deben estar en formato ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ).
Para uploads CSV, se acepta el formato M/D/YYYY H:MM am/pm.

## Códigos de Estado

- **200**: Éxito
- **201**: Creado exitosamente
- **400**: Error de validación
- **409**: Conflicto (duplicados)
- **422**: Datos no procesables
- **429**: Límite de requests excedido
- **500**: Error interno del servidor
        `,
        version: '1.0.0',
        contact: {
          name: 'SAMI Panacea Consultores',
          url: 'https://github.com/SAMI-Panacea-Consultores/preview_chars',
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
      },
      servers: [
        {
          url: process.env.NODE_ENV === 'production' 
            ? 'https://your-domain.com/api' 
            : 'http://localhost:3000/api',
          description: process.env.NODE_ENV === 'production' ? 'Producción' : 'Desarrollo',
        },
      ],
      components: {
        schemas: {
          Publication: {
            type: 'object',
            required: ['ID', 'Fecha', 'Red', 'Perfil', 'categoria'],
            properties: {
              ID: {
                type: 'string',
                description: 'Identificador único de la publicación',
                example: '18295603831218598',
              },
              Fecha: {
                type: 'string',
                format: 'date-time',
                description: 'Fecha y hora de la publicación',
                example: '2025-06-06T12:00:00.000Z',
              },
              Red: {
                type: 'string',
                enum: ['Instagram', 'Facebook', 'TikTok', 'Twitter'],
                description: 'Red social donde se publicó',
                example: 'Instagram',
              },
              Perfil: {
                type: 'string',
                description: 'Nombre del perfil que realizó la publicación',
                example: 'bienesyservicioscali',
              },
              categoria: {
                type: 'string',
                description: 'Categoría de la publicación',
                example: 'SEGURIDAD',
              },
              Impresiones: {
                type: 'string',
                description: 'Número de impresiones (como string para compatibilidad)',
                example: '1051',
              },
              Alcance: {
                type: 'string',
                description: 'Número de personas alcanzadas',
                example: '695',
              },
              'Me gusta': {
                type: 'string',
                description: 'Número de me gusta recibidos',
                example: '46',
              },
            },
          },
          PaginationMeta: {
            type: 'object',
            properties: {
              total: {
                type: 'integer',
                description: 'Total de registros disponibles',
                example: 7906,
              },
              limit: {
                type: 'integer',
                description: 'Número de registros por página',
                example: 100,
              },
              offset: {
                type: 'integer',
                description: 'Número de registros omitidos',
                example: 0,
              },
              hasNext: {
                type: 'boolean',
                description: 'Indica si hay más páginas',
                example: true,
              },
              hasPrev: {
                type: 'boolean',
                description: 'Indica si hay páginas anteriores',
                example: false,
              },
            },
          },
          PublicationStats: {
            type: 'object',
            properties: {
              totalPublicaciones: {
                type: 'integer',
                description: 'Total de publicaciones',
                example: 7906,
              },
              redes: {
                type: 'array',
                items: { type: 'string' },
                description: 'Lista de redes sociales disponibles',
                example: ['Instagram', 'Facebook'],
              },
              perfiles: {
                type: 'array',
                items: { type: 'string' },
                description: 'Lista de perfiles disponibles',
                example: ['bienesyservicioscali', 'secpazycccali'],
              },
              categorias: {
                type: 'array',
                items: { type: 'string' },
                description: 'Lista de categorías disponibles',
                example: ['SEGURIDAD', 'INVERTIR PARA CRECER', 'Sin categoría'],
              },
            },
          },
          ApiResponse: {
            type: 'object',
            properties: {
              data: {
                description: 'Datos de respuesta (tipo variable según endpoint)',
              },
              meta: {
                $ref: '#/components/schemas/PaginationMeta',
              },
              stats: {
                $ref: '#/components/schemas/PublicationStats',
              },
              message: {
                type: 'string',
                description: 'Mensaje descriptivo de la operación',
                example: '100 publicaciones encontradas de 7906 total',
              },
            },
          },
          ApiError: {
            type: 'object',
            required: ['error', 'message', 'statusCode', 'timestamp'],
            properties: {
              error: {
                type: 'string',
                description: 'Tipo de error',
                example: 'Validation Error',
              },
              message: {
                type: 'string',
                description: 'Descripción del error',
                example: 'Los parámetros proporcionados no son válidos',
              },
              statusCode: {
                type: 'integer',
                description: 'Código de estado HTTP',
                example: 400,
              },
              details: {
                type: 'object',
                description: 'Detalles adicionales del error',
              },
              timestamp: {
                type: 'string',
                format: 'date-time',
                description: 'Fecha y hora del error',
                example: '2025-08-20T10:30:00.000Z',
              },
            },
          },
          UploadResult: {
            type: 'object',
            properties: {
              success: {
                type: 'boolean',
                description: 'Indica si la operación fue exitosa',
                example: true,
              },
              inserted: {
                type: 'integer',
                description: 'Número de registros insertados',
                example: 1400,
              },
              updated: {
                type: 'integer',
                description: 'Número de registros actualizados',
                example: 0,
              },
              errors: {
                type: 'integer',
                description: 'Número de errores encontrados',
                example: 0,
              },
              totalRows: {
                type: 'integer',
                description: 'Total de filas procesadas del CSV',
                example: 1400,
              },
              processedRows: {
                type: 'integer',
                description: 'Filas procesadas exitosamente',
                example: 1400,
              },
              message: {
                type: 'string',
                description: 'Mensaje descriptivo del resultado',
                example: '1400 nuevas publicaciones insertadas',
              },
              stats: {
                type: 'object',
                properties: {
                  fileSize: {
                    type: 'string',
                    description: 'Tamaño del archivo procesado',
                    example: '2048.50 KB',
                  },
                  processingTime: {
                    type: 'string',
                    description: 'Tiempo de procesamiento',
                    example: '3450ms',
                  },
                  categoriesFound: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Categorías encontradas en el archivo',
                  },
                  profilesFound: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Perfiles encontrados en el archivo',
                  },
                  networksFound: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Redes encontradas en el archivo',
                  },
                },
              },
            },
          },
          DuplicateResponse: {
            type: 'object',
            properties: {
              success: {
                type: 'boolean',
                example: false,
              },
              duplicates: {
                type: 'array',
                items: { type: 'string' },
                description: 'Lista de IDs duplicados encontrados (limitado a 100)',
                example: ['18295603831218598', '18042721475255862'],
              },
              totalRows: {
                type: 'integer',
                description: 'Total de filas en el CSV',
                example: 1400,
              },
              duplicateCount: {
                type: 'integer',
                description: 'Número total de duplicados',
                example: 150,
              },
              newRows: {
                type: 'integer',
                description: 'Número de filas nuevas que se insertarían',
                example: 1250,
              },
              message: {
                type: 'string',
                description: 'Mensaje sobre los duplicados',
                example: '150 publicaciones duplicadas encontradas',
              },
            },
          },
        },
        parameters: {
          RedParam: {
            name: 'red',
            in: 'query',
            description: 'Filtrar por red social específica',
            required: false,
            schema: {
              type: 'string',
              enum: ['Instagram', 'Facebook', 'TikTok', 'Twitter'],
            },
            example: 'Instagram',
          },
          PerfilParam: {
            name: 'perfil',
            in: 'query',
            description: 'Filtrar por perfil específico',
            required: false,
            schema: {
              type: 'string',
            },
            example: 'bienesyservicioscali',
          },
          CategoriaParam: {
            name: 'categoria',
            in: 'query',
            description: 'Filtrar por categoría específica',
            required: false,
            schema: {
              type: 'string',
            },
            example: 'SEGURIDAD',
          },
          FechaInicioParam: {
            name: 'fechaInicio',
            in: 'query',
            description: 'Fecha de inicio del filtro (ISO 8601)',
            required: false,
            schema: {
              type: 'string',
              format: 'date-time',
            },
            example: '2025-06-01T00:00:00.000Z',
          },
          FechaFinParam: {
            name: 'fechaFin',
            in: 'query',
            description: 'Fecha de fin del filtro (ISO 8601)',
            required: false,
            schema: {
              type: 'string',
              format: 'date-time',
            },
            example: '2025-06-07T23:59:59.999Z',
          },
          LimitParam: {
            name: 'limit',
            in: 'query',
            description: 'Número máximo de registros a retornar',
            required: false,
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 1000,
              default: 100,
            },
            example: 100,
          },
          OffsetParam: {
            name: 'offset',
            in: 'query',
            description: 'Número de registros a omitir (para paginación)',
            required: false,
            schema: {
              type: 'integer',
              minimum: 0,
              default: 0,
            },
            example: 0,
          },
          SortByParam: {
            name: 'sortBy',
            in: 'query',
            description: 'Campo por el cual ordenar',
            required: false,
            schema: {
              type: 'string',
              enum: ['fecha', 'impresiones', 'alcance', 'meGusta'],
              default: 'fecha',
            },
            example: 'fecha',
          },
          SortOrderParam: {
            name: 'sortOrder',
            in: 'query',
            description: 'Orden de clasificación',
            required: false,
            schema: {
              type: 'string',
              enum: ['asc', 'desc'],
              default: 'desc',
            },
            example: 'desc',
          },
        },
        responses: {
          ValidationError: {
            description: 'Error de validación de parámetros',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ApiError',
                },
                example: {
                  error: 'Validation Error',
                  message: 'Los parámetros proporcionados no son válidos',
                  statusCode: 400,
                  details: {
                    issues: [
                      {
                        path: 'limit',
                        message: 'Number must be less than or equal to 1000',
                        code: 'too_big',
                      },
                    ],
                  },
                  timestamp: '2025-08-20T10:30:00.000Z',
                },
              },
            },
          },
          InternalError: {
            description: 'Error interno del servidor',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ApiError',
                },
                example: {
                  error: 'Internal Server Error',
                  message: 'Error interno del servidor',
                  statusCode: 500,
                  timestamp: '2025-08-20T10:30:00.000Z',
                },
              },
            },
          },
          RateLimitError: {
            description: 'Límite de requests excedido',
            headers: {
              'X-RateLimit-Limit': {
                description: 'Límite de requests por ventana',
                schema: { type: 'integer' },
              },
              'X-RateLimit-Remaining': {
                description: 'Requests restantes en la ventana actual',
                schema: { type: 'integer' },
              },
              'X-RateLimit-Reset': {
                description: 'Timestamp cuando se resetea el límite',
                schema: { type: 'integer' },
              },
            },
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ApiError',
                },
                example: {
                  error: 'Too Many Requests',
                  message: 'Límite de 100 solicitudes por 15 minutos excedido',
                  statusCode: 429,
                  timestamp: '2025-08-20T10:30:00.000Z',
                },
              },
            },
          },
        },
      },
      tags: [
        {
          name: 'Publicaciones',
          description: 'Gestión de publicaciones de redes sociales',
        },
        {
          name: 'Analytics',
          description: 'Análisis y métricas de publicaciones',
        },
        {
          name: 'Upload',
          description: 'Carga masiva de datos desde CSV',
        },
      ],
    },
  });

  return spec;
};
