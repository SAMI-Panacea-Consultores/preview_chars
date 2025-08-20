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

interface UseCSVUploadReturn {
  uploadCSV: (file: File, overwrite?: boolean) => Promise<UploadResult>
  loading: boolean
  error: string | null
}

export function useCSVUpload(): UseCSVUploadReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadCSV = async (file: File, overwrite = false): Promise<UploadResult> => {
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('overwrite', overwrite.toString())

      const response = await fetch('/api/upload-csv', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          // Duplicados encontrados
          return result
        }
        throw new Error(result.error || 'Error uploading file')
      }

      return result

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return { uploadCSV, loading, error }
}
