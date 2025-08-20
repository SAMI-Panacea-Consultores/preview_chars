import { useState } from 'react'

interface UploadResult {
  success: boolean
  inserted?: number
  message?: string
  duplicates?: string[]
  duplicateCount?: number
  totalRows?: number
  error?: string
}

export interface CSVUploadStatus {
  stage: 'loading' | 'validating' | 'processing' | 'success' | 'error'
  message: string
  progress?: number
  totalRows?: number
  newRows?: number
  duplicateRows?: number
  skippedRows?: number
  error?: string
  fileName?: string
}

interface UseCSVUploadReturn {
  uploadCSV: (file: File, overwrite?: boolean, onStatusChange?: (status: CSVUploadStatus) => void) => Promise<UploadResult>
  loading: boolean
  error: string | null
}

export function useCSVUpload(): UseCSVUploadReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadCSV = async (file: File, overwrite = false, onStatusChange?: (status: CSVUploadStatus) => void): Promise<UploadResult> => {
    console.log('🎯 uploadCSV called with:', { fileName: file.name, overwrite })
    setLoading(true)
    setError(null)

    try {
      // Estado inicial: cargando archivo
      console.log('📊 Setting loading status...')
      onStatusChange?.({
        stage: 'loading',
        message: 'Leyendo archivo CSV...',
        fileName: file.name
      })

      const formData = new FormData()
      formData.append('file', file)
      formData.append('overwrite', overwrite.toString())

      // Estado: validando
      onStatusChange?.({
        stage: 'validating',
        message: 'Validando formato y datos...',
        fileName: file.name,
        progress: 30
      })

      console.log('🌐 Making API call to /api/upload-csv...')
      const response = await fetch('/api/upload-csv', {
        method: 'POST',
        body: formData
      })
      console.log('📡 API response status:', response.status)

      // Estado: procesando
      onStatusChange?.({
        stage: 'processing',
        message: 'Guardando en base de datos...',
        fileName: file.name,
        progress: 70
      })

      console.log('🔍 Parsing response JSON...')
      const result = await response.json()
      console.log('📋 API result:', result)

      if (!response.ok) {
        if (response.status === 409) {
          // Duplicados encontrados - no es un error, sino una situación especial
          return result
        }
        const errorMessage = result.error || 'Error uploading file'
        onStatusChange?.({
          stage: 'error',
          message: 'Error al procesar el archivo',
          error: errorMessage,
          fileName: file.name
        })
        throw new Error(errorMessage)
      }

      // Estado: éxito
      onStatusChange?.({
        stage: 'success',
        message: result.message || 'Archivo procesado exitosamente',
        fileName: file.name,
        totalRows: result.totalRows,
        newRows: result.inserted,
        duplicateRows: result.duplicateCount || 0,
        skippedRows: result.duplicateCount && !overwrite ? result.duplicateCount : 0
      })

      return result

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      
      onStatusChange?.({
        stage: 'error',
        message: 'Error al procesar el archivo',
        error: errorMessage,
        fileName: file.name
      })

      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return { uploadCSV, loading, error }
}
