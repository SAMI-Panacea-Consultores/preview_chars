'use client'

import { useEffect, useMemo, useRef, useState } from 'react';
import Papa from 'papaparse';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

type Row = Record<string, string>;

const CATEGORY_COLOR: Record<string, string> = {
  'Error en procesamiento': '#dc2626',
  'INVERTIR PARA CRECER': '#65a30d', 
  'SEGURIDAD': '#0891b2',
  'TRANSPARENCIA PÚBLICA': '#7c3aed',
  'Sin categoría': '#6b7280'
};

const ALL_CATEGORIES = [
  'Error en procesamiento',
  'INVERTIR PARA CRECER',
  'SEGURIDAD',
  'Sin categoría',
  'TRANSPARENCIA PÚBLICA'
];

type Aggregated = {
  porRedGlobal: Record<string, Record<string, number>>;
  perfilesPorRed: Record<string, Set<string>>;
  porPerfil: Record<string, Record<string, Record<string, number>>>; // red -> perfil -> categoria -> count
  totalPorRed: Record<string, number>;
  totalPorPerfil: Record<string, Record<string, number>>; // red -> perfil -> total posts
};

function aggregate(rows: Row[], redKey: string, perfilKey: string, catKey: string): Aggregated {
  const porRedGlobal: Aggregated['porRedGlobal'] = {};
  const perfilesPorRed: Aggregated['perfilesPorRed'] = {};
  const porPerfil: Aggregated['porPerfil'] = {};
  const totalPorRed: Aggregated['totalPorRed'] = {};
  const totalPorPerfil: Aggregated['totalPorPerfil'] = {};

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
    if (/^invertir para crecer$/i.test(c)) c = 'INVERTIR PARA CRECER';
    if (/^seguridad$/i.test(c)) c = 'SEGURIDAD';
    if (/^transparencia publica$/i.test(c)) c = 'TRANSPARENCIA PÚBLICA';
    if (/^error en procesamiento$/i.test(c)) c = 'Error en procesamiento';
    
    return c;
  }

  for (const r of rows) {
    const red = (r[redKey] || '').trim();
    const perfil = (r[perfilKey] || '').trim();
    const rawCats = (r[catKey] || '').trim();
    if (!red || !perfil) continue;

    // Totales por publicación (una por fila)
    totalPorRed[red] = (totalPorRed[red] || 0) + 1;
    totalPorPerfil[red] = totalPorPerfil[red] || {};
    totalPorPerfil[red][perfil] = (totalPorPerfil[red][perfil] || 0) + 1;

    // Registrar perfil en la red
    perfilesPorRed[red] = perfilesPorRed[red] || new Set();
    perfilesPorRed[red].add(perfil);

    // Contar por categoría: puede haber múltiples separadas por comas
    const tokens = rawCats ? rawCats.split(',') : [];
    const categories = tokens.length ? tokens : ['Sin categoría'];
    for (const token of categories) {
      const cat = normalizeCategory(token);
      if (!cat) continue;
      porRedGlobal[red] = porRedGlobal[red] || {};
      porRedGlobal[red][cat] = (porRedGlobal[red][cat] || 0) + 1;

      porPerfil[red] = porPerfil[red] || {};
      porPerfil[red][perfil] = porPerfil[red][perfil] || {};
      porPerfil[red][perfil][cat] = (porPerfil[red][perfil][cat] || 0) + 1;
    }
  }

  return { porRedGlobal, perfilesPorRed, porPerfil, totalPorRed, totalPorPerfil };
}

function toRechartsData(counts: Record<string, number>) {
  return Object.entries(counts).map(([name, value]) => ({
    name,
    value,
    color: CATEGORY_COLOR[name] || '#6b7280'
  }));
}

export default function Page() {
  const [rows, setRows] = useState<Row[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [redKey, setRedKey] = useState('Red');
  const [perfilKey, setPerfilKey] = useState('Perfil');
  const [catKey, setCatKey] = useState('categoria');
  const [modo, setModo] = useState<'global' | 'perfil' | 'mosaico'>('global');
  const [red, setRed] = useState('Facebook');
  const [perfil, setPerfil] = useState('');
  const [catOrder, setCatOrder] = useState('SEGURIDAD');
  const [dirOrder, setDirOrder] = useState<'asc' | 'desc'>('desc');
  const [isComparing, setIsComparing] = useState(false);
  const [redA, setRedA] = useState('Facebook');
  const [perfilA, setPerfilA] = useState('');
  const [redB, setRedB] = useState('Instagram');
  const [perfilB, setPerfilB] = useState('');
  
  // Estados para el filtro de fechas
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [fechaMin, setFechaMin] = useState('');
  const [fechaMax, setFechaMax] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Función para parsear fechas en formato M/D/YYYY H:MM am/pm
  function parseCSVDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    try {
      // Ejemplo: "8/5/2025 11:48 pm" -> Date
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  }

  // Función para convertir Date a string YYYY-MM-DD para inputs
  function dateToInputValue(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Filtrar filas por rango de fechas
  const filteredRows = useMemo(() => {
    if (!fechaInicio && !fechaFin) return rows;
    
    return rows.filter(row => {
      const fecha = parseCSVDate(row['Fecha'] || '');
      if (!fecha) return false;
      
      const fechaSolo = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
      
      if (fechaInicio) {
        const inicio = new Date(fechaInicio);
        if (fechaSolo < inicio) return false;
      }
      
      if (fechaFin) {
        const fin = new Date(fechaFin);
        if (fechaSolo > fin) return false;
      }
      
      return true;
    });
  }, [rows, fechaInicio, fechaFin]);

  const aggregated = useMemo(() => aggregate(filteredRows, redKey, perfilKey, catKey), [filteredRows, redKey, perfilKey, catKey]);

  useEffect(() => {
    // inicializa perfiles por defecto
    const perfiles = Array.from(aggregated.perfilesPorRed[red] || []);
    if (perfiles.length) setPerfil(prev => prev || perfiles[0]);
    const perfilesA = Array.from(aggregated.perfilesPorRed[redA] || []);
    if (perfilesA.length) setPerfilA(prev => prev || perfilesA[0]);
    const perfilesB = Array.from(aggregated.perfilesPorRed[redB] || []);
    if (perfilesB.length) setPerfilB(prev => prev || perfilesB[0]);
  }, [aggregated, red, redA, redB]);

  function handleCSV(file: File) {
    Papa.parse<Row>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: h => h.trim(),
      complete: (res) => {
        const data = (res.data || []).filter(Boolean);
        setRows(data);
        const cols = res.meta.fields || [];
        setHeaders(cols);
        
        // heurística leve para detectar columnas
        const redCandidate = cols.find(c => c.toLowerCase() === 'red') || redKey;
        const perfilCandidate = cols.find(c => c.toLowerCase().includes('perfil')) || perfilKey;
        const catCandidate = cols.find(c => c.toLowerCase().includes('categoria')) || catKey;
        setRedKey(redCandidate);
        setPerfilKey(perfilCandidate);
        setCatKey(catCandidate);
        
        // Calcular rango de fechas disponibles
        const fechas = data
          .map(row => parseCSVDate(row['Fecha'] || ''))
          .filter(Boolean) as Date[];
          
        if (fechas.length > 0) {
          const minFecha = new Date(Math.min(...fechas.map(f => f.getTime())));
          const maxFecha = new Date(Math.max(...fechas.map(f => f.getTime())));
          setFechaMin(dateToInputValue(minFecha));
          setFechaMax(dateToInputValue(maxFecha));
        }
      }
    });
  }

  function sortedPerfilesByCategory(currentRed: string, category: string, direction: 'asc' | 'desc') {
    const table = aggregated.porPerfil[currentRed] || {};
    const perfiles = Object.keys(table);
    return perfiles.sort((a, b) => {
      const av = table[a]?.[category] ?? 0;
      const bv = table[b]?.[category] ?? 0;
      return direction === 'asc' ? av - bv : bv - av;
    });
  }

  // Componente personalizado para el tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const total = payload[0]?.payload?.total || data.value;
      const percentage = total ? ((data.value / total) * 100).toFixed(1) : '0';
      
      return (
        <div style={{
          background: 'white',
          padding: '12px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          fontSize: '14px'
        }}>
          <p style={{ margin: '0 0 4px 0', fontWeight: '500', color: '#111827' }}>
            {data.name}
          </p>
          <p style={{ margin: 0, color: '#6b7280' }}>
            {data.value.toLocaleString()} publicaciones ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  // Componente personalizado para las etiquetas
  const renderCustomLabel = (entry: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, value, total } = entry;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
    const percentage = total ? ((value / total) * 100).toFixed(1) : '0';
    
    // Solo mostrar etiquetas para segmentos > 5%
    if (parseFloat(percentage) < 5) return null;
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="600"
        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
      >
        {percentage}%
      </text>
    );
  };

  function renderPieChart(counts: Record<string, number>, title?: string, totalDenominator?: number, isMosaic = false) {
    const data = toRechartsData(counts);
    const total = typeof totalDenominator === 'number' ? totalDenominator : data.reduce((a, b) => a + b.value, 0);
    
    // Agregar el total a cada entrada para el cálculo de porcentajes
    const dataWithTotal = data.map(item => ({ ...item, total }));
    
    if (isMosaic) {
      return (
        <div className="mosaic-chart-container">
          {/* Título alineado a la izquierda */}
          {title && (
            <h3 className="mosaic-title">
              {title}
            </h3>
          )}
          
          {/* Gráfico centrado y más grande */}
          <div className="mosaic-chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataWithTotal}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={85}
                  innerRadius={35}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="#ffffff"
                  strokeWidth={2}
                >
                  {dataWithTotal.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Leyenda horizontal debajo */}
          <div className="mosaic-legend">
            {dataWithTotal.map((entry, index) => (
              <div key={index} className="legend-item">
                <div 
                  className="legend-color" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="legend-text">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    // Configuración para modos normal (Global/Perfil/Comparar)
    return (
      <div className="chart-container">
        {title && (
          <h3 style={{
            margin: '0 0 1rem 0',
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#111827',
            textAlign: 'center',
            lineHeight: '1.2'
          }}>
            {title}
          </h3>
        )}
        <ResponsiveContainer width="100%" height="85%">
          <PieChart margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <Pie
              data={dataWithTotal}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={80}
              innerRadius={40}
              fill="#8884d8"
              dataKey="value"
              stroke="#ffffff"
              strokeWidth={2}
            >
              {dataWithTotal.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              iconType="circle"
              wrapperStyle={{
                paddingTop: '16px',
                fontSize: '12px',
                lineHeight: '1.4'
              }}
              layout="horizontal"
              align="center"
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  const globalCounts = useMemo(() => aggregated.porRedGlobal[red] || {}, [aggregated, red]);
  const globalTotal = useMemo(() => aggregated.totalPorRed?.[red] || 0, [aggregated, red]);
  const perfilesList = useMemo(() => Array.from(aggregated.perfilesPorRed[red] || []).sort(), [aggregated, red]);
  const perfilCounts = useMemo(() => aggregated.porPerfil[red]?.[perfil] || {}, [aggregated, red, perfil]);
  const perfilTotal = useMemo(() => aggregated.totalPorPerfil?.[red]?.[perfil] || 0, [aggregated, red, perfil]);

  return (
    <div>
      {/* Header moderno */}
      <header className="header">
        <div className="header-content">
          <div className="brand">
            <div className="logo">
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="brand-text">
              <h1>Análisis por Red Social</h1>
              <p>Visualiza indicadores por categoría desde tu CSV</p>
            </div>
          </div>
          <button 
            className={`compare-btn ${isComparing ? 'active' : ''}`}
            onClick={() => setIsComparing(v => !v)}
          >
            🔀 Comparar perfiles
          </button>
        </div>
      </header>

      <div className="container">
        {/* Panel de controles */}
        <div className="glass-card">
          <div className="controls-grid">
            <div className="form-group">
              <label className="form-label">Cargar CSV</label>
              <div className="file-input">
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  accept=".csv,text/csv"
                  id="file-upload"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) handleCSV(f);
                  }} 
                />
                <label htmlFor="file-upload" className={`file-input-label ${rows.length > 0 ? 'loaded' : ''}`}>
                  {rows.length > 0 ? `✅ ${rows.length.toLocaleString()} filas cargadas` : '📁 Seleccionar archivo CSV'}
                </label>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Fecha inicio</label>
              <input 
                type="date"
                value={fechaInicio}
                onChange={e => setFechaInicio(e.target.value)}
                min={fechaMin}
                max={fechaMax}
                className="form-input"
                disabled={!fechaMin}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Fecha fin</label>
              <input 
                type="date"
                value={fechaFin}
                onChange={e => setFechaFin(e.target.value)}
                min={fechaMin}
                max={fechaMax}
                className="form-input"
                disabled={!fechaMin}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Filtros</label>
              <button 
                onClick={() => {
                  setFechaInicio('');
                  setFechaFin('');
                }}
                disabled={!fechaInicio && !fechaFin}
                className="form-input"
                style={{
                  cursor: 'pointer',
                  backgroundColor: (!fechaInicio && !fechaFin) ? '#f3f4f6' : '#fee2e2',
                  color: (!fechaInicio && !fechaFin) ? '#9ca3af' : '#dc2626',
                  border: '1px solid #d1d5db',
                  textAlign: 'center'
                }}
              >
                🗑️ Limpiar fechas
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Modo de vista</label>
              <select 
                value={modo} 
                onChange={e => setModo(e.target.value as any)}
                className="form-select"
              >
                <option value="global">📊 Global</option>
                <option value="perfil">👤 Por perfil</option>
                <option value="mosaico">🎯 Mosaico</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Red social</label>
              <select 
                value={red} 
                onChange={e => setRed(e.target.value)}
                className="form-select"
              >
                {Object.keys(aggregated.porRedGlobal).map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {modo === 'perfil' && (
              <div className="form-group">
                <label className="form-label">Perfil</label>
                <select 
                  value={perfil} 
                  onChange={e => setPerfil(e.target.value)}
                  className="form-select"
                >
                  {perfilesList.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                Ordenar por <span style={{color: 'var(--gray-500)', fontSize: '0.75rem'}}>(mosaico)</span>
              </label>
              <select 
                value={catOrder} 
                onChange={e => setCatOrder(e.target.value)}
                className="form-select"
              >
                {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Dirección</label>
              <select 
                value={dirOrder} 
                onChange={e => setDirOrder(e.target.value as any)}
                className="form-select"
              >
                <option value="desc">↓ Mayor → menor</option>
                <option value="asc">↑ Menor → mayor</option>
              </select>
            </div>
          </div>

          {/* Panel de comparación */}
          <div className={`compare-panel ${isComparing ? 'open' : ''}`}>
            <div className="compare-panel-header">
              <h3>Comparar perfiles</h3>
              <span className="hint">Selecciona Red/Perfil A y B</span>
            </div>
            
            <div className="form-group">
              <label className="form-label">Red A</label>
              <select 
                value={redA} 
                onChange={e => setRedA(e.target.value)}
                className="form-select"
              >
                {Object.keys(aggregated.porRedGlobal).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Perfil A</label>
              <select 
                value={perfilA} 
                onChange={e => setPerfilA(e.target.value)}
                className="form-select"
              >
                {Array.from(aggregated.perfilesPorRed[redA] || []).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Red B</label>
              <select 
                value={redB} 
                onChange={e => setRedB(e.target.value)}
                className="form-select"
              >
                {Object.keys(aggregated.porRedGlobal).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Perfil B</label>
              <select 
                value={perfilB} 
                onChange={e => setPerfilB(e.target.value)}
                className="form-select"
              >
                {Array.from(aggregated.perfilesPorRed[redB] || []).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Área de gráficas */}
        <div className="glass-card">
          <div className={`charts-grid ${
            isComparing 
              ? 'double' 
              : modo === 'mosaico' 
                ? 'triple' 
                : 'single'
          }`}>
            {/* Global */}
            {!isComparing && modo === 'global' && renderPieChart(globalCounts, `📊 Global · ${red}`, globalTotal)}

            {/* Por perfil */}
            {!isComparing && modo === 'perfil' && renderPieChart(perfilCounts, `👤 ${perfil} · ${red}`, perfilTotal)}

            {/* Mosaico */}
            {!isComparing && modo === 'mosaico' && (
              (sortedPerfilesByCategory(red, catOrder, dirOrder)).map(p => {
                const counts = aggregated.porPerfil[red]?.[p] || {};
                const denom = aggregated.totalPorPerfil?.[red]?.[p] || 0;
                return <div key={p}>{renderPieChart(counts, p, denom, true)}</div>;
              })
            )}

            {/* Comparar */}
            {isComparing && (
              <>
                {renderPieChart(aggregated.porPerfil[redA]?.[perfilA] || {}, `🔵 ${perfilA} · ${redA}`, aggregated.totalPorPerfil?.[redA]?.[perfilA] || 0)}
                {renderPieChart(aggregated.porPerfil[redB]?.[perfilB] || {}, `🔴 ${perfilB} · ${redB}`, aggregated.totalPorPerfil?.[redB]?.[perfilB] || 0)}
              </>
            )}
          </div>
        </div>

        {/* Footer con información */}
        <div className="footer">
          <p>📄 Fuente: CSV cargado ({rows.length.toLocaleString()} filas{filteredRows.length !== rows.length ? `, ${filteredRows.length.toLocaleString()} filtradas` : ''})</p>
          <p>🔍 Columnas detectadas: Red={redKey}, Perfil={perfilKey}, Categoría={catKey}</p>
          {fechaMin && fechaMax && (
            <p>📅 Rango disponible: {fechaMin} a {fechaMax}</p>
          )}
          {(fechaInicio || fechaFin) && (
            <p>🎯 Filtro activo: {fechaInicio || 'inicio'} a {fechaFin || 'fin'}</p>
          )}
        </div>
      </div>
    </div>
  );
}


