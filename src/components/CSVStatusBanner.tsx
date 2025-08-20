'use client'

import { useEffect, useState } from 'react'

export interface CSVStatusData {
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

interface CSVStatusBannerProps {
  data: CSVStatusData | null
  onClose: () => void
}

export default function CSVStatusBanner({ data, onClose }: CSVStatusBannerProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (data) {
      setVisible(true)
    } else {
      setVisible(false)
    }
  }, [data])

  const handleClose = () => {
    setVisible(false)
    setTimeout(() => {
      onClose()
    }, 300) // Esperar a que termine la animación
  }

  if (!data) return null

  const getIcon = () => {
    switch (data.stage) {
      case 'loading':
        return '📁'
      case 'validating':
        return '🔍'
      case 'processing':
        return '⚙️'
      case 'success':
        return '✅'
      case 'error':
        return '❌'
      default:
        return '📊'
    }
  }

  const getTitle = () => {
    switch (data.stage) {
      case 'loading':
        return 'Cargando archivo'
      case 'validating':
        return 'Validando datos'
      case 'processing':
        return 'Procesando CSV'
      case 'success':
        return 'Carga completada'
      case 'error':
        return 'Error en la carga'
      default:
        return 'Procesando'
    }
  }

  const getClassName = () => {
    let className = 'csv-status-banner'
    if (visible) className += ' visible'
    if (data.stage === 'loading' || data.stage === 'validating' || data.stage === 'processing') {
      className += ' loading'
    } else if (data.stage === 'success') {
      className += ' success'
    } else if (data.stage === 'error') {
      className += ' error'
    }
    return className
  }

  const showProgress = data.stage === 'loading' || data.stage === 'validating' || data.stage === 'processing'
  const showStats = data.stage === 'success' && (data.totalRows || data.newRows || data.duplicateRows)

  return (
    <div className={getClassName()}>
      <div className="csv-status-header">
        <div className="csv-status-title">
          <span>{getIcon()}</span>
          <span>{getTitle()}</span>
        </div>
        <button 
          className="csv-status-close"
          onClick={handleClose}
          title="Cerrar"
        >
          ✕
        </button>
      </div>

      <div className="csv-status-content">
        {data.fileName && (
          <div style={{ marginBottom: '8px', fontSize: '13px', color: 'var(--system-gray)' }}>
            📄 {data.fileName}
          </div>
        )}
        <div>{data.message}</div>
        {data.error && (
          <div style={{ 
            marginTop: '8px', 
            padding: '8px 12px', 
            background: 'rgba(255, 59, 48, 0.1)', 
            borderRadius: '8px',
            fontSize: '13px',
            color: 'var(--system-red)'
          }}>
            {data.error}
          </div>
        )}
      </div>

      {showProgress && (
        <div className="csv-status-progress">
          <div 
            className={`csv-status-progress-bar ${data.progress === undefined ? 'indeterminate' : ''}`}
            style={{ width: data.progress ? `${data.progress}%` : undefined }}
          />
        </div>
      )}

      {showStats && (
        <div className="csv-status-stats">
          {data.totalRows !== undefined && (
            <div className="csv-status-stat">
              <div className="csv-status-stat-value">{data.totalRows.toLocaleString()}</div>
              <div className="csv-status-stat-label">Total Filas</div>
            </div>
          )}
          {data.newRows !== undefined && (
            <div className="csv-status-stat">
              <div className="csv-status-stat-value">{data.newRows.toLocaleString()}</div>
              <div className="csv-status-stat-label">Nuevas</div>
            </div>
          )}
          {data.duplicateRows !== undefined && data.duplicateRows > 0 && (
            <div className="csv-status-stat">
              <div className="csv-status-stat-value">{data.duplicateRows.toLocaleString()}</div>
              <div className="csv-status-stat-label">Duplicadas</div>
            </div>
          )}
          {data.skippedRows !== undefined && data.skippedRows > 0 && (
            <div className="csv-status-stat">
              <div className="csv-status-stat-value">{data.skippedRows.toLocaleString()}</div>
              <div className="csv-status-stat-label">Omitidas</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
