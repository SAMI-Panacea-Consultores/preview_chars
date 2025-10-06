'use client'

import { useState, useEffect, useMemo } from 'react';
import { usePublicaciones } from '@/hooks/usePublicaciones';
import jsPDF from 'jspdf';

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

// Función para generar PDF ejecutivo
const generateExecutivePDF = (
  perfiles: PerfilSinCategoria[], 
  red: string, 
  fechaInicio: string, 
  fechaFin: string,
  fechaMin: string,
  fechaMax: string
) => {
  // Crear documento en orientación horizontal para más espacio
  const doc = new jsPDF('landscape', 'mm', 'a4');
  
  // Configurar fuente
  doc.setFont('helvetica');
  
  // Header del documento
  doc.setFontSize(20);
  doc.setTextColor(51, 51, 51);
  doc.text('Reporte Ejecutivo: Desalineación de Contenido', 20, 25);
  
  // Información del reporte
  doc.setFontSize(12);
  doc.setTextColor(102, 102, 102);
  const fechaGeneracion = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Generado: ${fechaGeneracion}`, 20, 35);
  
  // Parámetros del análisis
  doc.setFontSize(11);
  doc.setTextColor(68, 68, 68);
  const periodoTexto = (fechaInicio && fechaFin) 
    ? `${fechaInicio} a ${fechaFin}` 
    : `Datos históricos completos (${fechaMin} a ${fechaMax})`;
  doc.text(`Red Social: ${red}`, 20, 45);
  doc.text(`Período de Análisis: ${periodoTexto}`, 20, 52);
  doc.text(`Total de Perfiles Analizados: ${perfiles.length}`, 20, 59);
  
  // Resumen ejecutivo
  const totalPublicaciones = perfiles.reduce((sum, p) => sum + p.totalHistorico, 0);
  const totalDesalineadas = perfiles.reduce((sum, p) => sum + p.publicacionesSinCategoria, 0);
  const promedioDesalineacion = perfiles.length > 0 
    ? (totalDesalineadas / totalPublicaciones * 100).toFixed(1) 
    : '0.0';
  
  doc.setFontSize(12);
  doc.setTextColor(51, 51, 51);
  doc.text('Resumen Ejecutivo:', 20, 72);
  doc.setFontSize(10);
  doc.setTextColor(68, 68, 68);
  doc.text(`• Promedio de desalineación: ${promedioDesalineacion}%`, 25, 80);
  doc.text(`• Total de publicaciones analizadas: ${totalPublicaciones.toLocaleString()}`, 25, 87);
  doc.text(`• Publicaciones desalineadas: ${totalDesalineadas.toLocaleString()}`, 25, 94);
  
  // Configuración para múltiples páginas
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  const marginTop = 110;
  const marginBottom = 30;
  const rowHeight = 8;
  const headerHeight = 10;
  const maxRowsPerPage = Math.floor((pageHeight - marginTop - marginBottom) / rowHeight);
  
  let currentY = marginTop;
  let currentPage = 1;
  let rowsInCurrentPage = 0;
  
  // Función para crear header de tabla
  const createTableHeader = (y: number) => {
    // Header de la tabla (más ancho en horizontal)
    doc.setFillColor(71, 85, 105);
    doc.rect(20, y, pageWidth - 40, headerHeight, 'F');
    
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('#', 25, y + 7);
    doc.text('Perfil', 50, y + 7);
    doc.text('% Desalineación', 140, y + 7);
    doc.text('Total Pub.', 180, y + 7);
    doc.text('Desalineadas', 210, y + 7);
    doc.text('Me Gusta', 240, y + 7);
    
    return y + headerHeight;
  };
  
  // Crear primer header
  currentY = createTableHeader(currentY);
  
  // Procesar TODOS los perfiles (no limitar a 25)
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 51, 51);
  
  perfiles.forEach((perfil, index) => {
    // Verificar si necesitamos una nueva página
    if (rowsInCurrentPage >= maxRowsPerPage) {
      // Crear nueva página
      doc.addPage('landscape');
      currentPage++;
      currentY = 30; // Margen superior para páginas adicionales
      
      // Añadir header de página
      doc.setFontSize(14);
      doc.setTextColor(51, 51, 51);
      doc.text(`Reporte de Desalineación - Página ${currentPage}`, 20, currentY);
      currentY += 20;
      
      // Crear header de tabla en nueva página
      currentY = createTableHeader(currentY);
      rowsInCurrentPage = 0;
    }
    
    // Alternar color de fondo
    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(20, currentY, pageWidth - 40, rowHeight, 'F');
    }
    
    // Datos de la fila
    doc.setTextColor(51, 51, 51);
    doc.text((index + 1).toString(), 25, currentY + 6);
    
    // Nombre del perfil (más espacio en horizontal)
    const perfilName = perfil.perfil.length > 35 
      ? perfil.perfil.substring(0, 32) + '...' 
      : perfil.perfil;
    doc.text(perfilName, 50, currentY + 6);
    
    // Porcentaje con color según valor
    const porcentaje = `${perfil.porcentajeSinCategoria.toFixed(1)}%`;
    if (perfil.porcentajeSinCategoria > 50) {
      doc.setTextColor(220, 38, 127); // Rojo para alto
    } else if (perfil.porcentajeSinCategoria > 25) {
      doc.setTextColor(245, 158, 11); // Amarillo para medio
    } else {
      doc.setTextColor(34, 197, 94); // Verde para bajo
    }
    doc.text(porcentaje, 145, currentY + 6);
    
    // Volver a color normal para el resto
    doc.setTextColor(51, 51, 51);
    doc.text(perfil.totalHistorico.toString(), 185, currentY + 6);
    doc.text(perfil.publicacionesSinCategoria.toString(), 215, currentY + 6);
    doc.text(perfil.meGusta.toLocaleString(), 245, currentY + 6);
    
    currentY += rowHeight;
    rowsInCurrentPage++;
  });
  
  // Ir a la última página para añadir footer
  if (currentPage > 1) {
    // Ya estamos en la última página
  }
  
  // Footer con notas (ajustar posición)
  currentY += 15;
  
  // Si no hay espacio suficiente para el footer, crear nueva página
  if (currentY > pageHeight - 50) {
    doc.addPage('landscape');
    currentY = 30;
  }
  
  doc.setFontSize(8);
  doc.setTextColor(102, 102, 102);
  doc.text('Notas:', 20, currentY);
  doc.text('• Desalineación: Publicaciones que no están categorizadas como "Transparencia Pública", "Seguridad" o "Invertir para Crecer"', 20, currentY + 7);
  doc.text('• Los datos se basan en el análisis histórico completo de publicaciones por perfil', 20, currentY + 14);
  doc.text('• Este reporte incluye métricas totales de engagement independientemente de la categorización', 20, currentY + 21);
  doc.text(`• Reporte completo: ${perfiles.length} perfiles analizados en ${currentPage} página(s)`, 20, currentY + 28);
  
  // Generar nombre del archivo
  const fechaArchivo = new Date().toISOString().split('T')[0];
  const nombreArchivo = `reporte-desalineacion-completo-${red.toLowerCase()}-${fechaArchivo}.pdf`;
  
  // Descargar el PDF
  doc.save(nombreArchivo);
};

export default function SinCategoriaPage() {
  // Estados para filtros (igual que el home)
  const [red, setRed] = useState('Instagram');
  const [tiposPublicacionSeleccionados, setTiposPublicacionSeleccionados] = useState<string[]>([
    'Publicar', 'Reel', 'Video', 'Foto', 'Carrusel', 'Evento', 'Encuesta'
  ]);

  // Estados para filtros de fecha
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

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

  // Calcular rango de fechas disponibles (formato correcto para inputs date)
  const { fechaMin, fechaMax } = useMemo(() => {
    if (!completeData || completeData.length === 0) return { fechaMin: '', fechaMax: '' };
    
    const fechas = completeData
      .map(item => {
        const fecha = new Date(item.Fecha);
        return !isNaN(fecha.getTime()) ? fecha : null;
      })
      .filter(Boolean) as Date[];
    
    if (fechas.length === 0) return { fechaMin: '', fechaMax: '' };
    
    const minFecha = new Date(Math.min(...fechas.map(f => f.getTime())));
    const maxFecha = new Date(Math.max(...fechas.map(f => f.getTime())));
    
    // Formatear para inputs tipo date (YYYY-MM-DD)
    const fechaMin = minFecha.toISOString().split('T')[0];
    const fechaMax = maxFecha.toISOString().split('T')[0];
    
    console.log(`📅 Date range calculated: ${fechaMin} to ${fechaMax} (${fechas.length} valid dates)`);
    
    return { fechaMin, fechaMax };
  }, [completeData]);

  // Obtener redes disponibles
  const redesDisponibles = useMemo(() => {
    if (!completeData || completeData.length === 0) return [];
    return [...new Set(completeData.map(item => item.Red))].filter(Boolean);
  }, [completeData]);

  // Filtrar datos por red, tipos de publicación Y fechas (como el home)
  const filteredData = useMemo(() => {
    if (!completeData || completeData.length === 0) return [];

    return completeData.filter(item => {
      // Filtro por red
      if (item.Red !== red) return false;

      // Filtro por tipos de publicación
      if (!tiposPublicacionSeleccionados.includes(item['Tipo de publicación'])) return false;

      // Filtro por fechas (si están definidas)
      if (fechaInicio || fechaFin) {
        const fecha = new Date(item.Fecha);
        if (!fecha || isNaN(fecha.getTime())) return false;
        
        const fechaSolo = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
        
        if (fechaInicio) {
          const inicio = new Date(fechaInicio);
          if (fechaSolo < inicio) return false;
        }
        
        if (fechaFin) {
          const fin = new Date(fechaFin);
          if (fechaSolo > fin) return false;
        }
      }

      return true;
    });
  }, [completeData, red, tiposPublicacionSeleccionados, fechaInicio, fechaFin]);

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
      if (/pendiente/i.test(c)) c = 'Pendiente';
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
      
      // SIEMPRE sumar las métricas de TODAS las publicaciones (independientemente de categoría)
      perfilData.impresiones += Number(item.Impresiones) || 0;
      perfilData.alcance += Number(item.Alcance) || 0;
      perfilData.meGusta += Number(item['Me gusta']) || 0;
      perfilData.comentarios += Number(item.Comentarios) || 0;
      perfilData.compartidos += Number(item.Compartidos) || 0;
      perfilData.guardados += Number(item.Guardados) || 0;
      
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

  // Estadísticas locales para el panel de filtros
  const localStats = useMemo(() => {
    if (!completeData || completeData.length === 0) return null;
    
    return {
      totalPublicaciones: completeData.length,
      totalSinCategoria: perfilesSinCategoria.reduce((sum, p) => sum + p.publicacionesSinCategoria, 0),
      totalPerfiles: perfilesSinCategoria.length
    };
  }, [completeData, perfilesSinCategoria]);
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
                {filtersExpanded && localStats && (
                  <div className="filters-stats">
                    <div className="status-chip success">
                      📊 {localStats.totalPublicaciones.toLocaleString()} registros totales
                    </div>
                    <div className="status-chip info">
                      📱 {redesDisponibles.length} {redesDisponibles.length === 1 ? 'red' : 'redes'}
                    </div>
                    <div className="status-chip warning">
                      ⚠️ {localStats.totalSinCategoria.toLocaleString()} sin categoría
                    </div>
                    <div className="status-chip info">
                      👥 {localStats.totalPerfiles} perfiles analizados
                    </div>
                    <div className="status-chip info">
                      📅 Datos históricos completos ({fechaMin} a {fechaMax})
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Contenido colapsable del panel */}
            <div className={`filters-content ${filtersExpanded ? 'expanded' : 'collapsed'}`}>
                  <div className="csv-filters-grid">

                {/* Sección: Rango de Fechas */}
                <div className="filter-section">
                  <div className="filter-section-header">
                    <h3 className="filter-section-title">📅 Período de Tiempo</h3>
                    {(fechaInicio || fechaFin) && (
                      <button 
                        onClick={() => {
                          setFechaInicio('');
                          setFechaFin('');
                        }}
                        className="filter-clear-btn"
                        title="Limpiar fechas"
                      >
                        ✕ Limpiar
                      </button>
                    )}
                  </div>
                  <div className="date-range-container">
                    <div className="date-input-group">
                      <label className="date-label">Desde</label>
                      <input 
                        type="date"
                        value={fechaInicio}
                        onChange={e => {
                          const newValue = e.target.value;
                          // Validar que esté dentro del rango
                          if (newValue >= fechaMin && newValue <= fechaMax) {
                            setFechaInicio(newValue);
                          }
                        }}
                        min={fechaMin}
                        max={fechaMax}
                        className="date-input-modern"
                        disabled={!fechaMin}
                        placeholder="Fecha inicio"
                        title={`Rango disponible: ${fechaMin} a ${fechaMax}`}
                      />
                    </div>
                    <div className="date-separator">→</div>
                    <div className="date-input-group">
                      <label className="date-label">Hasta</label>
                      <input 
                        type="date"
                        value={fechaFin}
                        onChange={e => {
                          const newValue = e.target.value;
                          // Validar que esté dentro del rango
                          if (newValue >= fechaMin && newValue <= fechaMax) {
                            setFechaFin(newValue);
                          }
                        }}
                        min={fechaMin}
                        max={fechaMax}
                        className="date-input-modern"
                        disabled={!fechaMin}
                        placeholder="Fecha fin"
                        title={`Rango disponible: ${fechaMin} a ${fechaMax}`}
                      />
                    </div>
                  </div>
                  {fechaMin && fechaMax && (
                    <div className="date-range-info">
                      Rango disponible: {fechaMin} a {fechaMax}
                    </div>
                  )}
                </div>

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
                {(fechaInicio || fechaFin) && (
                  <span className="active-filter-chip">
                    📅 {fechaInicio || 'inicio'} → {fechaFin || 'fin'}
                  </span>
                )}
                <span className="active-filter-chip">
                  📄 {tiposPublicacionSeleccionados.length} tipos
                </span>
                {!fechaInicio && !fechaFin && (
                  <span className="active-filter-chip">
                    📊 Datos históricos completos ({fechaMin} a {fechaMax})
                  </span>
                )}
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
              <div className="table-header-content">
                <div className="table-title-section">
                  <h2 className="table-title">📊 Análisis Histórico Completo por Perfil</h2>
                  <p className="table-subtitle">
                    <strong>Fórmula:</strong> % Sin Categoría = (Sin Categoría ÷ Total Histórico) × 100
                    <br />
                    <strong>Lógica:</strong> Usa la misma normalización de categorías que el mosaico del home
                    <br />
                    <strong>Datos:</strong> Todas las publicaciones históricas • Métricas solo de publicaciones sin categoría válida
                  </p>
                </div>
                
                {/* Botón para generar PDF */}
                {!dbLoading && !dbError && perfilesSinCategoria.length > 0 && (
                  <div className="table-actions">
                    <button
                      onClick={() => generateExecutivePDF(
                        perfilesSinCategoria, 
                        red, 
                        fechaInicio, 
                        fechaFin,
                        fechaMin,
                        fechaMax
                      )}
                      className="btn-export-pdf"
                      title="Descargar reporte ejecutivo en PDF"
                    >
                      <span className="export-icon">📄</span>
                      <span className="export-text">Exportar PDF</span>
                    </button>
                  </div>
                )}
              </div>
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
                      <th className="table-header-cell metric-column">%Desalineación</th>
                      <th className="table-header-cell metric-column">Publicaciones</th>
                      <th className="table-header-cell metric-column">Sin Categoría</th>
                      <th className="table-header-cell metric-column">Categorizadas</th>
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
                        <td className="table-cell metric-cell">
                          <span className={`percentage-badge ${perfil.porcentajeSinCategoria > 50 ? 'high' : perfil.porcentajeSinCategoria > 25 ? 'medium' : 'low'}`}>
                            {perfil.porcentajeSinCategoria.toFixed(1)}%
                          </span>
                        </td>
                        <td className="table-cell metric-cell">
                          <span className="metric-value">{perfil.totalHistorico}</span>
                        </td>
                        <td className="table-cell metric-cell highlight-cell">
                          <span className="metric-value warning">{perfil.publicacionesSinCategoria}</span>
                        </td>
                        <td className="table-cell metric-cell">
                          <span className="metric-value success">{perfil.totalCategorizadas}</span>
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
