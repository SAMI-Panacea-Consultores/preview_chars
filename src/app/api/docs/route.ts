import { NextRequest, NextResponse } from 'next/server';
import { getApiDocs } from '@/lib/swagger';

/**
 * @swagger
 * /api/docs:
 *   get:
 *     summary: Obtener documentación OpenAPI
 *     description: Retorna la especificación OpenAPI/Swagger de la API
 *     tags:
 *       - Documentación
 *     responses:
 *       200:
 *         description: Especificación OpenAPI en formato JSON
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
export async function GET(request: NextRequest) {
  try {
    const spec = getApiDocs();
    
    return NextResponse.json(spec, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error generating API docs:', error);
    
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Error al generar la documentación de la API',
        statusCode: 500,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
