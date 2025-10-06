'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface CsvSessionDetail {
  id: string;
  fileName: string;
  fileSize: number;
  status: 'processing' | 'completed' | 'failed' | 'partial';
  totalRows: number;
  processedRows: number;
  insertedRows: number;
  updatedRows: number;
  errorRows: number;
  duplicateRows: number;
  excludedHistorias: number;
  overwrite: boolean;
  startedAt: string;
  completedAt: string | null;
  processingTime: number | null;
  errorMessage: string | null;
  publicationCount: number;
  categoriesFound: string[];
  profilesFound: string[];
  networksFound: string[];
  originalHeaders: string[];
  detectedColumns: Record<string, string>;
  errorDetails: any;
  successRate: string;
  errorRate: string;
  duplicateRate: string;
  excludedRate: string;
  duration: string | null;
  samplePublications: any[];
  fileInfo: {
    sizeFormatted: string;
    sizeBytes: number;
  };
}

interface CsvSessionDetailResponse {
  success: boolean;
  data: CsvSessionDetail;
}

export default function CsvSessionDetailPage() {
  const params = useParams();
  const sessionId = params?.id as string;
  
  const [session, setSession] = useState<CsvSessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const fetchSessionDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/csv-sessions/${sessionId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Sesión no encontrada');
          }
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data: CsvSessionDetailResponse = await response.json();
        
        if (data.success) {
          setSession(data.data);
        } else {
          throw new Error('Error al cargar detalles de la sesión');
        }
      } catch (err) {
        console.error('Error fetching session details:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchSessionDetail();
  }, [sessionId]);

  const getStatusBadge = (status: string) => {
    const badges = {
      processing: { class: 'status-processing', icon: '⏳', text: 'Procesando' },
      completed: { class: 'status-completed', icon: '✅', text: 'Completado' },
      failed: { class: 'status-failed', icon: '❌', text: 'Falló' },
      partial: { class: 'status-partial', icon: '⚠️', text: 'Parcial' }
    };
    
    const badge = badges[status as keyof typeof badges] || badges.failed;
    return (
      <span className={`status-badge ${badge.class}`}>
        {badge.icon} {badge.text}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="csv-session-detail-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando detalles de la sesión...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="csv-session-detail-page">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <div className="error-content">
            <h3>Error al cargar detalles</h3>
            <p>{error}</p>
            <Link href="/csv-sessions" className="btn-secondary">
              ← Volver al Historial
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="csv-session-detail-page">
        <div className="empty-state">
          <div className="empty-icon">📂</div>
          <h3>Sesión no encontrada</h3>
          <p>No se pudo encontrar la sesión solicitada.</p>
          <Link href="/csv-sessions" className="btn-secondary">
            ← Volver al Historial
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="csv-session-detail-page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <div className="page-title-section">
            <h1 className="page-title">📄 Detalles de Sesión CSV</h1>
            <p className="page-subtitle">
              {session.fileName} • {session.fileInfo.sizeFormatted}
            </p>
          </div>
          <div className="page-actions">
            <Link href="/csv-sessions" className="btn-secondary">
              ← Volver al Historial
            </Link>
          </div>
        </div>
      </div>

      {/* Status and Basic Info */}
      <div className="session-overview">
        <div className="overview-grid">
          <div className="overview-card">
            <div className="card-header">
              <h3>Estado General</h3>
              {getStatusBadge(session.status)}
            </div>
            <div className="card-content">
              <div className="info-row">
                <span className="label">Archivo:</span>
                <span className="value">{session.fileName}</span>
              </div>
              <div className="info-row">
                <span className="label">Tamaño:</span>
                <span className="value">{session.fileInfo.sizeFormatted}</span>
              </div>
              <div className="info-row">
                <span className="label">Iniciado:</span>
                <span className="value">{formatDate(session.startedAt)}</span>
              </div>
              {session.completedAt && (
                <div className="info-row">
                  <span className="label">Completado:</span>
                  <span className="value">{formatDate(session.completedAt)}</span>
                </div>
              )}
              <div className="info-row">
                <span className="label">Duración:</span>
                <span className="value">{session.duration || 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="label">Sobrescribir:</span>
                <span className="value">{session.overwrite ? 'Sí' : 'No'}</span>
              </div>
            </div>
          </div>

          <div className="overview-card">
            <div className="card-header">
              <h3>Estadísticas de Procesamiento</h3>
            </div>
            <div className="card-content">
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-value">{session.totalRows.toLocaleString()}</div>
                  <div className="stat-label">Total Filas</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{session.processedRows.toLocaleString()}</div>
                  <div className="stat-label">Procesadas</div>
                </div>
                <div className="stat-item success">
                  <div className="stat-value">{session.insertedRows.toLocaleString()}</div>
                  <div className="stat-label">Insertadas</div>
                </div>
                <div className="stat-item info">
                  <div className="stat-value">{session.updatedRows.toLocaleString()}</div>
                  <div className="stat-label">Actualizadas</div>
                </div>
                <div className="stat-item warning">
                  <div className="stat-value">{session.errorRows.toLocaleString()}</div>
                  <div className="stat-label">Errores</div>
                </div>
                <div className="stat-item neutral">
                  <div className="stat-value">{session.duplicateRows.toLocaleString()}</div>
                  <div className="stat-label">Duplicados (No Subidos)</div>
                </div>
                <div className="stat-item excluded">
                  <div className="stat-value">{session.excludedHistorias.toLocaleString()}</div>
                  <div className="stat-label">Historias Excluidas</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{session.publicationCount.toLocaleString()}</div>
                  <div className="stat-label">Publicaciones Creadas</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rates and Percentages */}
      <div className="rates-section">
        <h3>📊 Tasas de Éxito</h3>
        <div className="rates-grid">
          <div className="rate-card success">
            <div className="rate-value">{session.successRate}%</div>
            <div className="rate-label">Tasa de Éxito</div>
          </div>
          <div className="rate-card error">
            <div className="rate-value">{session.errorRate}%</div>
            <div className="rate-label">Tasa de Error</div>
          </div>
          <div className="rate-card neutral">
            <div className="rate-value">{session.duplicateRate}%</div>
            <div className="rate-label">Tasa de Duplicados (No Subidos)</div>
          </div>
          <div className="rate-card excluded">
            <div className="rate-value">{session.excludedRate}%</div>
            <div className="rate-label">Tasa de Exclusión</div>
          </div>
        </div>
      </div>

      {/* Content Analysis */}
      <div className="content-analysis">
        <div className="analysis-grid">
          <div className="analysis-card">
            <h3>🏷️ Categorías Encontradas ({session.categoriesFound.length})</h3>
            <div className="tags-container">
              {session.categoriesFound.slice(0, 10).map((category, index) => (
                <span key={index} className="tag category-tag">
                  {category || 'Sin categoría'}
                </span>
              ))}
              {session.categoriesFound.length > 10 && (
                <span className="tag more-tag">
                  +{session.categoriesFound.length - 10} más
                </span>
              )}
            </div>
          </div>

          <div className="analysis-card">
            <h3>👤 Perfiles Encontrados ({session.profilesFound.length})</h3>
            <div className="tags-container">
              {session.profilesFound.slice(0, 8).map((profile, index) => (
                <span key={index} className="tag profile-tag">
                  {profile}
                </span>
              ))}
              {session.profilesFound.length > 8 && (
                <span className="tag more-tag">
                  +{session.profilesFound.length - 8} más
                </span>
              )}
            </div>
          </div>

          <div className="analysis-card">
            <h3>🌐 Redes Encontradas ({session.networksFound.length})</h3>
            <div className="tags-container">
              {session.networksFound.map((network, index) => (
                <span key={index} className="tag network-tag">
                  {network}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Technical Details */}
      <div className="technical-details">
        <div className="details-grid">
          <div className="details-card">
            <h3>📋 Headers Originales</h3>
            <div className="headers-list">
              {session.originalHeaders.map((header, index) => (
                <span key={index} className="header-item">
                  {header}
                </span>
              ))}
            </div>
          </div>

          <div className="details-card">
            <h3>🔗 Mapeo de Columnas</h3>
            <div className="mapping-list">
              {Object.entries(session.detectedColumns).map(([key, value]) => (
                <div key={key} className="mapping-item">
                  <span className="mapping-key">{key}:</span>
                  <span className="mapping-value">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sample Publications */}
      {session.samplePublications.length > 0 && (
        <div className="sample-publications">
          <h3>📝 Muestra de Publicaciones Creadas</h3>
          <div className="publications-table-container">
            <table className="publications-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Red</th>
                  <th>Perfil</th>
                  <th>Categoría</th>
                  <th>Tipo</th>
                  <th>Métricas</th>
                </tr>
              </thead>
              <tbody>
                {session.samplePublications.map((pub) => (
                  <tr key={pub.id}>
                    <td className="publication-id">{pub.id}</td>
                    <td>{new Date(pub.fecha).toLocaleDateString('es-ES')}</td>
                    <td>
                      <span className="network-badge">{pub.red}</span>
                    </td>
                    <td className="profile-name">{pub.perfil}</td>
                    <td className="category-name">{pub.categoria || 'Sin categoría'}</td>
                    <td className="publication-type">{pub.tipoPublicacion}</td>
                    <td className="metrics">
                      <div className="metric-item">👁️ {pub.impresiones.toLocaleString()}</div>
                      <div className="metric-item">📊 {pub.alcance.toLocaleString()}</div>
                      <div className="metric-item">❤️ {pub.meGusta.toLocaleString()}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="sample-note">
            Mostrando las primeras {session.samplePublications.length} publicaciones de {session.publicationCount.toLocaleString()} total.
          </p>
        </div>
      )}

      {/* Error Details */}
      {session.status === 'failed' && session.errorMessage && (
        <div className="error-details">
          <h3>❌ Detalles del Error</h3>
          <div className="error-content">
            <div className="error-message">
              <strong>Mensaje de Error:</strong>
              <p>{session.errorMessage}</p>
            </div>
            {session.errorDetails && (
              <div className="error-technical">
                <strong>Detalles Técnicos:</strong>
                <pre>{JSON.stringify(session.errorDetails, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
