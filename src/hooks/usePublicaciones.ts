import { useState, useEffect } from 'react'

type Row = Record<string, string>

interface UsePublicacionesParams {
  red?: string
  perfil?: string
  categoria?: string
  fechaInicio?: string
  fechaFin?: string
  autoFetch?: boolean
}

interface UsePublicacionesReturn {
  data: Row[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  stats: {
    totalPublicaciones: number
    redes: Array<{ red: string; count: number }>
    perfiles: Array<{ perfil: string; count: number }>
    categorias: Array<{ categoria: string; count: number }>
  } | null
}

export function usePublicaciones(params: UsePublicacionesParams = {}): UsePublicacionesReturn {
  const [data, setData] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<UsePublicacionesReturn['stats']>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Construir URL con parámetros
      const searchParams = new URLSearchParams()
      if (params.red) searchParams.append('red', params.red)
      if (params.perfil) searchParams.append('perfil', params.perfil)
      if (params.categoria) searchParams.append('categoria', params.categoria)
      if (params.fechaInicio) searchParams.append('fechaInicio', params.fechaInicio)
      if (params.fechaFin) searchParams.append('fechaFin', params.fechaFin)

      const response = await fetch(`/api/publicaciones?${searchParams.toString()}`)
      
      if (!response.ok) {
        throw new Error('Error fetching data')
      }

      const result = await response.json()
      setData(result.data || [])

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/publicaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'stats' })
      })

      if (response.ok) {
        const result = await response.json()
        setStats(result.stats)
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }

  useEffect(() => {
    if (params.autoFetch !== false) {
      fetchData()
      fetchStats()
    }
  }, [params.red, params.perfil, params.categoria, params.fechaInicio, params.fechaFin])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    stats
  }
}
