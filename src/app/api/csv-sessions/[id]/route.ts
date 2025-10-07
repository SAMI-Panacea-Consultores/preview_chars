import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiResponse, withErrorHandling, withMethods, withCORS, withRateLimit, logRequest } from '@/lib/api-utils'

/**
 * @swagger
 * /api/csv-sessions/{id}:
 *   get:
 *     summary: Obtener detalles de una sesión CSV específica
 *     description: |
 *       Obtiene información detallada de una sesión de carga CSV específica,
 *       incluyendo estadísticas completas y datos de las publicaciones asociadas.
 *     tags:
 *       - CSV Sessions
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID único de la sesión CSV
 *     responses:
 *       200:
 *         description: Detalles de la sesión CSV
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CsvSessionDetail'
 *       404:
 *         description: Sesión no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
async function handleGET(request: NextRequest, { params }: { params: { id: string } }) {
  const startTime = Date.now();
  
  try {
    const sessionId = params.id;
    
    if (!sessionId) {
      return NextResponse.json({
        error: 'Bad Request',
        message: 'ID de sesión requerido',
        statusCode: 400,
        timestamp: new Date().toISOString(),
      }, { status: 400 });
    }
    
    // Obtener sesión con publicaciones asociadas
    const session = await prisma.csvSession.findUnique({
      where: { id: sessionId },
      include: {
        publicaciones: {
          take: 10, // Solo las primeras 10 para muestra
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            fecha: true,
            red: true,
            perfil: true,
            categoria: true,
            tipoPublicacion: true,
            impresiones: true,
            alcance: true,
            meGusta: true,
            createdAt: true
          }
        },
        _count: {
          select: { publicaciones: true }
        }
      }
    });
    
    if (!session) {
      return NextResponse.json({
        error: 'Not Found',
        message: 'Sesión CSV no encontrada',
        statusCode: 404,
        timestamp: new Date().toISOString(),
      }, { status: 404 });
    }
    
    // Formatear respuesta
    const formattedSession = {
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
      errorDetails: session.errorDetails ? JSON.parse(session.errorDetails) : null,
      
      // Métricas calculadas
      successRate: session.totalRows > 0 ? 
        ((session.insertedRows + session.updatedRows) / session.totalRows * 100).toFixed(1) : '0',
      errorRate: session.totalRows > 0 ? 
        (session.errorRows / session.totalRows * 100).toFixed(1) : '0',
      duplicateRate: session.totalRows > 0 ? 
        (session.duplicateRows / session.totalRows * 100).toFixed(1) : '0',
      excludedRate: session.totalRows > 0 ? 
        (session.excludedHistorias / session.totalRows * 100).toFixed(1) : '0',
      
      // Duración formateada
      duration: session.processingTime ? 
        `${(session.processingTime / 1000).toFixed(2)}s` : null,
      
      // Muestra de publicaciones
      samplePublications: session.publicaciones,
      
      // Información adicional
      fileInfo: {
        sizeFormatted: `${(session.fileSize / 1024).toFixed(2)} KB`,
        sizeBytes: session.fileSize
      }
    };
    
    logRequest(request, { statusCode: 200 } as any, startTime);
    
    return NextResponse.json({
      success: true,
      data: formattedSession
    });
    
  } catch (error) {
    console.error('Error fetching CSV session details:', error);
    
    return NextResponse.json({
      error: 'Internal Server Error',
      message: 'Error interno del servidor al obtener los detalles de la sesión CSV',
      statusCode: 500,
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export const GET = handleGET;
