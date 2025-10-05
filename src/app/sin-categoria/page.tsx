'use client'

import { useState, useEffect, useMemo } from 'react';
import { usePublicaciones } from '@/hooks/usePublicaciones';

// Tipos para las métricas de perfiles
interface PerfilSinCategoria {
  perfil: string;
  red: string;
  publicacionesSinCategoria: number;
  totalHistorico: number;
  totalCategorizadas: number; // Nueva columna: publicaciones con categoría
  porcentajeSinCategoria: number;
  impresiones: number;
  alcance: number;
  meGusta: number;
  comentarios: number;
  compartidos: number;
  guardados: number;
}

export default function SinCategoriaPage() {
  // Estados para filtros (solo red y tipos de publicación)
  const [red, setRed] = useState('Instagram');
  const [tiposPublicacionSeleccionados, setTiposPublicacionSeleccionados] = useState<string[]>([
    'Publicar', 'Historia', 'Reel', 'Video', 'Foto', 'Carrusel', 'Evento', 'Encuesta'
  ]);

  // Estado para colapsar/expandir filtros
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Hook para obtener datos (igual que el home)
  const { 
    data: dbData, 
    loading: dbLoading, 
    error: dbError,
    fetchAllData
  } = usePublicaciones({
    autoFetch: true
  });

  // Estado para almacenar todos los datos (igual que allRowsForCharts en el home)
  const [completeData, setCompleteData] = useState<any[]>([]);

  // Cargar todos los datos para análisis (igual que el home)
  useEffect(() => {
    const loadAllDataForAnalysis = async () => {
      if (fetchAllData) {
        console.log('🔄 Loading all data for sin-categoria analysis...');
        const allData = await fetchAllData();
        console.log(`📊 Loaded ${allData.length} records for analysis`);
        
        // DEBUG: Ver estructura de los datos (igual que antes)
        if (allData.length > 0) {
          console.log('🔍 DEBUG: Estructura del primer registro:', allData[0]);
          console.log('🔍 DEBUG: Keys disponibles:', Object.keys(allData[0]));
          
          // Buscar registros de alcaldiadecali
          const alcaldiaRecords = allData.filter((r: any) => 
            r.Red === 'Instagram' && r.Perfil === 'alcaldiadecali'
          );
          console.log(`🔍 DEBUG: Encontrados ${alcaldiaRecords.length} registros de alcaldiadecali`);
          
          if (alcaldiaRecords.length > 0) {
            console.log('🔍 DEBUG: Primeros 3 registros de alcaldiadecali:');
            alcaldiaRecords.slice(0, 3).forEach((record: any, i: number) => {
              console.log(`  ${i + 1}. Categoría: "${record.categoria}", Tipo: "${record['Tipo de publicación']}"`);
            });
            
            // Contar categorías
            const categoryCounts: Record<string, number> = {};
            alcaldiaRecords.forEach((record: any) => {
              const cat = record.categoria || 'undefined';
              categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
            });
            console.log('🔍 DEBUG: Distribución de categorías desde fetchAllData:', categoryCounts);
          }
        }
        
        setCompleteData(allData);
      }
    };

    // Solo cargar al inicio (igual que el home)
    loadAllDataForAnalysis();
  }, [fetchAllData]);

  // Calcular rango de fechas disponibles (solo para información)
  const { fechaMin, fechaMax } = useMemo(() => {
    if (!completeData || completeData.length === 0) return { fechaMin: '', fechaMax: '' };
    
    const fechas = completeData
      .map(item => item.Fecha)
      .filter(fecha => fecha && fecha.trim() !== '')
      .sort();
    
    return {
      fechaMin: fechas[0] || '',
      fechaMax: fechas[fechas.length - 1] || ''
    };
  }, [completeData]);

  // Obtener redes disponibles
  const redesDisponibles = useMemo(() => {
    if (!completeData || completeData.length === 0) return [];
    return [...new Set(completeData.map(item => item.Red))].filter(Boolean);
  }, [completeData]);

  // Filtrar datos solo por red y tipos de publicación (SIN filtros de fecha)
  const filteredData = useMemo(() => {
    if (!completeData || completeData.length === 0) return [];

    return completeData.filter(item => {
      // Filtro por red
      if (item.Red !== red) return false;

      // Filtro por tipos de publicación
      if (!tiposPublicacionSeleccionados.includes(item['Tipo de publicación'])) return false;

      return true;
    });
  }, [completeData, red, tiposPublicacionSeleccionados]);

  // Calcular métricas por perfil usando TODOS los datos históricos
  const perfilesSinCategoria = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];

    const perfilesMap = new Map<string, PerfilSinCategoria>();

    // Función de normalización idéntica al home
    function normalizeCategory(raw: string): string {
      let c = (raw || '').trim();
      if (!c) return 'Sin categoría';
      
      // Remover comillas exteriores
      if ((c.startsWith('"') && c.endsWith('"')) || (c.startsWith("'") && c.endsWith("'"))) {
        c = c.slice(1, -1).trim();
      }
      
      // Valores vacíos, N/A, guiones -> Sin categoría
      if (!c || /^(n\/a|na|n\.a\.?|-+|_+)$/i.test(c)) {
        return 'Sin categoría';
      }
      
      // ESTRATEGIA "X" -> X
      const estrMatch = c.match(/^ESTRATEGIA\s+\"?([^\"]+)\"?$/i);
      if (estrMatch) c = estrMatch[1];
      
      // Normalizar tildes faltantes comunes
      if (/^sin categoria$/i.test(c)) c = 'Sin categoría';
      
      // Mayúsculas coherentes con paleta
      if (/invertir.*para.*crecer/i.test(c)) c = 'INVERTIR PARA CRECER';
      if (/seguridad/i.test(c)) c = 'SEGURIDAD';
      if (/transparencia.*publica/i.test(c)) c = 'TRANSPARENCIA PÚBLICA';
      if (/^error en procesamiento$/i.test(c)) c = 'Error en procesamiento';
      
      return c;
    }

    // Procesar todos los datos filtrados (solo por red y tipo de publicación)
    filteredData.forEach(item => {
      const perfil = item.Perfil;
      
      if (!perfilesMap.has(perfil)) {
        perfilesMap.set(perfil, {
          perfil,
          red: item.Red,
          publicacionesSinCategoria: 0,
          totalHistorico: 0,
          totalCategorizadas: 0,
          porcentajeSinCategoria: 0,
          impresiones: 0,
          alcance: 0,
          meGusta: 0,
          comentarios: 0,
          compartidos: 0,
          guardados: 0,
        });
      }

      const perfilData = perfilesMap.get(perfil)!;
      
      // Normalizar categoría usando la misma función del home
      const rawCats = item.categoria?.trim() || ''; // ← Usar 'categoria' minúscula como en el home
      const tokens = rawCats ? rawCats.split(',') : [];
      const categories = tokens.length ? tokens : ['Sin categoría'];
      
      // IMPORTANTE: Contar UNA SOLA VEZ por publicación (item)
      perfilData.totalHistorico++;
      
      // Verificar si TODA la publicación es sin categoría
      let publicacionEsSinCategoria = false;
      let publicacionEsConCategoria = false;
      
      for (const token of categories) {
        const categoria = normalizeCategory(token);
        
        if (categoria === 'Sin categoría') {
          publicacionEsSinCategoria = true;
        } else {
          publicacionEsConCategoria = true;
        }
      }
      
      // Si la publicación tiene SOLO categorías sin categoría válida
      if (publicacionEsSinCategoria && !publicacionEsConCategoria) {
        perfilData.publicacionesSinCategoria++;
        // Sumar métricas completas de esta publicación
        perfilData.impresiones += Number(item.Impresiones) || 0;
        perfilData.alcance += Number(item.Alcance) || 0;
        perfilData.meGusta += Number(item['Me gusta']) || 0;
        perfilData.comentarios += Number(item.Comentarios) || 0;
        perfilData.compartidos += Number(item.Compartidos) || 0;
        perfilData.guardados += Number(item.Guardados) || 0;
      } else if (publicacionEsConCategoria) {
        perfilData.totalCategorizadas++;
      }
    });

    // Calcular porcentajes y mostrar todos los perfiles
    const result = Array.from(perfilesMap.values())
      .map(perfil => {
        // FÓRMULA: (Sin categoría / Total histórico) * 100
        const porcentaje = perfil.totalHistorico > 0 ? 
          (perfil.publicacionesSinCategoria / perfil.totalHistorico) * 100 : 0;
        
        console.log(`${perfil.perfil}: ${perfil.publicacionesSinCategoria} sin categoría + ${perfil.totalCategorizadas} categorizadas = ${perfil.totalHistorico} total (${porcentaje.toFixed(1)}%)`);
        console.log(`  → Usando normalización idéntica al home (mosaico)`);
        
        return {
          ...perfil,
          porcentajeSinCategoria: porcentaje
        };
      })
      // Ordenar por porcentaje descendente (más desalineados primero)
      .sort((a, b) => {
        if (Math.abs(a.porcentajeSinCategoria - b.porcentajeSinCategoria) < 0.1) {
          return b.publicacionesSinCategoria - a.publicacionesSinCategoria;
        }
        return b.porcentajeSinCategoria - a.porcentajeSinCategoria;
      });

    console.log(`📊 Showing ALL ${result.length} profiles for ${red}`);
    console.log(`📈 Data range: ${fechaMin} to ${fechaMax}`);
    console.log(`🎯 Using HOME normalization logic for categories`);
    return result;
  }, [filteredData, red, fechaMin, fechaMax]);

  // Estadísticas resumen
  const resumenStats = useMemo(() => {
    const totalPerfiles = perfilesSinCategoria.length;
    const totalPublicacionesSinCategoria = perfilesSinCategoria.reduce((sum, p) => sum + p.publicacionesSinCategoria, 0);
    const totalPublicaciones = filteredData.length;
    const porcentajeGlobalSinCategoria = totalPublicaciones > 0 ? (totalPublicacionesSinCategoria / totalPublicaciones) * 100 : 0;

    return {
      totalPerfiles,
      totalPublicacionesSinCategoria,
      totalPublicaciones,
      porcentajeGlobalSinCategoria
    };
  }, [perfilesSinCategoria, filteredData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <header className="dashboard-header">
        <nav className="dashboard-nav">
          <div className="dashboard-brand">
            <h1 className="brand-title">📊 Análisis Histórico Completo</h1>
            <p className="brand-subtitle">Vista completa de todas las publicaciones por perfil - Sin filtros de tiempo</p>
          </div>
          <div className="dashboard-actions">
            <a href="/" className="nav-link">← Volver al Dashboard</a>
          </div>
        </nav>
      </header>

      <main className="dashboard-main">
        {/* Panel de Filtros */}
        <section className="filters-panel">
          <div className="filters-container">
            {/* Header del panel con botón de colapsar/expandir */}
            <div className="filters-header">
              <div className="filters-title-section">
                <div className="filters-title-row">
                  <h2 className="filters-title">🔍 Filtros de Análisis</h2>
                  <button 
                    onClick={() => setFiltersExpanded(!filtersExpanded)}
                    className={`filters-toggle-btn ${filtersExpanded ? 'expanded' : 'collapsed'}`}
                    title={filtersExpanded ? 'Ocultar filtros' : 'Mostrar filtros'}
                  >
                    <span className="filters-toggle-icon">
                      {filtersExpanded ? '▲' : '▼'}
                    </span>
                    <span className="filters-toggle-text">
                      {filtersExpanded ? 'Ocultar' : 'Mostrar'}
                    </span>
                  </button>
                </div>
                {filtersExpanded && stats && (
                  <div className="filters-stats">
                    <div className="status-chip success">
                      📊 {stats.totalPublicaciones.toLocaleString()} registros totales
                    </div>
                    <div className="status-chip info">
                      📱 {redesDisponibles.length} {redesDisponibles.length === 1 ? 'red' : 'redes'}
                    </div>
                    <div className="status-chip warning">
                      ⚠️ {resumenStats.totalPublicacionesSinCategoria} sin categoría
                    </div>
                    {fechaInicio && fechaFin && (
                      <div className="status-chip info">
                        📅 Últimos 7 días ({fechaInicio} a {fechaFin})
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Contenido colapsable del panel */}
            <div className={`filters-content ${filtersExpanded ? 'expanded' : 'collapsed'}`}>
              <div className="filters-grid">

                {/* Sección: Red Social */}
                <div className="filter-section">
                  <div className="filter-section-header">
                    <h3 className="filter-section-title">📱 Red Social</h3>
                  </div>
                  <div className="social-network-selector">
                    {redesDisponibles.map(r => (
                      <button 
                        key={r}
                        onClick={() => setRed(r)}
                        className={`social-network-btn ${red === r ? 'active' : ''}`}
                        title={`Filtrar por ${r}`}
                      >
                        <span className="social-network-icon">
                          {r === 'Instagram' ? '📷' : 
                           r === 'Facebook' ? '👥' : 
                           r === 'TikTok' ? '🎵' : 
                           r === 'Twitter' ? '🐦' : '📱'}
                        </span>
                        <span className="social-network-text">{r}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sección: Tipos de Publicación */}
                <div className="filter-section">
                  <div className="filter-section-header">
                    <h3 className="filter-section-title">📄 Tipos de Publicación</h3>
                    <span className="selected-count">
                      {tiposPublicacionSeleccionados.length} seleccionados
                    </span>
                  </div>
                  <div className="publication-types-grid">
                    {['Publicar', 'Historia', 'Reel', 'Video', 'Foto', 'Carrusel', 'Evento', 'Encuesta'].map(tipo => (
                      <button
                        key={tipo}
                        onClick={() => {
                          const isSelected = tiposPublicacionSeleccionados.includes(tipo);
                          if (isSelected) {
                            setTiposPublicacionSeleccionados(prev => prev.filter(t => t !== tipo));
                          } else {
                            setTiposPublicacionSeleccionados(prev => [...prev, tipo]);
                          }
                        }}
                        className={`publication-type-btn ${tiposPublicacionSeleccionados.includes(tipo) ? 'active' : ''}`}
                        title={`${tiposPublicacionSeleccionados.includes(tipo) ? 'Deseleccionar' : 'Seleccionar'} ${tipo}`}
                      >
                        <span className="publication-type-icon">
                          {tipo === 'Publicar' ? '📝' : 
                           tipo === 'Historia' ? '📖' : 
                           tipo === 'Reel' ? '🎬' : 
                           tipo === 'Video' ? '🎥' : 
                           tipo === 'Foto' ? '📸' : 
                           tipo === 'Carrusel' ? '🎠' : 
                           tipo === 'Evento' ? '📅' : 
                           tipo === 'Encuesta' ? '📊' : '📄'}
                        </span>
                        <span className="publication-type-text">{tipo}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Resumen de filtros activos - siempre visible */}
            <div className="active-filters-summary">
              <div className="active-filters-title">Filtros Activos:</div>
              <div className="active-filters-list">
                <span className="active-filter-chip">
                  📱 {red}
                </span>
                <span className="active-filter-chip">
                  📄 {tiposPublicacionSeleccionados.length} tipos
                </span>
                <span className="active-filter-chip">
                  📊 Datos históricos completos ({fechaMin} a {fechaMax})
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Estadísticas Resumen */}
        <section className="stats-summary-section">
          <div className="stats-summary-container">
            <h2 className="stats-summary-title">📈 Resumen Histórico Completo - {red}</h2>
            <div className="stats-summary-grid">
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <div className="stat-value">{resumenStats.totalPerfiles}</div>
                  <div className="stat-label">Total de perfiles</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⚠️</div>
                <div className="stat-content">
                  <div className="stat-value">{resumenStats.totalPublicacionesSinCategoria.toLocaleString()}</div>
                  <div className="stat-label">Publicaciones sin categoría</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <div className="stat-value">{perfilesSinCategoria.reduce((sum, p) => sum + p.totalCategorizadas, 0).toLocaleString()}</div>
                  <div className="stat-label">Publicaciones categorizadas</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <div className="stat-value">{resumenStats.porcentajeGlobalSinCategoria.toFixed(1)}%</div>
                  <div className="stat-label">% Global sin categorizar</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tabla de Perfiles */}
        <section className="table-section">
          <div className="table-container">
            <div className="table-header">
              <h2 className="table-title">📊 Análisis Histórico Completo por Perfil</h2>
              <p className="table-subtitle">
                <strong>Fórmula:</strong> % Sin Categoría = (Sin Categoría ÷ Total Histórico) × 100
                <br />
                <strong>Lógica:</strong> Usa la misma normalización de categorías que el mosaico del home
                <br />
                <strong>Datos:</strong> Todas las publicaciones históricas • Métricas solo de publicaciones sin categoría válida
              </p>
            </div>

            {dbLoading && (
              <div className="loading-state">
                <div className="loading-spinner">⏳</div>
                <p>Cargando datos...</p>
              </div>
            )}

            {dbError && (
              <div className="error-state">
                <div className="error-icon">❌</div>
                <p>Error al cargar los datos: {dbError}</p>
              </div>
            )}

            {!dbLoading && !dbError && perfilesSinCategoria.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3>No hay datos</h3>
                <p>No se encontraron perfiles en el período seleccionado con los filtros aplicados.</p>
              </div>
            )}

            {!dbLoading && !dbError && perfilesSinCategoria.length > 0 && (
              <div className="table-wrapper">
                <table className="profiles-table">
                  <thead>
                    <tr>
                      <th className="table-header-cell rank-column">#</th>
                      <th className="table-header-cell profile-column">Perfil</th>
                      <th className="table-header-cell metric-column">Sin Categoría</th>
                      <th className="table-header-cell metric-column">Categorizadas</th>
                      <th className="table-header-cell metric-column">Total Histórico</th>
                      <th className="table-header-cell metric-column">% Sin Categoría</th>
                      <th className="table-header-cell metric-column">Impresiones</th>
                      <th className="table-header-cell metric-column">Alcance</th>
                      <th className="table-header-cell metric-column">Me Gusta</th>
                      <th className="table-header-cell metric-column">Comentarios</th>
                      <th className="table-header-cell metric-column">Compartidos</th>
                      <th className="table-header-cell metric-column">Guardados</th>
                    </tr>
                  </thead>
                  <tbody>
                    {perfilesSinCategoria.map((perfil, index) => (
                      <tr key={perfil.perfil} className="table-row">
                        <td className="table-cell rank-cell">
                          <span className="rank-badge">{index + 1}</span>
                        </td>
                        <td className="table-cell profile-cell">
                          <div className="profile-info">
                            <div className="profile-name">{perfil.perfil}</div>
                            <div className="profile-network">{perfil.red}</div>
                          </div>
                        </td>
                        <td className="table-cell metric-cell highlight-cell">
                          <span className="metric-value warning">{perfil.publicacionesSinCategoria}</span>
                        </td>
                        <td className="table-cell metric-cell">
                          <span className="metric-value success">{perfil.totalCategorizadas}</span>
                        </td>
                        <td className="table-cell metric-cell">
                          <span className="metric-value">{perfil.totalHistorico}</span>
                        </td>
                        <td className="table-cell metric-cell">
                          <span className={`percentage-badge ${perfil.porcentajeSinCategoria > 50 ? 'high' : perfil.porcentajeSinCategoria > 25 ? 'medium' : 'low'}`}>
                            {perfil.porcentajeSinCategoria.toFixed(1)}%
                          </span>
                        </td>
                        <td className="table-cell metric-cell">
                          <span className="metric-value">{perfil.impresiones.toLocaleString()}</span>
                        </td>
                        <td className="table-cell metric-cell">
                          <span className="metric-value">{perfil.alcance.toLocaleString()}</span>
                        </td>
                        <td className="table-cell metric-cell">
                          <span className="metric-value">{perfil.meGusta.toLocaleString()}</span>
                        </td>
                        <td className="table-cell metric-cell">
                          <span className="metric-value">{perfil.comentarios.toLocaleString()}</span>
                        </td>
                        <td className="table-cell metric-cell">
                          <span className="metric-value">{perfil.compartidos.toLocaleString()}</span>
                        </td>
                        <td className="table-cell metric-cell">
                          <span className="metric-value">{perfil.guardados.toLocaleString()}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
