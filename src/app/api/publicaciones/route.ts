import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PublicationQuerySchema, validateSchema } from '@/lib/schemas'
import { ApiResponse, withErrorHandling, withMethods, withCORS, logRequest } from '@/lib/api-utils'

/**
 * @swagger
 * /api/publicaciones:
 *   get:
 *     summary: Obtener publicaciones
 *     description: Recupera publicaciones con filtros opcionales y paginación
 *     tags:
 *       - Publicaciones
 *     parameters:
 *       - $ref: '#/components/parameters/RedParam'
 *       - $ref: '#/components/parameters/PerfilParam'
 *       - $ref: '#/components/parameters/CategoriaParam'
 *       - $ref: '#/components/parameters/FechaInicioParam'
 *       - $ref: '#/components/parameters/FechaFinParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/OffsetParam'
 *       - $ref: '#/components/parameters/SortByParam'
 *       - $ref: '#/components/parameters/SortOrderParam'
 *     responses:
 *       200:
 *         description: Lista de publicaciones con metadatos
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Publication'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
async function handleGET(request: NextRequest) {
  const startTime = Date.now()
  const { searchParams } = new URL(request.url)
  
  // Convertir searchParams a objeto
  const queryParams = Object.fromEntries(searchParams.entries())
  
  // Validar parámetros
  try {
    const validatedData = PublicationQuerySchema.parse(queryParams)
    
    const { 
      red, 
      perfil, 
      categoria, 
      fechaInicio, 
      fechaFin, 
      limit, 
      offset, 
      sortBy, 
      sortOrder 
    } = validatedData

    // Construir filtros
    const where: any = {}
    
    if (red) where.red = red
    if (perfil) where.perfil = perfil
    if (categoria) where.categoria = categoria
    
    if (fechaInicio || fechaFin) {
      where.fecha = {}
      if (fechaInicio) where.fecha.gte = new Date(fechaInicio)
      if (fechaFin) where.fecha.lte = new Date(fechaFin)
    }

    // Configurar ordenamiento
    const orderBy: any = {}
    orderBy[sortBy] = sortOrder
    // Obtener publicaciones con paginación
    const [publicaciones, total] = await Promise.all([
      prisma.publicacion.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
      }),
      prisma.publicacion.count({ where })
    ])

    // Calcular estadísticas (solo de los datos filtrados, no paginados)
    const statsData = await prisma.publicacion.findMany({
      where,
      select: {
        red: true,
        perfil: true,
        categoria: true,
      }
    })

    const stats = {
      totalPublicaciones: total,
      redes: [...new Set(statsData.map(p => p.red))],
      perfiles: [...new Set(statsData.map(p => p.perfil))],
      categorias: [...new Set(statsData.map(p => p.categoria))],
    }

    const meta = {
      total,
      limit,
      offset,
      hasNext: offset + limit < total,
      hasPrev: offset > 0,
    }

    // Transformar datos para el frontend (mantener compatibilidad)
    const data = publicaciones.map(pub => ({
      ID: pub.id,
      Fecha: pub.fecha.toISOString(),
      Red: pub.red,
      Perfil: pub.perfil,
      categoria: pub.categoria,
      Impresiones: pub.impresiones.toString(),
      Alcance: pub.alcance.toString(),
      'Me gusta': pub.meGusta.toString()
    }))

    // Log de la request
    logRequest(request, { statusCode: 200 } as any, startTime)

    return NextResponse.json({
      data,
      meta,
      stats,
      message: `${publicaciones.length} publicaciones encontradas de ${total} total`
    })

  } catch (error) {
    console.error('Error fetching publicaciones:', error)
    
    // Manejar errores de validación Zod
    if (error instanceof Error && error.name === 'ZodError') {
      const zodError = error as any;
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Los parámetros proporcionados no son válidos',
          statusCode: 400,
          details: {
            issues: zodError.issues?.map((issue: any) => ({
              path: issue.path.join('.'),
              message: issue.message,
              code: issue.code,
            })) || [],
            formattedErrors: zodError.flatten?.() || {},
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      {
        error: 'Database Error',
        message: 'Error al obtener publicaciones de la base de datos',
        statusCode: 500,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/publicaciones:
 *   post:
 *     summary: Obtener estadísticas avanzadas
 *     description: Calcula estadísticas detalladas de publicaciones con filtros opcionales
 *     tags:
 *       - Analytics
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [stats]
 *                 description: Tipo de estadística a calcular
 *                 example: stats
 *               filters:
 *                 type: object
 *                 description: Filtros opcionales para las estadísticas
 *                 properties:
 *                   red:
 *                     type: string
 *                     example: Instagram
 *                   perfil:
 *                     type: string
 *                     example: bienesyservicioscali
 *                   categoria:
 *                     type: string
 *                     example: SEGURIDAD
 *                   fechaInicio:
 *                     type: string
 *                     format: date-time
 *                     example: 2025-06-01T00:00:00.000Z
 *                   fechaFin:
 *                     type: string
 *                     format: date-time
 *                     example: 2025-06-07T23:59:59.999Z
 *     responses:
 *       200:
 *         description: Estadísticas detalladas calculadas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalPublicaciones:
 *                       type: integer
 *                       example: 7906
 *                     redes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           red:
 *                             type: string
 *                           publicaciones:
 *                             type: integer
 *                           totalImpresiones:
 *                             type: integer
 *                           totalAlcance:
 *                             type: integer
 *                           totalMeGusta:
 *                             type: integer
 *                           promedioImpresiones:
 *                             type: integer
 *                           promedioAlcance:
 *                             type: integer
 *                           promedioMeGusta:
 *                             type: integer
 *                     perfiles:
 *                       type: array
 *                       items:
 *                         type: object
 *                     categorias:
 *                       type: array
 *                       items:
 *                         type: object
 *                     metricas:
 *                       type: object
 *                 message:
 *                   type: string
 *                   example: Estadísticas calculadas exitosamente
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
// Endpoint para estadísticas avanzadas
async function handlePOST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const body = await request.json()
    const { type, filters } = body

    if (type === 'stats') {
      // Construir filtros si se proporcionan
      const where: any = {}
      if (filters) {
        if (filters.red) where.red = filters.red
        if (filters.perfil) where.perfil = filters.perfil
        if (filters.categoria) where.categoria = filters.categoria
        if (filters.fechaInicio || filters.fechaFin) {
          where.fecha = {}
          if (filters.fechaInicio) where.fecha.gte = new Date(filters.fechaInicio)
          if (filters.fechaFin) where.fecha.lte = new Date(filters.fechaFin)
        }
      }

      // Obtener estadísticas detalladas
      const [
        totalPublicaciones,
        redesStats,
        perfilesStats,
        categoriasStats,
        metricsStats
      ] = await Promise.all([
        prisma.publicacion.count({ where }),
        
        prisma.publicacion.groupBy({
          by: ['red'],
          where,
          _count: { id: true },
          _sum: {
            impresiones: true,
            alcance: true,
            meGusta: true,
          },
          _avg: {
            impresiones: true,
            alcance: true,
            meGusta: true,
          }
        }),

        prisma.publicacion.groupBy({
          by: ['perfil'],
          where,
          _count: { id: true },
          _sum: {
            impresiones: true,
            alcance: true,
            meGusta: true,
          },
          orderBy: {
            _count: { id: 'desc' }
          },
          take: 20 // Top 20 perfiles
        }),

        prisma.publicacion.groupBy({
          by: ['categoria'],
          where,
          _count: { id: true },
          _sum: {
            impresiones: true,
            alcance: true,
            meGusta: true,
          },
          _avg: {
            impresiones: true,
            alcance: true,
            meGusta: true,
          }
        }),

        // Métricas totales
        prisma.publicacion.aggregate({
          where,
          _sum: {
            impresiones: true,
            alcance: true,
            meGusta: true,
          },
          _avg: {
            impresiones: true,
            alcance: true,
            meGusta: true,
          },
          _max: {
            impresiones: true,
            alcance: true,
            meGusta: true,
          },
          _min: {
            impresiones: true,
            alcance: true,
            meGusta: true,
          }
        })
      ])

      logRequest(request, { statusCode: 200 } as any, startTime)

      return NextResponse.json({
        data: {
          totalPublicaciones,
          redes: redesStats.map(r => ({
            red: r.red,
            publicaciones: r._count.id,
            totalImpresiones: r._sum.impresiones || 0,
            totalAlcance: r._sum.alcance || 0,
            totalMeGusta: r._sum.meGusta || 0,
            promedioImpresiones: Math.round(r._avg.impresiones || 0),
            promedioAlcance: Math.round(r._avg.alcance || 0),
            promedioMeGusta: Math.round(r._avg.meGusta || 0),
          })),
          perfiles: perfilesStats.map(p => ({
            perfil: p.perfil,
            publicaciones: p._count.id,
            totalImpresiones: p._sum.impresiones || 0,
            totalAlcance: p._sum.alcance || 0,
            totalMeGusta: p._sum.meGusta || 0,
          })),
          categorias: categoriasStats.map(c => ({
            categoria: c.categoria,
            publicaciones: c._count.id,
            totalImpresiones: c._sum.impresiones || 0,
            totalAlcance: c._sum.alcance || 0,
            totalMeGusta: c._sum.meGusta || 0,
            promedioImpresiones: Math.round(c._avg.impresiones || 0),
            promedioAlcance: Math.round(c._avg.alcance || 0),
            promedioMeGusta: Math.round(c._avg.meGusta || 0),
          })),
          metricas: {
            totalImpresiones: metricsStats._sum.impresiones || 0,
            totalAlcance: metricsStats._sum.alcance || 0,
            totalMeGusta: metricsStats._sum.meGusta || 0,
            promedioImpresiones: Math.round(metricsStats._avg.impresiones || 0),
            promedioAlcance: Math.round(metricsStats._avg.alcance || 0),
            promedioMeGusta: Math.round(metricsStats._avg.meGusta || 0),
            maxImpresiones: metricsStats._max.impresiones || 0,
            maxAlcance: metricsStats._max.alcance || 0,
            maxMeGusta: metricsStats._max.meGusta || 0,
            minImpresiones: metricsStats._min.impresiones || 0,
            minAlcance: metricsStats._min.alcance || 0,
            minMeGusta: metricsStats._min.meGusta || 0,
          }
        },
        message: 'Estadísticas calculadas exitosamente'
      })
    }

    return NextResponse.json({
      error: 'Bad Request',
      message: 'Tipo de solicitud no válido',
      statusCode: 400,
      timestamp: new Date().toISOString(),
    }, { status: 400 })

  } catch (error) {
    console.error('Error in POST publicaciones:', error)
    return NextResponse.json({
      error: 'Internal Server Error',
      message: 'Error interno del servidor',
      statusCode: 500,
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}

// Exportar funciones directamente (App Router maneja CORS automáticamente)
export const GET = handleGET
export const POST = handlePOST