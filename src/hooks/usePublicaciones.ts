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
  fetchAllData: () => Promise<Row[]>
  invalidateCache: () => void
  stats: {
    totalPublicaciones: number
    redes: Array<{ red: string; count: number }>
    perfiles: Array<{ perfil: string; count: number }>
    categorias: Array<{ categoria: string; count: number }>
  } | null
  meta: {
    total: number
    limit: number
    offset: number
    hasNext: boolean
    hasPrev: boolean
  } | null
}

// Caché global para todos los datos (compartido entre instancias del hook)
let globalDataCache: Row[] | null = null;
let globalCacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export function usePublicaciones(params: UsePublicacionesParams = {}): UsePublicacionesReturn {
  const [data, setData] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<UsePublicacionesReturn['stats']>(null)
  const [meta, setMeta] = useState<UsePublicacionesReturn['meta']>(null)

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
      setMeta(result.meta || null)

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

  // Función para obtener todos los datos (con caché)
  const fetchAllDataFromAPI = async (): Promise<Row[]> => {
    try {
      console.log('🌐 Fetching ALL data from API...')
      const response = await fetch('/api/publicaciones?limit=50000&offset=0')
      
      if (!response.ok) {
        throw new Error('Error fetching all data')
      }

      const result = await response.json()
      const allData = result.data || []
      
      // Actualizar caché global
      globalDataCache = allData
      globalCacheTimestamp = Date.now()
      console.log(`💾 Cached ${allData.length} records`)
      
      return allData

    } catch (err) {
      console.error('Error fetching all data:', err)
      return []
    }
  }

  const fetchAllData = async (): Promise<Row[]> => {
    // Verificar si tenemos datos en caché y si están frescos
    const now = Date.now()
    if (globalDataCache && (now - globalCacheTimestamp) < CACHE_DURATION) {
      console.log(`⚡ Using cached data (${globalDataCache.length} records)`)
      return globalDataCache
    }

    // Si no hay caché o está obsoleto, obtener datos frescos
    return await fetchAllDataFromAPI()
  }

  // Función para invalidar caché (útil después de subir CSV)
  const invalidateCache = () => {
    globalDataCache = null
    globalCacheTimestamp = 0
    console.log('🗑️ Cache invalidated')
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
    fetchAllData,
    invalidateCache,
    stats,
    meta
  }
}
