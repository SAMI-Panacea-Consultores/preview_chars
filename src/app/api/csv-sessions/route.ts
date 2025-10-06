import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiResponse, withErrorHandling, withMethods, withCORS, withRateLimit, logRequest } from '@/lib/api-utils'

/**
 * @swagger
 * /api/csv-sessions:
 *   get:
 *     summary: Listar sesiones de carga CSV
 *     description: |
 *       Obtiene el historial de sesiones de carga CSV con paginación y filtros.
 *       
 *       **Funcionalidades:**
 *       - Paginación configurable
 *       - Filtros por estado, nombre de archivo, fechas
 *       - Ordenamiento por fecha de creación
 *       - Estadísticas detalladas por sesión
 *       
 *       **Estados de sesión:**
 *       - `processing`: En proceso
 *       - `completed`: Completada exitosamente
 *       - `failed`: Falló durante el procesamiento
 *       - `partial`: Completada con errores parciales
 *     tags:
 *       - CSV Sessions
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Número de elementos por página
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [processing, completed, failed, partial]
 *         description: Filtrar por estado de sesión
 *       - in: query
 *         name: fileName
 *         schema:
 *           type: string
 *         description: Buscar por nombre de archivo (coincidencia parcial)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio para filtrar sesiones (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin para filtrar sesiones (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Lista de sesiones CSV
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CsvSession'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     hasNext:
 *                       type: boolean
 *                     hasPrev:
 *                       type: boolean
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalSessions:
 *                       type: integer
 *                     completedSessions:
 *                       type: integer
 *                     failedSessions:
 *                       type: integer
 *                     totalRecordsProcessed:
 *                       type: integer
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
async function handleGET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    
    // Parámetros de paginación
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;
    
    // Parámetros de filtrado
    const status = searchParams.get('status');
    const fileName = searchParams.get('fileName');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Construir filtros
    const where: any = {};
    
    if (status && ['processing', 'completed', 'failed', 'partial'].includes(status)) {
      where.status = status;
    }
    
    if (fileName) {
      where.fileName = {
        contains: fileName,
        mode: 'insensitive'
      };
    }
    
    if (startDate || endDate) {
      where.startedAt = {};
      if (startDate) {
        where.startedAt.gte = new Date(startDate);
      }
      if (endDate) {
        // Incluir todo el día de la fecha final
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        where.startedAt.lte = endDateTime;
      }
    }
    
    // Obtener sesiones con paginación
    const [sessions, totalCount] = await Promise.all([
      prisma.csvSession.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        skip: offset,
        take: limit,
        include: {
          _count: {
            select: { publicaciones: true }
          }
        }
      }),
      prisma.csvSession.count({ where })
    ]);
    
    // Calcular estadísticas globales
    const [stats] = await Promise.all([
      prisma.csvSession.aggregate({
        _count: { id: true },
        _sum: { 
          insertedRows: true,
          updatedRows: true,
          errorRows: true
        }
      })
    ]);
    
    const statusCounts = await prisma.csvSession.groupBy({
      by: ['status'],
      _count: { id: true }
    });
    
    // Formatear datos de respuesta
    const formattedSessions = sessions.map(session => ({
      id: session.id,
      fileName: session.fileName,
      fileSize: session.fileSize,
      status: session.status,
      totalRows: session.totalRows,
      processedRows: session.processedRows,
      insertedRows: session.insertedRows,
      updatedRows: session.updatedRows,
      errorRows: session.errorRows,
      duplicateRows: session.duplicateRows,
      excludedHistorias: session.excludedHistorias,
      overwrite: session.overwrite,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      processingTime: session.processingTime,
      errorMessage: session.errorMessage,
      publicationCount: session._count.publicaciones,
      
      // Parsear JSON fields
      categoriesFound: session.categoriesFound ? JSON.parse(session.categoriesFound) : [],
      profilesFound: session.profilesFound ? JSON.parse(session.profilesFound) : [],
      networksFound: session.networksFound ? JSON.parse(session.networksFound) : [],
      originalHeaders: session.originalHeaders ? JSON.parse(session.originalHeaders) : [],
      detectedColumns: session.detectedColumns ? JSON.parse(session.detectedColumns) : {},
      
      // Métricas calculadas
      successRate: session.totalRows > 0 ? 
        ((session.insertedRows + session.updatedRows) / session.totalRows * 100).toFixed(1) : '0',
      errorRate: session.totalRows > 0 ? 
        (session.errorRows / session.totalRows * 100).toFixed(1) : '0'
    }));
    
    // Calcular paginación
    const totalPages = Math.ceil(totalCount / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;
    
    // Formatear estadísticas
    const statusMap = statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count.id;
      return acc;
    }, {} as Record<string, number>);
    
    logRequest(request, { statusCode: 200 } as any, startTime);
    
    return NextResponse.json({
      success: true,
      data: formattedSessions,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext,
        hasPrev
      },
      stats: {
        totalSessions: stats._count.id || 0,
        completedSessions: statusMap.completed || 0,
        failedSessions: statusMap.failed || 0,
        processingSessions: statusMap.processing || 0,
        partialSessions: statusMap.partial || 0,
        totalRecordsProcessed: (stats._sum.insertedRows || 0) + (stats._sum.updatedRows || 0),
        totalErrors: stats._sum.errorRows || 0
      }
    });
    
  } catch (error) {
    console.error('Error fetching CSV sessions:', error);
    
    return NextResponse.json({
      error: 'Internal Server Error',
      message: 'Error interno del servidor al obtener las sesiones CSV',
      statusCode: 500,
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// Exportar función directamente (App Router maneja CORS automáticamente)
export const GET = handleGET;
