import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parámetros de filtro
    const red = searchParams.get('red')
    const perfil = searchParams.get('perfil')
    const categoria = searchParams.get('categoria')
    const fechaInicio = searchParams.get('fechaInicio')
    const fechaFin = searchParams.get('fechaFin')

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

    // Obtener publicaciones
    const publicaciones = await prisma.publicacion.findMany({
      where,
      orderBy: { fecha: 'desc' }
    })

    // Convertir a formato compatible con el frontend
    const formattedData = publicaciones.map(pub => ({
      ID: pub.id,
      Fecha: pub.fecha.toISOString(),
      Red: pub.red,
      Perfil: pub.perfil,
      categoria: pub.categoria,
      Impresiones: pub.impresiones.toString(),
      Alcance: pub.alcance.toString(),
      'Me gusta': pub.meGusta.toString()
    }))

    return NextResponse.json({
      success: true,
      data: formattedData,
      count: formattedData.length
    })

  } catch (error) {
    console.error('Error fetching publicaciones:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Endpoint para obtener estadísticas
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type } = body

    if (type === 'stats') {
      // Obtener estadísticas generales
      const totalPublicaciones = await prisma.publicacion.count()
      
      const redes = await prisma.publicacion.groupBy({
        by: ['red'],
        _count: { id: true }
      })

      const perfiles = await prisma.publicacion.groupBy({
        by: ['perfil'],
        _count: { id: true }
      })

      const categorias = await prisma.publicacion.groupBy({
        by: ['categoria'],
        _count: { id: true }
      })

      return NextResponse.json({
        success: true,
        stats: {
          totalPublicaciones,
          redes: redes.map(r => ({ red: r.red, count: r._count.id })),
          perfiles: perfiles.map(p => ({ perfil: p.perfil, count: p._count.id })),
          categorias: categorias.map(c => ({ categoria: c.categoria, count: c._count.id }))
        }
      })
    }

    return NextResponse.json({ error: 'Invalid request type' }, { status: 400 })

  } catch (error) {
    console.error('Error in POST publicaciones:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
