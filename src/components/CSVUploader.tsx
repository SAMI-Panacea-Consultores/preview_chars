'use client'

import { useState, useRef } from 'react'
import { useCSVUpload, CSVUploadStatus } from '@/hooks/useCSVUpload'

interface CSVUploaderProps {
  onUploadSuccess?: (result: any) => void
  onUploadError?: (error: string) => void
  onStatusChange?: (status: CSVUploadStatus | null) => void
  compact?: boolean
}

export default function CSVUploader({ onUploadSuccess, onUploadError, onStatusChange, compact = false }: CSVUploaderProps) {
  console.log('🔧 CSVUploader rendered with compact:', compact)
  const { uploadCSV, loading, error } = useCSVUpload()
  const [duplicateInfo, setDuplicateInfo] = useState<any>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📁 File selected:', event.target.files?.[0]?.name)
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setDuplicateInfo(null)
      
      // En modo compacto, subir automáticamente
      if (compact) {
        console.log('🚀 Auto-uploading in compact mode...')
        handleUpload(false, file)
      }
    }
  }

  const handleUpload = async (overwrite = false, fileToUpload?: File) => {
    const fileToUse = fileToUpload || selectedFile
    console.log('🔄 handleUpload called with:', { selectedFile: fileToUse?.name, overwrite })
    if (!fileToUse) {
      console.log('❌ No file selected')
      return
    }

    console.log('📤 Calling uploadCSV...')
    const result = await uploadCSV(fileToUse, overwrite, onStatusChange)
    console.log('📥 Upload result:', result)

    if (result.success) {
      console.log('✅ Upload successful')
      setDuplicateInfo(null)
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      onUploadSuccess?.(result)
    } else if (result.duplicates) {
      console.log('⚠️ Duplicates found:', result.duplicates)
      // Mostrar diálogo de duplicados
      setDuplicateInfo(result)
      // Limpiar el banner de estado cuando hay duplicados
      onStatusChange?.(null)
    } else {
      console.log('❌ Upload failed:', result.error)
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
            onClick={() => {
              console.log('🖱️ Compact button clicked')
              fileInputRef.current?.click()
            }}
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
