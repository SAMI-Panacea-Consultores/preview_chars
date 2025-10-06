'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import CSVUploader from '@/components/CSVUploader';

interface CsvSession {
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
  successRate: string;
  errorRate: string;
}

interface CsvSessionsResponse {
  success: boolean;
  data: CsvSession[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  stats: {
    totalSessions: number;
    completedSessions: number;
    failedSessions: number;
    processingSessions: number;
    partialSessions: number;
    totalRecordsProcessed: number;
    totalErrors: number;
  };
}

export default function CsvSessionsPage() {
  const [sessions, setSessions] = useState<CsvSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [stats, setStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    failedSessions: 0,
    processingSessions: 0,
    partialSessions: 0,
    totalRecordsProcessed: 0,
    totalErrors: 0
  });

  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [fileNameFilter, setFileNameFilter] = useState<string>('');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');

  const fetchSessions = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      });

      if (statusFilter) params.append('status', statusFilter);
      if (fileNameFilter) params.append('fileName', fileNameFilter);
      if (startDateFilter) params.append('startDate', startDateFilter);
      if (endDateFilter) params.append('endDate', endDateFilter);

      const response = await fetch(`/api/csv-sessions?${params}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data: CsvSessionsResponse = await response.json();
      
      if (data.success) {
        setSessions(data.data);
        setPagination(data.pagination);
        setStats(data.stats);
      } else {
        throw new Error('Error al cargar sesiones CSV');
      }
    } catch (err) {
      console.error('Error fetching CSV sessions:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions(1);
  }, [statusFilter, fileNameFilter, startDateFilter, endDateFilter]);

  const handlePageChange = (newPage: number) => {
    fetchSessions(newPage);
  };

  const clearFilters = () => {
    setStatusFilter('');
    setFileNameFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
  };

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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="csv-sessions-page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <div className="page-title-section">
            <h1 className="page-title">📁 Historial de Cargas CSV</h1>
            <p className="page-subtitle">
              Gestiona y monitorea todas las sesiones de carga de archivos CSV
            </p>
          </div>
          <div className="page-actions">
            <Link href="/" className="btn-secondary">
              ← Volver al Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="stats-overview">
        <div className="stats-grid-clean">
          <div className="stat-card-clean">
            <div className="stat-number">{stats.totalSessions.toLocaleString()}</div>
            <div className="stat-label-clean">Total Sesiones</div>
          </div>
          <div className="stat-card-clean success">
            <div className="stat-number">{stats.completedSessions.toLocaleString()}</div>
            <div className="stat-label-clean">Completadas</div>
          </div>
          <div className="stat-card-clean error">
            <div className="stat-number">{stats.failedSessions.toLocaleString()}</div>
            <div className="stat-label-clean">Fallidas</div>
          </div>
          <div className="stat-card-clean info">
            <div className="stat-number">{stats.totalRecordsProcessed.toLocaleString()}</div>
            <div className="stat-label-clean">Registros Procesados</div>
          </div>
          <div className="stat-card-clean warning">
            <div className="stat-number">
              {sessions.reduce((total, session) => total + (session.duplicateRows || 0), 0).toLocaleString()}
            </div>
            <div className="stat-label-clean">Duplicados (No Subidos)</div>
          </div>
        </div>
      </div>

      {/* CSV Upload Section */}
      <div className="upload-section">
        <div className="upload-header">
          <h3>📤 Subir Nuevo Archivo CSV</h3>
          <p>Sube un nuevo archivo CSV para procesar y agregar al historial de sesiones</p>
        </div>
        <div className="upload-container">
          <CSVUploader 
            onUploadSuccess={() => {
              // Refrescar la lista de sesiones después de una carga exitosa
              fetchSessions(1);
            }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-header">
          <h3>🔍 Filtros</h3>
          <button 
            onClick={clearFilters}
            className="btn-clear-filters"
            disabled={!statusFilter && !fileNameFilter && !startDateFilter && !endDateFilter}
          >
            Limpiar Filtros
          </button>
        </div>
        
            <div className="csv-filters-grid">
          <div className="filter-group">
            <label>Estado</label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">Todos los estados</option>
              <option value="processing">Procesando</option>
              <option value="completed">Completado</option>
              <option value="failed">Falló</option>
              <option value="partial">Parcial</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Nombre de Archivo</label>
            <input
              type="text"
              value={fileNameFilter}
              onChange={(e) => setFileNameFilter(e.target.value)}
              placeholder="Buscar por nombre..."
              className="filter-input"
            />
          </div>
          
          <div className="filter-group">
            <label>Fecha Inicio</label>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="filter-input"
            />
          </div>
          
          <div className="filter-group">
            <label>Fecha Fin</label>
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="filter-input"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="content-section">
        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Cargando sesiones CSV...</p>
          </div>
        )}

        {error && (
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <div className="error-content">
              <h3>Error al cargar sesiones</h3>
              <p>{error}</p>
              <button onClick={() => fetchSessions(1)} className="btn-retry">
                Reintentar
              </button>
            </div>
          </div>
        )}

        {!loading && !error && sessions.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📂</div>
            <h3>No hay sesiones CSV</h3>
            <p>No se encontraron sesiones de carga con los filtros aplicados.</p>
          </div>
        )}

        {!loading && !error && sessions.length > 0 && (
          <>
            <div className="sessions-table-container">
              <table className="sessions-table">
                <thead>
                  <tr>
                    <th>Archivo</th>
                    <th>Estado</th>
                    <th>Registros</th>
                    <th>Éxito/Error</th>
                    <th>Fecha</th>
                    <th>Duración</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.id}>
                      <td>
                        <div className="file-info">
                          <div className="file-name">{session.fileName}</div>
                          <div className="file-size">{formatFileSize(session.fileSize)}</div>
                        </div>
                      </td>
                      <td>{getStatusBadge(session.status)}</td>
                      <td>
                        <div className="records-info">
                          <div className="total-records">{session.totalRows.toLocaleString()}</div>
                          <div className="processed-records">
                            {session.processedRows.toLocaleString()} procesados
                          </div>
                          {session.duplicateRows > 0 && (
                            <div className="duplicate-records">
                              {session.duplicateRows.toLocaleString()} duplicados (no subidos)
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="success-error-info">
                          <div className="success-rate">✅ {session.successRate}%</div>
                          <div className="error-rate">❌ {session.errorRate}%</div>
                        </div>
                      </td>
                      <td>
                        <div className="date-info">
                          <div className="start-date">{formatDate(session.startedAt)}</div>
                          {session.completedAt && (
                            <div className="end-date">
                              Fin: {formatDate(session.completedAt)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>{formatDuration(session.processingTime)}</td>
                      <td>
                        <div className="actions">
                          <Link 
                            href={`/csv-sessions/${session.id}`}
                            className="btn-view-details"
                          >
                            Ver Detalles
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination-container">
              <div className="pagination-info">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} sesiones
              </div>
              
              <div className="pagination-controls">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="btn-pagination"
                >
                  ← Anterior
                </button>
                
                <span className="page-indicator">
                  Página {pagination.page} de {pagination.totalPages}
                </span>
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className="btn-pagination"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
