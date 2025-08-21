'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import html2canvas from 'html2canvas';

type Row = Record<string, string>;

// Colores Apple-inspired para las métricas
const METRIC_COLORS = {
  'Impresiones': '#007AFF',
  'Alcance': '#34C759', 
  'Me gusta': '#FF3B30'
};

const CATEGORY_COLOR: Record<string, string> = {
  'Error en procesamiento': '#FF3B30',
  'INVERTIR PARA CRECER': '#34C759',  
  'SEGURIDAD': '#007AFF',
  'TRANSPARENCIA PÚBLICA': '#5856D6',
  'Sin categoría': '#8E8E93'
};

const ALL_CATEGORIES = [
  'Error en procesamiento',
  'INVERTIR PARA CRECER', 
  'SEGURIDAD',
  'TRANSPARENCIA PÚBLICA',
  'Sin categoría'
];

export default function PerfilDetailPage() {
  const params = useParams();
  const router = useRouter();
  const red = decodeURIComponent(params.red as string);
  const perfil = decodeURIComponent(params.perfil as string);

  const [rows, setRows] = useState<Row[]>([]);
  const [allRows, setAllRows] = useState<Row[]>([]); // Para calcular globales
  const [originalRows, setOriginalRows] = useState<Row[]>([]); // Datos sin filtrar
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  
  // Estados para filtros de fecha
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [fechaMin, setFechaMin] = useState('');
  const [fechaMax, setFechaMax] = useState('');

  // Cargar datos del CSV desde localStorage o fetch
  useEffect(() => {
    const loadData = async () => {
      try {
        // Intentar obtener datos del localStorage primero
        const storedData = localStorage.getItem('csvData');
        if (storedData) {
          const data = JSON.parse(storedData);
          setRows(data);
          setAllRows(data); // Guardar todos los datos para cálculos globales
          setOriginalRows(data); // Guardar datos originales para filtros
          
          // Calcular rango de fechas disponible
          const fechas = data
            .map(row => parseCSVDate(row['Fecha'] || ''))
            .filter(Boolean) as Date[];
          
          if (fechas.length > 0) {
            const minFecha = new Date(Math.min(...fechas.map(f => f.getTime())));
            const maxFecha = new Date(Math.max(...fechas.map(f => f.getTime())));
            setFechaMin(minFecha.toISOString().split('T')[0]);
            setFechaMax(maxFecha.toISOString().split('T')[0]);
          }
          
          setLoading(false);
          return;
        }

        // Si no hay datos almacenados, cargar desde el archivo
        const response = await fetch('/input.csv');
        const csvText = await response.text();
        
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            const data = result.data as Row[];
            setRows(data);
            setAllRows(data); // Guardar todos los datos para cálculos globales
            setOriginalRows(data); // Guardar datos originales para filtros
            
            // Calcular rango de fechas disponible
            const fechas = data
              .map(row => parseCSVDate(row['Fecha'] || ''))
              .filter(Boolean) as Date[];
            
            if (fechas.length > 0) {
              const minFecha = new Date(Math.min(...fechas.map(f => f.getTime())));
              const maxFecha = new Date(Math.max(...fechas.map(f => f.getTime())));
              setFechaMin(minFecha.toISOString().split('T')[0]);
              setFechaMax(maxFecha.toISOString().split('T')[0]);
            }
            
            localStorage.setItem('csvData', JSON.stringify(data));
            setLoading(false);
          }
        });
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filtrar datos por fecha cuando cambien los filtros
  useEffect(() => {
    if (originalRows.length === 0) return;

    let filteredData = [...originalRows];

    if (fechaInicio || fechaFin) {
      filteredData = originalRows.filter(row => {
        const fecha = parseCSVDate(row['Fecha'] || '');
        if (!fecha) return false;

        const fechaStr = fecha.toISOString().split('T')[0];
        
        if (fechaInicio && fechaStr < fechaInicio) return false;
        if (fechaFin && fechaStr > fechaFin) return false;
        
        return true;
      });
    }

    setRows(filteredData);
  }, [fechaInicio, fechaFin, originalRows]);

  // Función para parsear fechas del CSV (formato: "M/D/YYYY H:MM am/pm")
  const parseCSVDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  };

  // Función para formatear fecha como YYYY-MM-DD
  const formatDateKey = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Función para parsear números con comas como separadores de miles
  const parseNumber = (numStr: string): number => {
    if (!numStr || numStr.trim() === '') return 0;
    // Remover comas y parsear como entero
    const cleaned = numStr.replace(/,/g, '');
    const parsed = parseInt(cleaned, 10);
    
    // Debug temporal - remover después
    if (numStr.includes(',')) {
      console.log(`Parseando: "${numStr}" → ${parsed}`);
    }
    
    return isNaN(parsed) ? 0 : parsed;
  };

  // Función para normalizar categorías
  const normalizeCategory = (raw: string): string => {
    let c = (raw || '').trim();
    if (!c) return 'Sin categoría';
    
    // Remover comillas
    c = c.replace(/^["']|["']$/g, '');
    
    // Manejar N/A, guiones, etc.
    if (!c || /^(n\/a|na|n\.a\.?|-+|_+)$/i.test(c)) {
      return 'Sin categoría';
    }
    
    // Normalizar nombres conocidos
    if (/invertir.*para.*crecer/i.test(c)) return 'INVERTIR PARA CRECER';
    if (/seguridad/i.test(c)) return 'SEGURIDAD';
    if (/transparencia.*publica/i.test(c)) return 'TRANSPARENCIA PÚBLICA';
    if (/error/i.test(c)) return 'Error en procesamiento';
    if (/estrategia/i.test(c)) return 'Sin categoría';
    
    return c;
  };

  // Función para exportar sección como imagen
  const exportSectionAsImage = async (sectionId: string, filename: string) => {
    setIsExporting(true);
    try {
      const element = document.getElementById(sectionId);
      if (!element) {
        throw new Error('Sección no encontrada');
      }

      // Configuración básica para captura
      const canvas = await html2canvas(element);

      // Crear enlace de descarga
      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      // Mostrar mensaje de éxito
      alert('✅ Imagen exportada exitosamente');
      
    } catch (error) {
      console.error('Error al exportar imagen:', error);
      alert('❌ Error al exportar la imagen. Intenta nuevamente.');
    } finally {
      setIsExporting(false);
    }
  };

  // Filtrar datos para este perfil específico
  const perfilData = useMemo(() => {
    return rows.filter(row => 
      (row['Red'] || '').trim() === red && 
      (row['Perfil'] || '').trim() === perfil
    );
  }, [rows, red, perfil]);

  // Calcular datos globales de la RED para porcentajes (solo la red específica)
  const globalRedData = useMemo(() => {
    const categoryData: Record<string, {
      impresiones: number;
      alcance: number;
      meGusta: number;
      count: number;
    }> = {};

    // Filtrar solo los datos de la red específica
    const redRows = allRows.filter(row => (row['Red'] || '').trim() === red);

    redRows.forEach(row => {
      const rawCats = (row['categoria'] || '').trim();
      const categories = rawCats.split(',').map(normalizeCategory).filter(Boolean);
      if (categories.length === 0) categories.push('Sin categoría');

      const impresiones = parseNumber(row['Impresiones'] || '0');
      const alcance = parseNumber(row['Alcance'] || '0');
      const meGusta = parseNumber(row['Me gusta'] || '0');

      // Dividir las métricas proporcionalmente entre las categorías
      const impresionesPerCategory = impresiones / categories.length;
      const alcancePerCategory = alcance / categories.length;
      const meGustaPerCategory = meGusta / categories.length;

      categories.forEach(cat => {
        if (!categoryData[cat]) {
          categoryData[cat] = { impresiones: 0, alcance: 0, meGusta: 0, count: 0 };
        }
        categoryData[cat].impresiones += impresionesPerCategory;
        categoryData[cat].alcance += alcancePerCategory;
        categoryData[cat].meGusta += meGustaPerCategory;
        categoryData[cat].count += 1; // El count sí se suma completo por cada categoría
      });
    });

    return categoryData;
  }, [allRows, red]);

  // Agregar datos por categoría del perfil
  const aggregatedData = useMemo(() => {
    const categoryData: Record<string, {
      impresiones: number;
      alcance: number;
      meGusta: number;
      count: number;
    }> = {};

    perfilData.forEach(row => {
      const rawCats = (row['categoria'] || '').trim();
      const categories = rawCats.split(',').map(normalizeCategory).filter(Boolean);
      if (categories.length === 0) categories.push('Sin categoría');

      const impresiones = parseNumber(row['Impresiones'] || '0');
      const alcance = parseNumber(row['Alcance'] || '0');
      const meGusta = parseNumber(row['Me gusta'] || '0');

      // Dividir las métricas proporcionalmente entre las categorías
      const impresionesPerCategory = impresiones / categories.length;
      const alcancePerCategory = alcance / categories.length;
      const meGustaPerCategory = meGusta / categories.length;

      categories.forEach(cat => {
        if (!categoryData[cat]) {
          categoryData[cat] = { impresiones: 0, alcance: 0, meGusta: 0, count: 0 };
        }
        categoryData[cat].impresiones += impresionesPerCategory;
        categoryData[cat].alcance += alcancePerCategory;
        categoryData[cat].meGusta += meGustaPerCategory;
        categoryData[cat].count += 1; // El count sí se suma completo por cada categoría
      });
    });

    return categoryData;
  }, [perfilData]);

  // Datos por fecha para gráficas de línea
  const timeSeriesData = useMemo(() => {
    const dateData: Record<string, {
      date: string;
      impresiones: number;
      alcance: number;
      meGusta: number;
      publicaciones: number;
    }> = {};

    perfilData.forEach(row => {
      const dateStr = row['Fecha'];
      const date = parseCSVDate(dateStr);
      if (!date) return;

      const dateKey = formatDateKey(date);
      const rawCats = (row['categoria'] || '').trim();
      const categories = rawCats.split(',').map(normalizeCategory).filter(Boolean);
      if (categories.length === 0) categories.push('Sin categoría');

      const impresiones = parseNumber(row['Impresiones'] || '0');
      const alcance = parseNumber(row['Alcance'] || '0');
      const meGusta = parseNumber(row['Me gusta'] || '0');

      if (!dateData[dateKey]) {
        dateData[dateKey] = {
          date: dateKey,
          impresiones: 0,
          alcance: 0,
          meGusta: 0,
          publicaciones: 0
        };
      }

      dateData[dateKey].impresiones += impresiones;
      dateData[dateKey].alcance += alcance;
      dateData[dateKey].meGusta += meGusta;
      dateData[dateKey].publicaciones += 1;
    });

    return Object.values(dateData).sort((a, b) => a.date.localeCompare(b.date));
  }, [perfilData]);

  // Preparar datos para gráficas
  const chartData = useMemo(() => {
    return Object.entries(aggregatedData).map(([category, data]) => ({
      category,
      impresiones: data.impresiones,
      alcance: data.alcance,
      meGusta: data.meGusta,
      publicaciones: data.count,
      color: CATEGORY_COLOR[category] || '#8E8E93'
    })).sort((a, b) => b.impresiones - a.impresiones);
  }, [aggregatedData]);

  // Datos para gráfica de pie
  const pieData = useMemo(() => {
    return chartData.map(item => ({
      name: item.category,
      value: item.publicaciones,
      color: item.color
    }));
  }, [chartData]);

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          padding: '16px 20px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          fontSize: '14px',
          fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
          minWidth: '200px'
        }}>
          <p style={{ 
            margin: '0 0 8px 0', 
            fontWeight: '600', 
            color: '#1D1D1F',
            fontSize: '16px'
          }}>
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ 
              margin: '4px 0', 
              color: entry.color,
              fontSize: '14px',
              fontWeight: '500'
            }}>
              {entry.dataKey}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-main" style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          minHeight: '60vh'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(16px)',
            padding: '32px',
            borderRadius: '20px',
            textAlign: 'center',
            fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid #007AFF',
              borderTop: '3px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }}></div>
            <p style={{ color: '#1D1D1F', fontSize: '18px', fontWeight: '500' }}>
              Cargando datos del perfil...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <nav className="dashboard-nav">
          <div className="dashboard-brand">
            <button 
              onClick={() => router.back()}
              style={{
                background: 'var(--gradient-blue-dark)',
                border: 'none',
                borderRadius: '12px',
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              ←
            </button>
            <div>
              <h1 className="dashboard-title">Detalle del Perfil</h1>
              <p className="dashboard-subtitle">{perfil} • {red}</p>
            </div>
          </div>
        </nav>
      </header>

      <main className="dashboard-main">
        {/* Controles de filtros de fecha */}
        <section className="controls-section-minimal">
          <div className="controls-container">
            <div className="controls-header-minimal">
              <div className="header-left">
                <h2 className="controls-title-minimal">📅 Filtros de Fecha</h2>
                <span className="controls-subtitle">
                  {fechaInicio || fechaFin ? 
                    `Mostrando datos del ${fechaInicio || 'inicio'} al ${fechaFin || 'fin'}` :
                    'Mostrando todos los datos disponibles'
                  }
                </span>
              </div>
              <div className="header-right">
                <div className="status-indicators-compact">
                  <div className="status-badge info" title={`Publicaciones ${fechaInicio || fechaFin ? 'filtradas' : 'totales'}`}>
                    📊 {rows.filter(row => row['Red'] === red && row['Perfil'] === perfil).length.toLocaleString()}
                  </div>
                  {fechaMin && fechaMax && (
                    <div className="status-badge success" title={`Rango disponible: ${fechaMin} - ${fechaMax}`}>
                      📅 {fechaMin} → {fechaMax}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="controls-grid-minimal">
              <div className="form-group-minimal">
                <label className="form-label-minimal">Fecha inicio</label>
                <input 
                  type="date"
                  value={fechaInicio}
                  onChange={e => setFechaInicio(e.target.value)}
                  min={fechaMin}
                  max={fechaMax}
                  className="form-input-minimal"
                  disabled={!fechaMin}
                />
              </div>
              
              <div className="form-group-minimal">
                <label className="form-label-minimal">Fecha fin</label>
                <input 
                  type="date"
                  value={fechaFin}
                  onChange={e => setFechaFin(e.target.value)}
                  min={fechaMin}
                  max={fechaMax}
                  className="form-input-minimal"
                  disabled={!fechaMin}
                />
              </div>
              
              <div className="form-group-minimal">
                <label className="form-label-minimal">Acciones</label>
                <div className="button-group-minimal">
                  <button 
                    onClick={() => {
                      setFechaInicio('');
                      setFechaFin('');
                    }}
                    disabled={!fechaInicio && !fechaFin}
                    className="btn-secondary-minimal"
                    title="Limpiar filtros de fecha"
                  >
                    🗑️ Limpiar
                  </button>
                  <button 
                    onClick={() => {
                      setFechaInicio(fechaMin);
                      setFechaFin(fechaMax);
                    }}
                    disabled={!fechaMin || !fechaMax}
                    className="btn-primary-minimal"
                    title="Seleccionar todo el rango disponible"
                  >
                    📅 Todo el período
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Cards de impacto global por categoría - PRINCIPAL */}
        <section className="controls-section" id="efficiency-section">
          <div className="glass-card" style={{ position: 'relative' }}>
            <div className="controls-header">
              <div className="controls-icon">🎯</div>
              <h2 className="controls-title">
                Eficiencia por Categoría de{' '}
                <span style={{ 
                  color: '#007AFF',
                  background: 'linear-gradient(135deg, #007AFF 0%, #5AC8FA 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: '800'
                }}>
                  {perfil}
                </span>
                {' '}en {red}
              </h2>
              
              {/* Botón de exportación */}
              <button
                className={`export-button ${isExporting ? 'exporting' : ''}`}
                onClick={() => exportSectionAsImage('efficiency-section', `eficiencia-${perfil.toLowerCase().replace(/\s+/g, '-')}-${red.toLowerCase()}-${new Date().toISOString().split('T')[0]}.png`)}
                disabled={isExporting}
                title="Exportar como imagen"
              >
                {isExporting ? '⏳ Exportando...' : '📸 Exportar'}
              </button>
            </div>
            <div style={{
              background: 'rgba(0, 122, 255, 0.1)',
              borderRadius: '12px',
              padding: '16px',
              marginTop: '16px',
              border: '1px solid rgba(0, 122, 255, 0.2)'
            }}>
              <div style={{ fontSize: '14px', color: '#007AFF', fontWeight: '600', marginBottom: '8px' }}>
                💡 ¿Qué significa esto?
              </div>
              <div style={{ fontSize: '13px', color: '#1D1D1F', lineHeight: 1.5 }}>
                Estos porcentajes muestran <strong>qué tanto contribuye este perfil</strong> al rendimiento total 
                de cada categoría en <strong>{red}</strong>. Un porcentaje alto indica que este perfil es 
                <strong> muy eficiente</strong> generando impacto en esa temática específica.
              </div>
            </div>
            <div className="horizontal-scroll-wrapper">
              <div className="horizontal-scroll-container">
              {Object.entries(aggregatedData)
                .sort(([a], [b]) => {
                  // Usar el orden de ALL_CATEGORIES, con "Sin categoría" al final
                  const indexA = ALL_CATEGORIES.indexOf(a);
                  const indexB = ALL_CATEGORIES.indexOf(b);
                  
                  // Si ambos están en ALL_CATEGORIES, usar ese orden
                  if (indexA !== -1 && indexB !== -1) {
                    return indexA - indexB;
                  }
                  
                  // Si solo uno está en ALL_CATEGORIES, ese va primero
                  if (indexA !== -1) return -1;
                  if (indexB !== -1) return 1;
                  
                  // Si ninguno está en ALL_CATEGORIES, orden alfabético
                  return a.localeCompare(b);
                })
                .map(([category, data]) => {
                const globalCategoryData = globalRedData[category];
                if (!globalCategoryData) return null;

                const impresionesPercent = globalCategoryData.impresiones > 0 ? 
                  ((data.impresiones / globalCategoryData.impresiones) * 100).toFixed(1) : '0.0';
                const alcancePercent = globalCategoryData.alcance > 0 ? 
                  ((data.alcance / globalCategoryData.alcance) * 100).toFixed(1) : '0.0';
                const meGustaPercent = globalCategoryData.meGusta > 0 ? 
                  ((data.meGusta / globalCategoryData.meGusta) * 100).toFixed(1) : '0.0';

                return (
                  <div key={category} className="horizontal-card" style={{
                    background: `linear-gradient(135deg, 
                      rgba(255, 255, 255, 0.95) 0%, 
                      ${CATEGORY_COLOR[category] || '#8E8E93'}08 100%)`,
                    backdropFilter: 'blur(16px)',
                    borderRadius: '24px',
                    padding: '28px',
                    border: `3px solid ${CATEGORY_COLOR[category] || '#8E8E93'}25`,
                    boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {/* Header con categoría */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      marginBottom: '24px',
                      paddingBottom: '16px',
                      borderBottom: `2px solid ${CATEGORY_COLOR[category] || '#8E8E93'}15`
                    }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${CATEGORY_COLOR[category] || '#8E8E93'} 0%, ${CATEGORY_COLOR[category] || '#8E8E93'}80 100%)`,
                        boxShadow: `0 0 0 6px ${CATEGORY_COLOR[category] || '#8E8E93'}15, 0 4px 12px ${CATEGORY_COLOR[category] || '#8E8E93'}30`
                      }}></div>
                      <div>
                        <h3 style={{
                          margin: 0,
                          fontSize: '20px',
                          fontWeight: '700',
                          color: '#1D1D1F',
                          lineHeight: 1.2
                        }}>
                          {category}
                        </h3>
                        <p style={{
                          margin: '4px 0 0 0',
                          fontSize: '13px',
                          color: '#8E8E93',
                          fontWeight: '500'
                        }}>
                          Rendimiento en {red}
                        </p>
                      </div>
                    </div>

                    {/* Métricas con explicación clara */}
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '16px' 
                    }}>
                      {/* Impresiones */}
                      <div style={{ 
                        textAlign: 'center',
                        padding: '12px',
                        background: 'rgba(0, 122, 255, 0.05)',
                        borderRadius: '12px',
                        border: '1px solid rgba(0, 122, 255, 0.1)'
                      }}>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: '#007AFF', marginBottom: '4px' }}>
                          {data.impresiones.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '12px', color: '#8E8E93', fontWeight: '500', marginBottom: '12px' }}>
                          Impresiones del perfil
                        </div>
                        <div style={{
                          background: 'linear-gradient(135deg, #007AFF 0%, #5AC8FA 100%)',
                          color: 'white',
                          borderRadius: '12px',
                          padding: '6px 10px',
                          fontSize: '16px',
                          fontWeight: '700',
                          boxShadow: '0 4px 12px rgba(0, 122, 255, 0.3)'
                        }}>
                          {impresionesPercent}%
                        </div>
                        <div style={{ 
                          fontSize: '11px', 
                          color: '#007AFF', 
                          fontWeight: '600',
                          marginTop: '8px',
                          lineHeight: 1.3
                        }}>
                          de todas las impresiones<br/>de {category} en {red}
                        </div>
                      </div>

                      {/* Alcance */}
                      <div style={{ 
                        textAlign: 'center',
                        padding: '12px',
                        background: 'rgba(52, 199, 89, 0.05)',
                        borderRadius: '12px',
                        border: '1px solid rgba(52, 199, 89, 0.1)'
                      }}>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: '#34C759', marginBottom: '4px' }}>
                          {data.alcance.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '12px', color: '#8E8E93', fontWeight: '500', marginBottom: '12px' }}>
                          Alcance del perfil
                        </div>
                        <div style={{
                          background: 'linear-gradient(135deg, #34C759 0%, #32D74B 100%)',
                          color: 'white',
                          borderRadius: '12px',
                          padding: '6px 10px',
                          fontSize: '16px',
                          fontWeight: '700',
                          boxShadow: '0 4px 12px rgba(52, 199, 89, 0.3)'
                        }}>
                          {alcancePercent}%
                        </div>
                        <div style={{ 
                          fontSize: '11px', 
                          color: '#34C759', 
                          fontWeight: '600',
                          marginTop: '8px',
                          lineHeight: 1.3
                        }}>
                          del alcance total<br/>de {category} en {red}
                        </div>
                      </div>

                      {/* Me Gusta */}
                      <div style={{ 
                        textAlign: 'center',
                        padding: '12px',
                        background: 'rgba(255, 59, 48, 0.05)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 59, 48, 0.1)'
                      }}>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: '#FF3B30', marginBottom: '4px' }}>
                          {data.meGusta.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '12px', color: '#8E8E93', fontWeight: '500', marginBottom: '12px' }}>
                          Me gusta del perfil
                        </div>
                        <div style={{
                          background: 'linear-gradient(135deg, #FF3B30 0%, #FF6B35 100%)',
                          color: 'white',
                          borderRadius: '12px',
                          padding: '6px 10px',
                          fontSize: '16px',
                          fontWeight: '700',
                          boxShadow: '0 4px 12px rgba(255, 59, 48, 0.3)'
                        }}>
                          {meGustaPercent}%
                        </div>
                        <div style={{ 
                          fontSize: '11px', 
                          color: '#FF3B30', 
                          fontWeight: '600',
                          marginTop: '8px',
                          lineHeight: 1.3
                        }}>
                          de todos los me gusta<br/>de {category} en {red}
                        </div>
                      </div>
                    </div>

                    {/* Indicador de eficiencia */}
                    <div style={{
                      marginTop: '20px',
                      padding: '16px',
                      background: 'rgba(142, 142, 147, 0.05)',
                      borderRadius: '12px',
                      border: '1px solid rgba(142, 142, 147, 0.1)',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '13px', color: '#8E8E93', fontWeight: '500', marginBottom: '8px' }}>
                        💡 Insight de Eficiencia
                      </div>
                      <div style={{ fontSize: '14px', color: '#1D1D1F', fontWeight: '600', lineHeight: 1.4 }}>
                        Este perfil genera el <strong style={{ color: CATEGORY_COLOR[category] || '#8E8E93' }}>
                          {Math.max(parseFloat(impresionesPercent), parseFloat(alcancePercent), parseFloat(meGustaPercent)).toFixed(1)}%
                        </strong> del impacto total de <strong>{category}</strong> en {red}
                      </div>
                    </div>

                    {/* Decoración de fondo */}
                    <div style={{
                      position: 'absolute',
                      top: '-50px',
                      right: '-50px',
                      width: '100px',
                      height: '100px',
                      background: `radial-gradient(circle, ${CATEGORY_COLOR[category] || '#8E8E93'}15 0%, transparent 70%)`,
                      borderRadius: '50%',
                      zIndex: 0
                    }}></div>
                  </div>
                );
              })}
              </div>
            </div>
          </div>
        </section>

        {/* Métricas generales - SECUNDARIO */}
        <section className="controls-section">
          <div className="glass-card" style={{ opacity: 0.9 }}>
            <div className="controls-header">
              <div className="controls-icon">📊</div>
              <h2 className="controls-title">Resumen General</h2>
            </div>
            <div className="horizontal-scroll-container">
              <div className="horizontal-card-small" style={{
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(8px)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
                border: '1px solid rgba(0, 122, 255, 0.1)'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '600', color: '#007AFF', marginBottom: '4px' }}>
                  {chartData.reduce((sum, item) => sum + item.impresiones, 0).toLocaleString()}
                </div>
                <div style={{ color: '#8E8E93', fontSize: '12px', fontWeight: '500' }}>
                  Total Impresiones
                </div>
              </div>
              <div className="horizontal-card-small" style={{
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(8px)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
                border: '1px solid rgba(52, 199, 89, 0.1)'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '600', color: '#34C759', marginBottom: '4px' }}>
                  {chartData.reduce((sum, item) => sum + item.alcance, 0).toLocaleString()}
                </div>
                <div style={{ color: '#8E8E93', fontSize: '12px', fontWeight: '500' }}>
                  Total Alcance
                </div>
              </div>
              <div className="horizontal-card-small" style={{
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(8px)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
                border: '1px solid rgba(255, 59, 48, 0.1)'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '600', color: '#FF3B30', marginBottom: '4px' }}>
                  {chartData.reduce((sum, item) => sum + item.meGusta, 0).toLocaleString()}
                </div>
                <div style={{ color: '#8E8E93', fontSize: '12px', fontWeight: '500' }}>
                  Total Me Gusta
                </div>
              </div>
              <div className="horizontal-card-small" style={{
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(8px)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
                border: '1px solid rgba(142, 142, 147, 0.1)'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '600', color: '#8E8E93', marginBottom: '4px' }}>
                  {perfilData.length.toLocaleString()}
                </div>
                <div style={{ color: '#8E8E93', fontSize: '12px', fontWeight: '500' }}>
                  Total Publicaciones
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Gráficas */}
        <section className="charts-section">
          <div className="glass-card">
            <div className="charts-header">
              <div className="charts-icon">📈</div>
              <h2 className="charts-title">Métricas por Categoría</h2>
            </div>
            
            <div className="horizontal-scroll-container">
              {/* Gráfica de líneas - Impresiones por fecha */}
              <div className="chart-container horizontal-card-large">
                <h3 style={{
                  margin: '0 0 24px 0',
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#1D1D1F',
                  textAlign: 'center',
                  fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"
                }}>
                  📊 Impresiones Diarias
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(142, 142, 147, 0.2)" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12, fill: '#8E8E93' }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis tick={{ fontSize: 12, fill: '#8E8E93' }} />
                    <Tooltip 
                      content={<CustomTooltip />}
                      labelFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    />
                    <Line 
                      type="monotone"
                      dataKey="impresiones" 
                      stroke="#007AFF"
                      strokeWidth={3}
                      dot={{ fill: '#007AFF', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#007AFF', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Gráfica de líneas - Alcance por fecha */}
              <div className="chart-container horizontal-card-large">
                <h3 style={{
                  margin: '0 0 24px 0',
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#1D1D1F',
                  textAlign: 'center',
                  fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"
                }}>
                  🎯 Alcance Diario
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(142, 142, 147, 0.2)" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12, fill: '#8E8E93' }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis tick={{ fontSize: 12, fill: '#8E8E93' }} />
                    <Tooltip 
                      content={<CustomTooltip />}
                      labelFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    />
                    <Line 
                      type="monotone"
                      dataKey="alcance" 
                      stroke="#34C759"
                      strokeWidth={3}
                      dot={{ fill: '#34C759', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#34C759', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Gráfica de líneas - Me Gusta por fecha */}
              <div className="chart-container horizontal-card-large">
                <h3 style={{
                  margin: '0 0 24px 0',
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#1D1D1F',
                  textAlign: 'center',
                  fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"
                }}>
                  ❤️ Me Gusta Diarios
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(142, 142, 147, 0.2)" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12, fill: '#8E8E93' }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis tick={{ fontSize: 12, fill: '#8E8E93' }} />
                    <Tooltip 
                      content={<CustomTooltip />}
                      labelFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    />
                    <Line 
                      type="monotone"
                      dataKey="meGusta" 
                      stroke="#FF3B30"
                      strokeWidth={3}
                      dot={{ fill: '#FF3B30', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#FF3B30', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Gráfica de pie - Distribución de publicaciones */}
              <div className="chart-container horizontal-card-large">
                <h3 style={{
                  margin: '0 0 24px 0',
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#1D1D1F',
                  textAlign: 'center',
                  fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"
                }}>
                  📋 Distribución de Publicaciones
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <defs>
                      <filter id="shadow-detail" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="rgba(0,0,0,0.1)"/>
                      </filter>
                    </defs>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={30}
                      fill="#8884d8"
                      dataKey="value"
                      stroke="rgba(255, 255, 255, 0.8)"
                      strokeWidth={2}
                      filter="url(#shadow-detail)"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="dashboard-footer">
        <div className="footer-stats">
          <div className="footer-stat">
            <div className="footer-stat-value">{perfilData.length}</div>
            <div className="footer-stat-label">Publicaciones analizadas</div>
          </div>
          <div className="footer-stat">
            <div className="footer-stat-value">{Object.keys(aggregatedData).length}</div>
            <div className="footer-stat-label">Categorías</div>
          </div>
        </div>
        <div className="footer-info">
          <p>📊 Dashboard detallado para {perfil} en {red}</p>
        </div>
      </footer>
    </div>
  );
}
