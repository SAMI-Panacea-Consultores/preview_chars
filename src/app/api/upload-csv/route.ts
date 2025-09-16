import { NextRequest, NextResponse } from 'next/server'
import Papa from 'papaparse'
import { prisma } from '@/lib/prisma'
import { UploadCSVSchema, validateSchema } from '@/lib/schemas'
import { ApiResponse, withErrorHandling, withMethods, withCORS, withRateLimit, logRequest } from '@/lib/api-utils'

// Función para normalizar categorías (copiada del frontend)
function normalizeCategory(raw: string): string {
  let c = (raw || '').trim();
  if (!c) return 'Sin categoría';
  
  // Remover comillas
  c = c.replace(/^["']|["']$/g, '');
  
  // Manejar N/A, guiones, etc.
  if (!c || /^(n\/a|na|n\.a\.?|-+|_+)$/i.test(c)) {
    return 'Sin categoría';
  }
  
  // Normalizar nombres conocidos
  if (/invertir.*para.*crecer/i.test(c)) return 'INVERTIR PARA CRECER';
  if (/seguridad/i.test(c)) return 'SEGURIDAD';
  if (/transparencia.*publica/i.test(c)) return 'TRANSPARENCIA PÚBLICA';
  if (/error/i.test(c)) return 'Error en procesamiento';
  if (/estrategia/i.test(c)) return 'Sin categoría';
  
  return c;
}

// Función para parsear números con comas
function parseNumber(numStr: string): number {
  if (!numStr || numStr.trim() === '') return 0;
  const cleaned = numStr.replace(/,/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}

// Función para validar estructura del CSV
function validateCSVStructure(headers: string[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const requiredFields = ['id', 'fecha', 'red', 'perfil'];
  
  const lowerHeaders = headers.map(h => h.toLowerCase());
  
  for (const field of requiredFields) {
    const hasField = lowerHeaders.some(h => h.includes(field));
    if (!hasField) {
      errors.push(`Campo requerido '${field}' no encontrado en las columnas`);
    }
  }
  
  // Verificar que tenga al menos métricas
  const hasMetrics = lowerHeaders.some(h => 
    h.includes('impresion') || h.includes('alcance') || h.includes('gusta')
  );
  
  if (!hasMetrics) {
    errors.push('No se encontraron columnas de métricas (impresiones, alcance, me gusta)');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Función para parsear fecha en formato M/D/YYYY H:MM am/pm
function parseCSVDate(fechaStr: string): Date {
  if (!fechaStr) return new Date();
  
  try {
    // Si viene en formato M/D/YYYY H:MM am/pm (desde CSV)
    // Ejemplo: "8/2/2025 5:34 pm" (mes/día/año hora am/pm)
    const parts = fechaStr.toString().trim().split(' ');
    if (parts.length >= 1) {
      const datePart = parts[0]; // "8/2/2025"
      const timePart = parts.slice(1).join(' '); // "5:34 pm"
      
      const dateComponents = datePart.split('/');
      if (dateComponents.length === 3) {
        const [month, day, year] = dateComponents.map(Number);
        
        if (month && day && year && month >= 1 && month <= 12 && day >= 1 && day <= 31 && year > 1900) {
          if (timePart) {
            // Con hora: crear fecha completa
            const fecha = new Date(`${month}/${day}/${year} ${timePart}`);
            return isNaN(fecha.getTime()) ? new Date() : fecha;
          } else {
            // Solo fecha: crear a medianoche
            return new Date(year, month - 1, day);
          }
        }
      }
    }
    
    // Fallback: intentar parseo directo
    const fecha = new Date(fechaStr);
    return isNaN(fecha.getTime()) ? new Date() : fecha;
  } catch {
    return new Date();
  }
}

/**
 * @swagger
 * /api/upload-csv:
 *   post:
 *     summary: Subir archivo CSV
 *     description: |
 *       Importa publicaciones desde un archivo CSV con validación y manejo de duplicados.
 *       
 *       **Formato del CSV:**
       *       - ID: Identificador único de la publicación
       *       - Fecha: Fecha en formato M/D/YYYY H:MM am/pm (ej: 8/2/2025 5:34 pm)
       *       - Red: Red social (Instagram, Facebook, TikTok, Twitter)
       *       - Tipo de publicación: Tipo de contenido (Publicar, Historia, Reel, Video, etc.)
       *       - Perfil: Nombre del perfil
       *       - categoria: Categoría de la publicación (puede tener múltiples separadas por comas)
       *       - Impresiones: Número de impresiones (puede tener comas como separadores de miles)
       *       - Alcance: Número de personas alcanzadas
       *       - Me gusta: Número de me gusta
 *       
 *       **Manejo de Duplicados:**
 *       - Si overwrite=false: Retorna lista de duplicados para confirmación
 *       - Si overwrite=true: Sobrescribe los registros existentes
 *       
 *       **Validaciones:**
 *       - Tamaño máximo: 10MB
 *       - Formato: Solo archivos .csv
 *       - Estructura: Campos requeridos deben estar presentes
 *       - Datos: Validación de tipos y rangos
 *     tags:
 *       - Upload
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Archivo CSV con las publicaciones
 *               overwrite:
 *                 type: boolean
 *                 default: false
 *                 description: Si true, sobrescribe registros duplicados
 *           encoding:
 *             file:
 *               contentType: text/csv
 *     responses:
 *       201:
 *         description: Archivo procesado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UploadResult'
 *       409:
 *         description: Duplicados encontrados (requiere confirmación)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DuplicateResponse'
 *       400:
 *         description: Error de validación o archivo inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               no_file:
 *                 summary: Archivo no proporcionado
 *                 value:
 *                   error: Bad Request
 *                   message: Archivo CSV requerido
 *                   statusCode: 400
 *                   timestamp: "2025-08-20T10:30:00.000Z"
 *               invalid_format:
 *                 summary: Formato de archivo inválido
 *                 value:
 *                   error: Bad Request
 *                   message: Solo se permiten archivos CSV
 *                   statusCode: 400
 *                   timestamp: "2025-08-20T10:30:00.000Z"
 *               file_too_large:
 *                 summary: Archivo demasiado grande
 *                 value:
 *                   error: Bad Request
 *                   message: "Archivo demasiado grande. Máximo permitido: 10MB"
 *                   statusCode: 400
 *                   timestamp: "2025-08-20T10:30:00.000Z"
 *               csv_parse_error:
 *                 summary: Error al parsear CSV
 *                 value:
 *                   error: CSV Parse Error
 *                   message: Error al parsear el archivo CSV
 *                   statusCode: 400
 *                   timestamp: "2025-08-20T10:30:00.000Z"
 *               invalid_structure:
 *                 summary: Estructura de CSV inválida
 *                 value:
 *                   error: Invalid CSV Structure
 *                   message: Estructura del CSV no válida
 *                   statusCode: 400
 *                   details:
 *                     errors: ["Campo requerido 'id' no encontrado en las columnas"]
 *                     foundHeaders: ["Fecha", "Red", "Perfil"]
 *                     expectedHeaders: ["ID", "Fecha", "Red", "Perfil", "categoria", "Impresiones", "Alcance", "Me gusta"]
 *                   timestamp: "2025-08-20T10:30:00.000Z"
 *       422:
 *         description: Datos no procesables (filas inválidas)
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiError'
 *                 - type: object
 *                   properties:
 *                     details:
 *                       type: object
 *                       properties:
 *                         invalidRows:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               row:
 *                                 type: integer
 *                                 description: Número de fila con error
 *                               error:
 *                                 type: string
 *                                 description: Descripción del error
 *                               data:
 *                                 type: object
 *                                 description: Datos de la fila con error
 *                         totalInvalid:
 *                           type: integer
 *                           description: Total de filas inválidas
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
async function handlePOST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    // Validar que hay archivo
    if (!file) {
      return NextResponse.json({
        error: 'Bad Request',
        message: 'Archivo CSV requerido',
        statusCode: 400,
        timestamp: new Date().toISOString(),
      }, { status: 400 });
    }

    // Validar tipo de archivo
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json({
        error: 'Bad Request',
        message: 'Solo se permiten archivos CSV',
        statusCode: 400,
        timestamp: new Date().toISOString(),
      }, { status: 400 });
    }

    // Validar tamaño del archivo (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({
        error: 'Bad Request',
        message: `Archivo demasiado grande. Máximo permitido: ${maxSize / 1024 / 1024}MB`,
        statusCode: 400,
        timestamp: new Date().toISOString(),
      }, { status: 400 });
    }

    // Validar parámetros adicionales
    const formParams = {
      overwrite: formData.get('overwrite')?.toString() || 'false'
    };

    const { overwrite } = UploadCSVSchema.parse(formParams);

    // Leer y parsear CSV
    const text = await file.text();
    
    // Parsear CSV con Papa Parse
    const parseResult = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h: string) => h.trim(),
      dynamicTyping: false, // Mantener como strings para mejor control
    });

    if (parseResult.errors.length > 0) {
      const criticalErrors = parseResult.errors.filter(e => e.type === 'Delimiter' || e.type === 'Quotes');
      if (criticalErrors.length > 0) {
        return NextResponse.json({
          error: 'CSV Parse Error',
          message: 'Error al parsear el archivo CSV',
          statusCode: 400,
          details: criticalErrors,
          timestamp: new Date().toISOString(),
        }, { status: 400 });
      }
    }

    const data = parseResult.data as any[];
    const headers = parseResult.meta.fields || [];

    // Validar estructura del CSV
    const structureValidation = validateCSVStructure(headers);
    if (!structureValidation.valid) {
      return NextResponse.json({
        error: 'Invalid CSV Structure',
        message: 'Estructura del CSV no válida',
        statusCode: 400,
        details: {
          errors: structureValidation.errors,
          foundHeaders: headers,
          expectedHeaders: ['ID', 'Fecha', 'Red', 'Tipo de publicación', 'Perfil', 'categoria', 'Impresiones', 'Alcance', 'Me gusta']
        },
        timestamp: new Date().toISOString(),
      }, { status: 400 });
    }

    // Detectar columnas automáticamente
    const idKey = headers.find(h => h.toLowerCase().includes('id')) || 'ID';
    const fechaKey = headers.find(h => h.toLowerCase().includes('fecha')) || 'Fecha';
    const redKey = headers.find(h => h.toLowerCase() === 'red') || 'Red';
    const perfilKey = headers.find(h => h.toLowerCase().includes('perfil')) || 'Perfil';
    const categoriaKey = headers.find(h => h.toLowerCase().includes('categoria')) || 'categoria';
    const tipoPublicacionKey = headers.find(h => h.toLowerCase().includes('tipo') && h.toLowerCase().includes('publicaci')) || 'Tipo de publicación';

    // Verificar duplicados si no se quiere sobrescribir
    const existingIds = new Set();
    if (!overwrite) {
      const existingPublicaciones = await prisma.publicacion.findMany({
        select: { id: true }
      });
      existingPublicaciones.forEach(p => existingIds.add(p.id));
    }

    // Procesar datos con validaciones
    const publicacionesToInsert = [];
    const duplicateIds = [];
    const invalidRows = [];
    
    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      const row = data[rowIndex];
      const id = row[idKey]?.toString()?.trim();
      
      // Validar ID
      if (!id) {
        invalidRows.push({
          row: rowIndex + 1,
          error: 'ID faltante o vacío',
          data: row
        });
        continue;
      }

      // Verificar duplicados
      if (existingIds.has(id) && !overwrite) {
        duplicateIds.push(id);
        continue;
      }

      // Validar y parsear fecha
      const fecha = parseCSVDate(row[fechaKey]);

      // Validar red social
      const red = row[redKey]?.toString()?.trim();
      if (!red) {
        invalidRows.push({
          row: rowIndex + 1,
          error: 'Red social faltante',
          data: row
        });
        continue;
      }

      // Validar perfil
      const perfil = row[perfilKey]?.toString()?.trim();
      if (!perfil) {
        invalidRows.push({
          row: rowIndex + 1,
          error: 'Perfil faltante',
          data: row
        });
        continue;
      }

      // Procesar categorías múltiples
      const rawCategories = (row[categoriaKey] || '').toString();
      const categories = rawCategories.split(',').map(normalizeCategory).filter(Boolean);
      if (categories.length === 0) categories.push('Sin categoría');

      // Obtener tipo de publicación
      const tipoPublicacion = (row[tipoPublicacionKey] || 'Publicar').toString().trim();

      // Parsear métricas con validación
      const impresiones = parseNumber(row['Impresiones'] || '0');
      const alcance = parseNumber(row['Alcance'] || '0');
      const meGusta = parseNumber(row['Me gusta'] || '0');

      // Dividir métricas proporcionalmente entre categorías
      const impresionesPerCategory = Math.floor(impresiones / categories.length);
      const alcancePerCategory = Math.floor(alcance / categories.length);
      const meGustaPerCategory = Math.floor(meGusta / categories.length);

      // Crear una entrada por cada categoría
      for (let i = 0; i < categories.length; i++) {
        const categoria = categories[i];
        const uniqueId = categories.length > 1 ? `${id}_${i}` : id;

        publicacionesToInsert.push({
          id: uniqueId,
          fecha,
          red,
          perfil,
          categoria,
          tipoPublicacion,
          impresiones: impresionesPerCategory,
          alcance: alcancePerCategory,
          meGusta: meGustaPerCategory
        });
      }
    }

    // Si hay filas inválidas, reportar
    if (invalidRows.length > 0) {
      return NextResponse.json({
        error: 'Invalid Data',
        message: `${invalidRows.length} filas contienen datos inválidos`,
        statusCode: 422,
        details: {
          invalidRows: invalidRows.slice(0, 10), // Mostrar solo las primeras 10
          totalInvalid: invalidRows.length
        },
        timestamp: new Date().toISOString(),
      }, { status: 422 });
    }

    // Si hay duplicados y no se quiere sobrescribir, devolver para confirmación
    if (duplicateIds.length > 0 && !overwrite) {
      logRequest(request, { statusCode: 409 } as any, startTime);
      
      return NextResponse.json({
        success: false,
        duplicates: duplicateIds.slice(0, 100), // Limitar para evitar respuestas muy grandes
        totalRows: data.length,
        duplicateCount: duplicateIds.length,
        newRows: publicacionesToInsert.length,
        message: `${duplicateIds.length} publicaciones duplicadas encontradas`
      }, { status: 409 });
    }

    // Insertar o actualizar datos en transacción
    const result = await prisma.$transaction(async (tx) => {
      if (overwrite) {
        // Si se quiere sobrescribir, usar upsert
        const results = await Promise.all(
          publicacionesToInsert.map(pub => 
            tx.publicacion.upsert({
              where: { id: pub.id },
              update: pub,
              create: pub
            })
          )
        );
        
        return {
          inserted: results.length,
          updated: 0, // En upsert no distinguimos
          errors: 0
        };
      } else {
        // Para SQLite, insertar uno por uno para manejar duplicados
        let insertedCount = 0;
        let errorCount = 0;
        
        for (const pub of publicacionesToInsert) {
          try {
            await tx.publicacion.create({ data: pub });
            insertedCount++;
          } catch {
            errorCount++;
          }
        }
        
        return {
          inserted: insertedCount,
          updated: 0,
          errors: errorCount
        };
      }
    });

    logRequest(request, { statusCode: 201 } as any, startTime);

    return NextResponse.json({
      success: true,
      inserted: result.inserted,
      updated: result.updated,
      errors: result.errors,
      totalRows: data.length,
      processedRows: publicacionesToInsert.length,
      message: overwrite 
        ? `${result.inserted} publicaciones procesadas (insertadas/actualizadas)`
        : `${result.inserted} nuevas publicaciones insertadas`,
      stats: {
        fileSize: `${(file.size / 1024).toFixed(2)} KB`,
        processingTime: `${Date.now() - startTime}ms`,
        categoriesFound: [...new Set(publicacionesToInsert.map(p => p.categoria))],
        profilesFound: [...new Set(publicacionesToInsert.map(p => p.perfil))],
        networksFound: [...new Set(publicacionesToInsert.map(p => p.red))]
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error uploading CSV:', error);
    
    // Manejar errores de validación Zod
    if (error instanceof Error && error.name === 'ZodError') {
      const zodError = error as any;
      return NextResponse.json({
        error: 'Validation Error',
        message: 'Parámetros de upload no válidos',
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
      }, { status: 400 });
    }
    
    return NextResponse.json({
      error: 'Internal Server Error',
      message: 'Error interno del servidor al procesar el archivo CSV',
      statusCode: 500,
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// Exportar función directamente (App Router maneja CORS automáticamente)
export const POST = handlePOST;