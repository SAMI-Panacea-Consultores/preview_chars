import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/cleanup-pending:
 *   delete:
 *     tags:
 *       - Limpieza de Datos
 *     summary: Eliminar registros pendientes sin contenido
 *     description: |
 *       Elimina todos los registros con categoría "Pendiente" que no tienen contenido 
 *       en la columna "publicar". Estos registros no pueden ser procesados por GPT-5
 *       ya que no tienen texto para analizar.
 *       
 *       **Condiciones para eliminación:**
 *       - categoria = 'Pendiente'
 *       - publicar IS NULL OR publicar = ''
 *       
 *       **Seguridad:**
 *       - Solo elimina registros que no pueden ser procesados
 *       - Retorna información detallada de los registros eliminados
 *       
 *     responses:
 *       200:
 *         description: Limpieza completada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Limpieza completada"
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalPendientesAntes:
 *                       type: number
 *                       description: Total de registros pendientes antes de la limpieza
 *                     eliminados:
 *                       type: number
 *                       description: Registros eliminados (sin contenido)
 *                     conservados:
 *                       type: number
 *                       description: Registros pendientes conservados (con contenido)
 *                     totalPendientesDespues:
 *                       type: number
 *                       description: Total de registros pendientes después de la limpieza
 *                 eliminatedRecords:
 *                   type: array
 *                   description: Lista de IDs de registros eliminados
 *                   items:
 *                     type: string
 *       400:
 *         description: Error en la solicitud
 *       500:
 *         description: Error interno del servidor
 */
export async function DELETE(request: NextRequest) {
  try {
    console.log('🧹 Iniciando limpieza de registros pendientes sin contenido...');
    
    // Contar registros pendientes antes de la limpieza
    const totalPendientesAntes = await prisma.publicacion.count({
      where: { categoria: 'Pendiente' }
    });
    
    console.log(`📊 Total de registros pendientes antes: ${totalPendientesAntes}`);
    
    // Obtener registros pendientes sin contenido para logging
    const registrosParaEliminar = await prisma.publicacion.findMany({
      where: {
        categoria: 'Pendiente',
        OR: [
          { publicar: null },
          { publicar: '' }
        ]
      },
      select: {
        id: true,
        perfil: true,
        fecha: true
      }
    });
    
    console.log(`🗑️  Registros a eliminar: ${registrosParaEliminar.length}`);
    
    if (registrosParaEliminar.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay registros pendientes sin contenido para eliminar',
        stats: {
          totalPendientesAntes,
          eliminados: 0,
          conservados: totalPendientesAntes,
          totalPendientesDespues: totalPendientesAntes
        },
        eliminatedRecords: []
      });
    }
    
    // Eliminar registros sin contenido
    const resultadoEliminacion = await prisma.publicacion.deleteMany({
      where: {
        categoria: 'Pendiente',
        OR: [
          { publicar: null },
          { publicar: '' }
        ]
      }
    });
    
    // Contar registros pendientes después de la limpieza
    const totalPendientesDespues = await prisma.publicacion.count({
      where: { categoria: 'Pendiente' }
    });
    
    const eliminados = resultadoEliminacion.count;
    const conservados = totalPendientesDespues;
    
    console.log(`✅ Limpieza completada:`);
    console.log(`   • Eliminados: ${eliminados}`);
    console.log(`   • Conservados: ${conservados}`);
    console.log(`   • Total después: ${totalPendientesDespues}`);
    
    // Extraer solo los IDs para la respuesta
    const eliminatedRecords = registrosParaEliminar.map(r => r.id);
    
    return NextResponse.json({
      success: true,
      message: 'Limpieza completada',
      stats: {
        totalPendientesAntes,
        eliminados,
        conservados,
        totalPendientesDespues
      },
      eliminatedRecords
    });
    
  } catch (error) {
    console.error('❌ Error en limpieza de registros pendientes:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Error desconocido',
      statusCode: 500,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
