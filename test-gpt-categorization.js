#!/usr/bin/env node

/**
 * Script de prueba para categorización automática con GPT-5
 * 
 * Este script toma registros con categoría "Pendiente" y los categoriza
 * usando OpenAI GPT-5 con razonamiento profundo basado en el contenido de la publicación.
 */

const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

// Configuración de OpenAI (necesitarás tu API key)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('❌ Error: OPENAI_API_KEY no está configurada en las variables de entorno');
  process.exit(1);
}

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
function generarPrompt(perfil, contenido) {
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
 * Función para llamar a la API de OpenAI
 */
async function categorizarConGPT(perfil, contenido) {
  try {
    const prompt = generarPrompt(perfil, contenido);
    
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-chat-latest', // Usando el modelo GPT-5 como en tu ejemplo
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
        temperature: 0.2, // Baja temperatura para respuestas consistentes
        max_output_tokens: 50
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    // Debug: ver la estructura completa de la respuesta (solo en modo debug)
    // console.log('🔍 DEBUG - Estructura de respuesta:', JSON.stringify(data, null, 2));
    
    // Estructura de respuesta de GPT-5 en /v1/responses
    let categoria;
    if (data.output && data.output[0] && data.output[0].content && data.output[0].content[0] && data.output[0].content[0].text) {
      categoria = data.output[0].content[0].text.trim();
    } else if (data.choices && data.choices[0] && data.choices[0].message) {
      // Fallback para estructura estándar
      categoria = data.choices[0].message.content.trim();
    } else {
      console.warn('⚠️  Estructura de respuesta desconocida:', data);
      return 'N/A';
    }
    
    // Validar que la categoría sea una de las válidas
    if (!CATEGORIAS_VALIDAS.includes(categoria)) {
      console.warn(`⚠️  Categoría no válida recibida: "${categoria}". Usando "N/A"`);
      return 'N/A';
    }
    
    return categoria;
  } catch (error) {
    console.error('❌ Error al llamar a OpenAI:', error.message);
    return null;
  }
}

/**
 * Función principal de prueba
 */
async function probarCategorizacion() {
  try {
    console.log('🚀 Iniciando prueba de categorización con GPT...\n');
    
    // Obtener algunos registros pendientes para probar
    const registrosPendientes = await prisma.publicacion.findMany({
      where: {
        categoria: 'Pendiente',
        publicar: { not: null } // Solo los que tienen contenido
      },
      take: 5, // 5 registros para prueba completa
      select: {
        id: true,
        perfil: true,
        publicar: true,
        categoria: true
      }
    });

    console.log(`📊 Encontrados ${registrosPendientes.length} registros para probar\n`);

    for (let i = 0; i < registrosPendientes.length; i++) {
      const registro = registrosPendientes[i];
      
      console.log(`\n--- Registro ${i + 1}/${registrosPendientes.length} ---`);
      console.log(`🆔 ID: ${registro.id}`);
      console.log(`👤 Perfil: ${registro.perfil}`);
      console.log(`📝 Contenido: ${registro.publicar?.substring(0, 100)}...`);
      console.log(`📂 Categoría actual: ${registro.categoria}`);
      
      // Categorizar con GPT
      console.log('🤖 Categorizando con GPT...');
      const nuevaCategoria = await categorizarConGPT(registro.perfil, registro.publicar);
      
      if (nuevaCategoria) {
        console.log(`✅ Nueva categoría sugerida: ${nuevaCategoria}`);
        
        // En modo de prueba, NO actualizamos la base de datos
        console.log('ℹ️  (Modo prueba - no se actualiza la BD)');
      } else {
        console.log('❌ Error en categorización');
      }
      
      // Pausa pequeña para no saturar la API
      if (i < registrosPendientes.length - 1) {
        console.log('⏳ Esperando 2 segundos...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log('\n🎉 Prueba completada!');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  probarCategorizacion();
}

module.exports = { categorizarConGPT, CATEGORIAS_VALIDAS };
