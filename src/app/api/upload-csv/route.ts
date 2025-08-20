import { NextRequest, NextResponse } from 'next/server'
import Papa from 'papaparse'
import { prisma } from '@/lib/prisma'

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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const overwrite = formData.get('overwrite') === 'true'
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const text = await file.text()
    
    // Parsear CSV
    const result = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h: string) => h.trim()
    })

    if (result.errors.length > 0) {
      return NextResponse.json({ 
        error: 'Error parsing CSV', 
        details: result.errors 
      }, { status: 400 })
    }

    const data = result.data as any[]
    
    // Detectar columnas automáticamente
    const headers = result.meta.fields || []
    const idKey = headers.find(h => h.toLowerCase().includes('id')) || 'ID'
    const fechaKey = headers.find(h => h.toLowerCase().includes('fecha')) || 'Fecha'
    const redKey = headers.find(h => h.toLowerCase() === 'red') || 'Red'
    const perfilKey = headers.find(h => h.toLowerCase().includes('perfil')) || 'Perfil'
    const categoriaKey = headers.find(h => h.toLowerCase().includes('categoria')) || 'categoria'

    // Verificar duplicados si no se quiere sobrescribir
    const existingIds = new Set()
    if (!overwrite) {
      const existingPublicaciones = await prisma.publicacion.findMany({
        select: { id: true }
      })
      existingPublicaciones.forEach(p => existingIds.add(p.id))
    }

    // Procesar datos
    const publicacionesToInsert = []
    const duplicateIds = []
    
    for (const row of data) {
      const id = row[idKey]?.toString()
      if (!id) continue

      if (existingIds.has(id) && !overwrite) {
        duplicateIds.push(id)
        continue
      }

      // Parsear fecha en formato M/D/YYYY H:MM am/pm
      const fechaStr = row[fechaKey]
      let fecha: Date
      try {
        if (fechaStr) {
          // Si viene en formato M/D/YYYY H:MM am/pm (desde CSV)
          // Ejemplo: "8/2/2025 5:34 pm" (mes/día/año hora am/pm)
          const parts = fechaStr.toString().trim().split(' ')
          if (parts.length >= 1) {
            const datePart = parts[0] // "8/2/2025"
            const timePart = parts.slice(1).join(' ') // "5:34 pm"
            
            const dateComponents = datePart.split('/')
            if (dateComponents.length === 3) {
              const [month, day, year] = dateComponents.map(Number)
              
              if (month && day && year && month >= 1 && month <= 12 && day >= 1 && day <= 31 && year > 1900) {
                if (timePart) {
                  // Con hora: crear fecha completa
                  fecha = new Date(`${month}/${day}/${year} ${timePart}`)
                } else {
                  // Solo fecha: crear a medianoche
                  fecha = new Date(year, month - 1, day)
                }
                
                if (!isNaN(fecha.getTime())) {
                  // Fecha válida, continuar
                } else {
                  fecha = new Date()
                }
              } else {
                fecha = new Date()
              }
            } else {
              // Fallback: intentar parseo directo
              fecha = new Date(fechaStr)
              if (isNaN(fecha.getTime())) {
                fecha = new Date()
              }
            }
          } else {
            fecha = new Date()
          }
        } else {
          fecha = new Date()
        }
      } catch {
        fecha = new Date()
      }

      // Procesar categorías múltiples
      const rawCategories = (row[categoriaKey] || '').toString()
      const categories = rawCategories.split(',').map(normalizeCategory).filter(Boolean)
      if (categories.length === 0) categories.push('Sin categoría')

      // Dividir métricas proporcionalmente entre categorías
      const impresiones = parseNumber(row['Impresiones'] || '0')
      const alcance = parseNumber(row['Alcance'] || '0')
      const meGusta = parseNumber(row['Me gusta'] || '0')

      const impresionesPerCategory = Math.floor(impresiones / categories.length)
      const alcancePerCategory = Math.floor(alcance / categories.length)
      const meGustaPerCategory = Math.floor(meGusta / categories.length)

      // Crear una entrada por cada categoría
      for (let i = 0; i < categories.length; i++) {
        const categoria = categories[i]
        const uniqueId = categories.length > 1 ? `${id}_${i}` : id

        publicacionesToInsert.push({
          id: uniqueId,
          fecha,
          red: row[redKey]?.toString() || '',
          perfil: row[perfilKey]?.toString() || '',
          categoria,
          impresiones: impresionesPerCategory,
          alcance: alcancePerCategory,
          meGusta: meGustaPerCategory
        })
      }
    }

    // Si hay duplicados y no se quiere sobrescribir, devolver para confirmación
    if (duplicateIds.length > 0 && !overwrite) {
      return NextResponse.json({
        duplicates: duplicateIds,
        totalRows: data.length,
        duplicateCount: duplicateIds.length,
        message: 'Se encontraron publicaciones duplicadas'
      }, { status: 409 })
    }

    // Insertar o actualizar datos
    if (overwrite) {
      // Si se quiere sobrescribir, usar upsert
      const results = await Promise.all(
        publicacionesToInsert.map(pub => 
          prisma.publicacion.upsert({
            where: { id: pub.id },
            update: pub,
            create: pub
          })
        )
      )
      
      return NextResponse.json({
        success: true,
        inserted: results.length,
        message: `${results.length} publicaciones insertadas/actualizadas`
      })
    } else {
      // Insertar solo nuevos (uno por uno para evitar duplicados)
      let insertedCount = 0
      
      for (const pub of publicacionesToInsert) {
        try {
          await prisma.publicacion.create({
            data: pub
          })
          insertedCount++
        } catch (error) {
          // Si hay error de duplicado, continuar con el siguiente
          console.log(`Skipping duplicate: ${pub.id}`)
        }
      }
      
      return NextResponse.json({
        success: true,
        inserted: insertedCount,
        message: `${insertedCount} nuevas publicaciones insertadas`
      })
    }

  } catch (error) {
    console.error('Error uploading CSV:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
