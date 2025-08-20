'use client'

import { useState, useRef } from 'react'
import { useCSVUpload } from '@/hooks/useCSVUpload'

interface CSVUploaderProps {
  onUploadSuccess?: (result: any) => void
  onUploadError?: (error: string) => void
  compact?: boolean
}

export default function CSVUploader({ onUploadSuccess, onUploadError, compact = false }: CSVUploaderProps) {
  const { uploadCSV, loading, error } = useCSVUpload()
  const [duplicateInfo, setDuplicateInfo] = useState<any>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setDuplicateInfo(null)
      
      // En modo compacto, subir automáticamente
      if (compact) {
        handleUpload(false)
      }
    }
  }

  const handleUpload = async (overwrite = false) => {
    if (!selectedFile) return

    const result = await uploadCSV(selectedFile, overwrite)

    if (result.success) {
      setDuplicateInfo(null)
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      onUploadSuccess?.(result)
    } else if (result.duplicates) {
      // Mostrar diálogo de duplicados
      setDuplicateInfo(result)
    } else {
      onUploadError?.(result.error || 'Error desconocido')
    }
  }

  const handleOverwrite = () => {
    handleUpload(true)
  }

  const handleSkipDuplicates = () => {
    setDuplicateInfo(null)
    // Subir solo los nuevos (comportamiento por defecto)
    handleUpload(false)
  }

  return (
    <div className="csv-uploader">
      {compact ? (
        // Modo compacto: solo un botón
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileSelect}
            disabled={loading}
            id="csv-file-upload-compact"
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`upload-btn ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? '⏳ Subiendo...' : '📁 Cargar CSV'}
          </button>
        </>
      ) : (
        // Modo normal: interfaz completa
        <>
          <div className="form-group">
            <label className="form-label">Subir Data</label>
            <div className="file-input">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileSelect}
                disabled={loading}
                id="csv-file-upload"
              />
              <label 
                htmlFor="csv-file-upload" 
                className={`file-input-label ${selectedFile ? 'loaded' : ''} ${loading ? 'loading' : ''}`}
              >
                {loading ? (
                  <>⏳ Subiendo...</>
                ) : selectedFile ? (
                  <>✅ {selectedFile.name}</>
                ) : (
                  <>📁 Seleccionar archivo CSV</>
                )}
              </label>
            </div>
          </div>

          {selectedFile && !loading && !duplicateInfo && (
            <button
              onClick={() => handleUpload(false)}
              className="upload-btn"
              disabled={loading}
            >
              🚀 Subir archivo
            </button>
          )}
        </>
      )}

      {error && (
        <div className="upload-error">
          ❌ Error: {error}
        </div>
      )}

      {/* Diálogo de duplicados */}
      {duplicateInfo && (
        <div className="duplicate-dialog">
          <div className="duplicate-content">
            <h3>⚠️ Publicaciones duplicadas encontradas</h3>
            <p>
              Se encontraron <strong>{duplicateInfo.duplicateCount}</strong> publicaciones 
              que ya existen de un total de <strong>{duplicateInfo.totalRows}</strong> filas.
            </p>
            <p>¿Qué deseas hacer?</p>
            
            <div className="duplicate-actions">
              <button 
                onClick={handleOverwrite}
                className="btn-overwrite"
                disabled={loading}
              >
                🔄 Sobrescribir datos existentes
              </button>
              <button 
                onClick={handleSkipDuplicates}
                className="btn-skip"
                disabled={loading}
              >
                ➕ Solo agregar nuevos datos
              </button>
              <button 
                onClick={() => setDuplicateInfo(null)}
                className="btn-cancel"
              >
                ❌ Cancelar
              </button>
            </div>

            {duplicateInfo.duplicates && duplicateInfo.duplicates.length <= 10 && (
              <details className="duplicate-details">
                <summary>Ver IDs duplicados ({duplicateInfo.duplicates.length})</summary>
                <ul>
                  {duplicateInfo.duplicates.map((id: string) => (
                    <li key={id}>{id}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
