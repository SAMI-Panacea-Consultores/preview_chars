import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { z } from 'zod';

const prisma = new PrismaClient();

// Categorías válidas basadas en el sistema actual
const CATEGORIAS_VALIDAS = [
  'TRANSPARENCIA PÚBLICA',
  'SEGURIDAD', 
  'INVERTIR PARA CRECER',
  'N/A' // Para casos que no encajen en ninguna categoría específica
];

/**
 * Función para generar el prompt específico para cada publicación
 */
function generarPrompt(perfil: string, contenido: string): string {
  return `Actúa como un analista especializado en comunicación gubernamental y análisis de contenido digital. Tienes experiencia en categorización temática de publicaciones institucionales y análisis cuantitativo-cualitativo de estrategias comunicacionales de entidades públicas.

Analiza de manera exhaustiva y sistemática la base de datos de publicaciones de los perfiles de Facebook e Instagram de la ${perfil} clasificando cada publicación según los tres temas específicos definidos: 

1. SEGURIDAD
Publicaciones que aborden temas de seguridad ciudadana, prevención del delito, orden público, convivencia pacífica, programas de seguridad comunitaria, o cualquier iniciativa relacionada con la protección y bienestar de los ciudadanos en materia de seguridad.

2. TRANSPARENCIA PÚBLICA
Publicaciones que cumplan con la obligación gubernamental de rendir cuentas, incluyendo: informes de gestión, uso de recursos públicos, decisiones administrativas, procesos de contratación, resultados de programas, datos abiertos, audiencias públicas, o cualquier contenido que busque mostrar información clara, oportuna y comprensible sobre las acciones y recursos de la entidad. Como Operaciones de crédito y condiciones financieras, Plataforma "Pa' que Veás" (que es el monitor de inversión pública), Cronogramas y ejecución presupuestal de proyectos, Rendición de cuentas sobre avances de inversiones y Control social y herramientas de seguimiento ciudadano

3. INVERTIR PARA CRECER
Publicaciones relacionadas con la estrategia "Invertir para Crecer" del alcalde Alejandro Eder, que contempla una inversión total de $3,5 billones para 32 proyectos estructurales. Incluye cualquier mención de: recuperación de territorios abandonados; tecnología, bioeconomía, movilidad sostenible; transformación urbana, empleo, seguridad.
Proyectos con invertir para crecer:
Recuperación de malla vial (800+ kilómetros, incluyendo Avenida Ciudad de Cali)
Subsidios de vivienda (6.300 subsidios)
Mejoras en colegios públicos (20 instituciones educativas)
Fortalecimiento de Plataforma Tecnológica de la Alcaldía
Recuperación de bibliotecas y espacios culturales
Intervención de escenarios deportivos y recreativos (63 espacios)
Fortalecimiento Casa Matria Juanambú
Mantenimiento de CALIs (18 de 23 centros)
Programas de formación en bilingüismo y competencias laborales
Becas educativas para educación superior

PROCESO DE ANÁLISIS REQUERIDO
PASO 1: Filtrado y Clasificación
Clasifica cada publicación en los tres temas definidos
Una publicación puede pertenecer solo a uno de los temas definidos.
Identifica publicaciones que NO correspondan a ninguno de los tres temas y asigna la etiqueta N/A

Los temas deben llamarse tal cual como están "SEGURIDAD", "TRANSPARENCIA PÚBLICA", "INVERTIR PARA CRECER"

Responde ÚNICAMENTE con el nombre exacto de la categoría (SEGURIDAD, TRANSPARENCIA PÚBLICA, INVERTIR PARA CRECER, o N/A), sin explicaciones adicionales.

Contenido de la publicación a analizar:
${contenido}`;
}

/**
 * Función para llamar a la API de OpenAI GPT-5
 */
async function categorizarConGPT(perfil: string, contenido: string): Promise<string | null> {
  try {
    const prompt = generarPrompt(perfil, contenido);
    
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-chat-latest',
        input: [
          {
            role: 'system',
            content: 'Eres un analista especializado en comunicación gubernamental. Responde ÚNICAMENTE con el nombre exacto de la categoría (SEGURIDAD, TRANSPARENCIA PÚBLICA, INVERTIR PARA CRECER, o N/A), sin explicaciones adicionales.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_output_tokens: 50
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    // Estructura de respuesta de GPT-5 en /v1/responses
    let categoria: string;
    if (data.output && data.output[0] && data.output[0].content && data.output[0].content[0] && data.output[0].content[0].text) {
      categoria = data.output[0].content[0].text.trim();
    } else {
      console.warn('⚠️  Estructura de respuesta desconocida:', data);
      return null;
    }
    
    // Validar que la categoría sea una de las válidas
    if (!CATEGORIAS_VALIDAS.includes(categoria)) {
      console.warn(`⚠️  Categoría no válida recibida: "${categoria}". Usando "N/A"`);
      return 'N/A';
    }
    
    return categoria;
  } catch (error) {
    console.error('❌ Error al llamar a OpenAI:', error);
    return null;
  }
}

// Schema de validación para el request
const ProcessPendingSchema = z.object({
  batchSize: z.number().min(1).max(100).default(10), // Procesar en lotes
  delayMs: z.number().min(1000).max(10000).default(2000), // Delay entre requests
});

/**
 * @swagger
 * /api/categorize-pending:
 *   post:
 *     tags:
 *       - Categorización Automática
 *     summary: Procesar registros pendientes con GPT-5
 *     description: |
 *       Procesa automáticamente los registros con categoría "Pendiente" usando GPT-5
 *       para asignarles las categorías correctas según el análisis de contenido.
 *       
 *       **Categorías disponibles:**
 *       - SEGURIDAD: Seguridad ciudadana, prevención del delito, orden público
 *       - TRANSPARENCIA PÚBLICA: Rendición de cuentas, gestión pública, procesos administrativos
 *       - INVERTIR PARA CRECER: Proyectos de infraestructura, desarrollo económico del alcalde Eder
 *       - N/A: Publicaciones que no encajan en las categorías principales
 *       
 *       **Procesamiento:**
 *       - Se procesan en lotes para evitar saturar la API de OpenAI
 *       - Incluye delay configurable entre requests
 *       - Solo procesa registros que tengan contenido en la columna "publicar"
 *       
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               batchSize:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 100
 *                 default: 10
 *                 description: Número de registros a procesar por lote
 *               delayMs:
 *                 type: number
 *                 minimum: 1000
 *                 maximum: 10000
 *                 default: 2000
 *                 description: Delay en milisegundos entre requests a GPT-5
 *     responses:
 *       200:
 *         description: Procesamiento completado exitosamente
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
 *                   example: "Procesamiento completado"
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalPendientes:
 *                       type: number
 *                       description: Total de registros pendientes encontrados
 *                     procesados:
 *                       type: number
 *                       description: Registros procesados exitosamente
 *                     errores:
 *                       type: number
 *                       description: Registros que no pudieron procesarse
 *                     categorias:
 *                       type: object
 *                       description: Distribución de categorías asignadas
 *                       properties:
 *                         SEGURIDAD:
 *                           type: number
 *                         TRANSPARENCIA_PUBLICA:
 *                           type: number
 *                         INVERTIR_PARA_CRECER:
 *                           type: number
 *                         N_A:
 *                           type: number
 *                 processingTime:
 *                   type: string
 *                   description: Tiempo total de procesamiento
 *       400:
 *         description: Error en los parámetros de entrada
 *       500:
 *         description: Error interno del servidor
 */
export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Validar parámetros de entrada
    const body = await request.json().catch(() => ({}));
    const { batchSize, delayMs } = ProcessPendingSchema.parse(body);
    
    console.log(`🚀 Iniciando procesamiento automático de registros pendientes...`);
    console.log(`📊 Configuración: batchSize=${batchSize}, delayMs=${delayMs}`);
    
    // Obtener registros pendientes que tengan contenido
    const registrosPendientes = await prisma.publicacion.findMany({
      where: {
        categoria: 'Pendiente',
        publicar: { not: null }
      },
      select: {
        id: true,
        perfil: true,
        publicar: true,
        categoria: true
      }
    });
    
    console.log(`📋 Encontrados ${registrosPendientes.length} registros pendientes con contenido`);
    
    if (registrosPendientes.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay registros pendientes para procesar',
        stats: {
          totalPendientes: 0,
          procesados: 0,
          errores: 0,
          categorias: {}
        },
        processingTime: '0ms'
      });
    }
    
    // Estadísticas de procesamiento
    let procesados = 0;
    let errores = 0;
    const categorias: Record<string, number> = {
      'SEGURIDAD': 0,
      'TRANSPARENCIA PÚBLICA': 0,
      'INVERTIR PARA CRECER': 0,
      'N/A': 0
    };
    
    // Procesar en lotes
    for (let i = 0; i < registrosPendientes.length; i += batchSize) {
      const lote = registrosPendientes.slice(i, i + batchSize);
      console.log(`🔄 Procesando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(registrosPendientes.length / batchSize)} (${lote.length} registros)`);
      
      // Procesar cada registro del lote
      for (const registro of lote) {
        try {
          console.log(`🤖 Categorizando: ${registro.id} (${registro.perfil})`);
          
          const nuevaCategoria = await categorizarConGPT(registro.perfil, registro.publicar!);
          
          if (nuevaCategoria) {
            // Actualizar la base de datos
            await prisma.publicacion.update({
              where: { id: registro.id },
              data: { categoria: nuevaCategoria }
            });
            
            procesados++;
            categorias[nuevaCategoria]++;
            console.log(`✅ ${registro.id} → ${nuevaCategoria}`);
          } else {
            errores++;
            console.log(`❌ Error procesando ${registro.id}`);
          }
          
          // Delay entre requests para no saturar la API
          if (delayMs > 0) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
          }
          
        } catch (error) {
          errores++;
          console.error(`❌ Error procesando registro ${registro.id}:`, error);
        }
      }
    }
    
    const endTime = Date.now();
    const processingTime = `${endTime - startTime}ms`;
    
    console.log(`🎉 Procesamiento completado en ${processingTime}`);
    console.log(`📊 Estadísticas: ${procesados} procesados, ${errores} errores`);
    
    return NextResponse.json({
      success: true,
      message: 'Procesamiento completado',
      stats: {
        totalPendientes: registrosPendientes.length,
        procesados,
        errores,
        categorias
      },
      processingTime
    });
    
  } catch (error) {
    console.error('❌ Error en procesamiento automático:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation Error',
        message: 'Parámetros inválidos',
        details: error.errors,
        statusCode: 400,
        timestamp: new Date().toISOString(),
      }, { status: 400 });
    }
    
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
