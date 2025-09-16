'use client'

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import CSVUploader from '@/components/CSVUploader';
import CSVStatusBanner, { CSVStatusData } from '@/components/CSVStatusBanner';
import { usePublicaciones } from '@/hooks/usePublicaciones';

type Row = Record<string, string>;

// Colores Apple-inspired para las gráficas
const CATEGORY_COLOR: Record<string, string> = {
  'Error en procesamiento': '#FF3B30', // System Red
  'INVERTIR PARA CRECER': '#34C759', // System Green  
  'SEGURIDAD': '#007AFF', // System Blue
  'TRANSPARENCIA PÚBLICA': '#5856D6', // System Purple
  'Sin categoría': '#8E8E93' // System Gray
};

const ALL_CATEGORIES = [
  'Error en procesamiento',
  'INVERTIR PARA CRECER',
  'SEGURIDAD',
  'TRANSPARENCIA PÚBLICA',
  'Sin categoría'
];

type Aggregated = {
  porRedGlobal: Record<string, Record<string, number>>;
  perfilesPorRed: Record<string, Set<string>>;
  porPerfil: Record<string, Record<string, Record<string, number>>>; // red -> perfil -> categoria -> count
  totalPorRed: Record<string, number>;
  totalPorPerfil: Record<string, Record<string, number>>; // red -> perfil -> total posts
};

// Función para calcular impresiones por perfil y categoría
function calculateImpactByProfile(rows: Row[], redKey: string, perfilKey: string, catKey: string, parseNumber: (str: string) => number) {
  const profileImpact: Record<string, Record<string, Record<string, number>>> = {};

  function normalizeCategory(raw: string): string {
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
  }

  for (const r of rows) {
    const red = (r[redKey] || '').trim();
    const perfil = (r[perfilKey] || '').trim();
    const rawCats = (r[catKey] || '').trim();
    if (!red || !perfil) continue;

    const impresiones = parseNumber(r['Impresiones'] || '0');
    
    // Debug temporal
    if (rawCats.includes('INVERTIR') && impresiones > 0) {
      console.log('Debug INVERTIR:', {
        perfil: perfil,
        rawCats: rawCats,
        impresiones: impresiones,
        impressionsRaw: r['Impresiones']
      });
    }
    
    // Manejar múltiples categorías separadas por comas
    const categories = rawCats.split(',').map(normalizeCategory).filter(Boolean);
    if (categories.length === 0) categories.push('Sin categoría');

    // Dividir las impresiones proporcionalmente entre las categorías
    const impresionesPerCategory = impresiones / categories.length;
    
    for (const cat of categories) {
      if (!profileImpact[red]) profileImpact[red] = {};
      if (!profileImpact[red][perfil]) profileImpact[red][perfil] = {};
      if (!profileImpact[red][perfil][cat]) profileImpact[red][perfil][cat] = 0;
      
      profileImpact[red][perfil][cat] += impresionesPerCategory;
    }
  }

  return profileImpact;
}

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
    if (/invertir.*para.*crecer/i.test(c)) c = 'INVERTIR PARA CRECER';
    if (/seguridad/i.test(c)) c = 'SEGURIDAD';
    if (/transparencia.*publica/i.test(c)) c = 'TRANSPARENCIA PÚBLICA';
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
  const router = useRouter();
  
  // Función para parsear números con comas como separadores de miles
  const parseNumber = (numStr: string): number => {
    if (!numStr || numStr.trim() === '') return 0;
    // Remover comas y parsear como entero
    const cleaned = numStr.replace(/,/g, '');
    const parsed = parseInt(cleaned, 10);
    return isNaN(parsed) ? 0 : parsed;
  };

  const [rows, setRows] = useState<Row[]>([]);
  const [allRowsForCharts, setAllRowsForCharts] = useState<Row[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [csvLoaded, setCsvLoaded] = useState(false);
  const [redKey, setRedKey] = useState('Red');
  const [perfilKey, setPerfilKey] = useState('Perfil');
  const [catKey, setCatKey] = useState('categoria');
  const [modo, setModo] = useState<'global' | 'perfil' | 'mosaico'>('mosaico');
  const [red, setRed] = useState('Instagram');
  const [perfil, setPerfil] = useState('');
  const [catOrder, setCatOrder] = useState('SEGURIDAD');
  const [dirOrder, setDirOrder] = useState<'asc' | 'desc'>('desc');
  const [isComparing, setIsComparing] = useState(false);
  const [ordenarPorImpacto, setOrdenarPorImpacto] = useState(false);
  const [redA, setRedA] = useState('Instagram');
  const [perfilA, setPerfilA] = useState('');
  const [redB, setRedB] = useState('Facebook');
  const [perfilB, setPerfilB] = useState('');
  
  // Estados para el filtro de fechas
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  
  // Estados para debouncing de filtros (evitar múltiples llamadas)
  const [debouncedFechaInicio, setDebouncedFechaInicio] = useState('');
  const [debouncedFechaFin, setDebouncedFechaFin] = useState('');
  
  // Estado para filtro de tipos de publicación (por defecto excluir Historia)
  const [tiposPublicacionSeleccionados, setTiposPublicacionSeleccionados] = useState<string[]>([
    'Publicar', 'Reel', 'Video', 'Foto', 'Carrusel', 'Evento', 'Encuesta'
  ]);
  
  // Estado para el banner de estado CSV
  const [csvStatus, setCsvStatus] = useState<CSVStatusData | null>(null);

  // Hook para obtener datos de la base de datos
  const { 
    data: dbData, 
    loading: dbLoading, 
    error: dbError, 
    refetch: refetchData,
    fetchAllData,
    invalidateCache,
    stats,
    meta 
  } = usePublicaciones({
    // Solo usar filtros de fecha para la primera carga, después filtrar en cliente
    autoFetch: true
  });

  // Actualizar rows cuando cambien los datos de la base de datos
  useEffect(() => {
    if (dbData && dbData.length > 0) {
      setRows(dbData);
      setHeaders(Object.keys(dbData[0]));
      setCsvLoaded(true);
    }
  }, [dbData]);

  // Calcular rango de fechas disponibles usando TODOS los datos
  useEffect(() => {
    if (allRowsForCharts && allRowsForCharts.length > 0) {
      console.log('📅 Calculating date range from all data...');
      
      // Calcular rango de fechas disponibles usando todos los datos
      const fechas = allRowsForCharts
        .map(row => parseCSVDate(row['Fecha'] || '')) // Nota: API devuelve 'Fecha' con F mayúscula
        .filter(Boolean) as Date[];
        
      if (fechas.length > 0) {
        const minFecha = new Date(Math.min(...fechas.map(f => f.getTime())));
        const maxFecha = new Date(Math.max(...fechas.map(f => f.getTime())));
        const minStr = dateToInputValue(minFecha);
        const maxStr = dateToInputValue(maxFecha);
        
        console.log(`📅 Date range: ${minStr} to ${maxStr} (${fechas.length} records)`);
        
        setFechaMin(minStr);
        setFechaMax(maxStr);
      }
    }
  }, [allRowsForCharts]);

  // Cargar todos los datos para las gráficas (solo una vez al inicio)
  useEffect(() => {
    const loadAllDataForCharts = async () => {
      if (fetchAllData) {
        console.log('🔄 Loading all data for charts...');
        const allData = await fetchAllData();
        console.log(`📊 Loaded ${allData.length} records for charts`);
        setAllRowsForCharts(allData);
      }
    };

    // Solo cargar al inicio, no cuando cambian los filtros de fecha
    loadAllDataForCharts();
  }, [fetchAllData]); // Removido fechaInicio, fechaFin

  // Debouncing para filtros de fecha (evitar múltiples re-renders)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFechaInicio(fechaInicio);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [fechaInicio]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFechaFin(fechaFin);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [fechaFin]);

  // Función para guardar datos de forma segura en localStorage
  function safeSetItem(key: string, value: any): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error('LocalStorage quota exceeded. Data will not be persisted.');
        // Mostrar alerta al usuario
        alert('⚠️ Archivo muy grande\n\nLos datos se procesarán pero no se guardarán entre sesiones.\n\nSugerencia: Usa un archivo CSV más pequeño para mantener la persistencia.');
        return false;
      } else {
        console.error('Error saving to localStorage:', error);
        return false;
      }
    }
  }

  // Cargar datos del localStorage al iniciar
  useEffect(() => {
    const savedData = localStorage.getItem('csvData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setRows(parsedData);
        setHeaders(Object.keys(parsedData[0] || {}));
        setCsvLoaded(true);
      } catch (error) {
        console.error('Error cargando datos guardados:', error);
        localStorage.removeItem('csvData');
      }
    }
  }, []);
  const [fechaMin, setFechaMin] = useState('');
  const [fechaMax, setFechaMax] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Función para parsear fechas en formato M/D/YYYY H:MM am/pm
  function parseCSVDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    try {
      // Si viene en formato ISO (desde la BD), usar directamente
      if (dateStr.includes('T') && dateStr.includes('Z')) {
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? null : date;
      }
      
      // Si viene en formato M/D/YYYY H:MM am/pm (desde CSV)
      // Ejemplo: "8/2/2025 5:34 pm" (mes/día/año hora am/pm)
      const parts = dateStr.trim().split(' ');
      if (parts.length >= 1) {
        const datePart = parts[0]; // "8/2/2025"
        const timePart = parts.slice(1).join(' '); // "5:34 pm"
        
        const [month, day, year] = datePart.split('/').map(Number);
        
        if (month && day && year && month >= 1 && month <= 12 && day >= 1 && day <= 31 && year > 1900) {
          let date: Date;
          
          if (timePart) {
            // Con hora: crear fecha completa
            // Formato: "8/2/2025 5:34 pm"
            date = new Date(`${month}/${day}/${year} ${timePart}`);
          } else {
            // Solo fecha: crear a medianoche
            date = new Date(year, month - 1, day);
          }
          
          return isNaN(date.getTime()) ? null : date;
        }
      }
      
      // Fallback: intentar parseo directo
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



  // Filtrar filas por rango de fechas (para mostrar en tabla) - usando debounced values
  const filteredRows = useMemo(() => {
    if (!debouncedFechaInicio && !debouncedFechaFin) return rows;
    
    return rows.filter(row => {
      const fecha = parseCSVDate(row['Fecha'] || '');
      if (!fecha) return false;
      
      const fechaSolo = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
      
      if (debouncedFechaInicio) {
        const inicio = new Date(debouncedFechaInicio);
        if (fechaSolo < inicio) return false;
      }
      
      if (debouncedFechaFin) {
        const fin = new Date(debouncedFechaFin);
        if (fechaSolo > fin) return false;
      }
      
      return true;
    });
  }, [rows, debouncedFechaInicio, debouncedFechaFin]);

  // Filtrar TODOS los datos para las gráficas - usando debounced values y filtro de tipos de publicación
  const filteredAllRowsForCharts = useMemo(() => {
    return allRowsForCharts.filter(row => {
      // Filtro de tipos de publicación (siempre aplicado)
      const tipoPublicacion = row['Tipo de publicación'] || 'Publicar';
      if (!tiposPublicacionSeleccionados.includes(tipoPublicacion)) {
        return false;
      }
      
      // Filtro de fechas (solo si están definidas)
      if (debouncedFechaInicio || debouncedFechaFin) {
        const fecha = parseCSVDate(row['Fecha'] || '');
        if (!fecha) return false;
        
        const fechaSolo = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
        
        if (debouncedFechaInicio) {
          const inicio = new Date(debouncedFechaInicio);
          if (fechaSolo < inicio) return false;
        }
        
        if (debouncedFechaFin) {
          const fin = new Date(debouncedFechaFin);
          if (fechaSolo > fin) return false;
        }
      }
      
      return true;
    });
  }, [allRowsForCharts, debouncedFechaInicio, debouncedFechaFin, tiposPublicacionSeleccionados]);

  const aggregated = useMemo(() => aggregate(filteredAllRowsForCharts, redKey, perfilKey, catKey), [filteredAllRowsForCharts, redKey, perfilKey, catKey]);
  
  // Calcular impacto por perfil (impresiones)
  const profileImpact = useMemo(() => 
    calculateImpactByProfile(filteredAllRowsForCharts, redKey, perfilKey, catKey, parseNumber), 
    [filteredAllRowsForCharts, redKey, perfilKey, catKey]
  );

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
        setCsvLoaded(true);
        const cols = res.meta.fields || [];
        setHeaders(cols);
        
        // Guardar en localStorage para persistencia (de forma segura)
        safeSetItem('csvData', data);
        
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
    
    if (ordenarPorImpacto) {
      // Ordenar por impresiones (impacto) usando la categoría seleccionada en "Ordenar por"
      const sorted = perfiles.sort((a, b) => {
        const av = profileImpact[currentRed]?.[a]?.[category] || 0;
        const bv = profileImpact[currentRed]?.[b]?.[category] || 0;
        
        return direction === 'asc' ? av - bv : bv - av;
      });
      
      // Debug: mostrar ordenamiento por impacto
      console.log(`🚀 Ordenamiento por IMPACTO (${category}, ${direction}):`, 
        sorted.slice(0, 5).map(p => ({ 
          perfil: p, 
          impacto: profileImpact[currentRed]?.[p]?.[category] || 0 
        }))
      );
      
      return sorted;
    } else {
      // Ordenar por PORCENTAJE de la categoría en cada perfil (no por cantidad absoluta)
      const sorted = perfiles.sort((a, b) => {
        const publicacionesA = table[a]?.[category] ?? 0;
        const publicacionesB = table[b]?.[category] ?? 0;
        const totalA = aggregated.totalPorPerfil?.[currentRed]?.[a] || 0;
        const totalB = aggregated.totalPorPerfil?.[currentRed]?.[b] || 0;
        
        // Calcular porcentajes
        const porcentajeA = totalA > 0 ? (publicacionesA / totalA) * 100 : 0;
        const porcentajeB = totalB > 0 ? (publicacionesB / totalB) * 100 : 0;
        
        return direction === 'asc' ? porcentajeA - porcentajeB : porcentajeB - porcentajeA;
      });
      
      // Debug: mostrar ordenamiento por porcentaje
      console.log(`📊 Ordenamiento por PORCENTAJE (${category}, ${direction}):`, 
        sorted.slice(0, 5).map(p => {
          const publicaciones = table[p]?.[category] ?? 0;
          const total = aggregated.totalPorPerfil?.[currentRed]?.[p] || 0;
          const porcentaje = total > 0 ? ((publicaciones / total) * 100).toFixed(1) : '0';
          return { 
            perfil: p, 
            publicaciones,
            total,
            porcentaje: `${porcentaje}%`
          };
        })
      );
      
      return sorted;
    }
  }

  // Componente personalizado para el tooltip
  // Tooltip personalizado estilo Apple
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const total = payload[0]?.payload?.total || data.value;
      const percentage = total ? ((data.value / total) * 100).toFixed(1) : '0';
      
      return (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          padding: '16px 20px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          fontSize: '14px',
          fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
          minWidth: '200px'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '8px'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: data.color
            }}></div>
            <p style={{ 
              margin: 0, 
              fontWeight: '600', 
              color: '#1D1D1F',
              fontSize: '16px'
            }}>
              {data.name}
            </p>
          </div>
          <p style={{ 
            margin: 0, 
            color: '#8E8E93',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            {data.value.toLocaleString()} publicaciones
          </p>
          <p style={{ 
            margin: '4px 0 0 0', 
            color: '#007AFF',
            fontSize: '18px',
            fontWeight: '700'
          }}>
            {percentage}%
          </p>
        </div>
      );
    }
    return null;
  };

  // Etiquetas personalizadas estilo Apple (sin líneas para simplicidad)
  const renderCustomLabel = (entry: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, value, total } = entry;
    const radius = outerRadius + 25; // Más lejos del centro
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
    
    const percentage = total ? ((value / total) * 100).toFixed(1) : '0';
    
    // Solo mostrar etiquetas para segmentos > 5%
    if (parseFloat(percentage) < 5) return null;
    
    return (
      <g>
        {/* Etiqueta con fondo glassmorphism */}
        <rect
          x={x - 18}
          y={y - 10}
          width="36"
          height="20"
          rx="10"
          fill="rgba(255, 255, 255, 0.9)"
          stroke="rgba(0, 122, 255, 0.2)"
          strokeWidth="1"
          filter="drop-shadow(0 2px 8px rgba(0,0,0,0.1))"
        />
        <text 
          x={x} 
          y={y + 1}
          fill="#007AFF" 
          textAnchor="middle" 
          dominantBaseline="central"
          fontSize="11"
          fontWeight="700"
          fontFamily="'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"
        >
          {percentage}%
        </text>
      </g>
    );
  };

  function renderPieChart(counts: Record<string, number>, title?: string, totalDenominator?: number, isMosaic = false, perfilName?: string) {
    const data = toRechartsData(counts);
    const total = typeof totalDenominator === 'number' ? totalDenominator : data.reduce((a, b) => a + b.value, 0);
    
    // Agregar el total a cada entrada para el cálculo de porcentajes
    const dataWithTotal = data.map(item => ({ ...item, total }));
    
    if (isMosaic) {
      return (
        <div className="mosaic-chart-container">
          {/* Título alineado a la izquierda - clickeable */}
          {title && (
            <h3 
              className="mosaic-title"
              onClick={() => {
                if (isMosaic && perfilName) {
                  // Guardar datos en localStorage para la página de detalle (de forma segura)
                  safeSetItem('csvData', rows);
                  // Navegar a la página de detalle
                  router.push(`/perfil/${encodeURIComponent(red)}/${encodeURIComponent(perfilName)}`);
                }
              }}
              style={{
                cursor: isMosaic && perfilName ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                ...(isMosaic && perfilName ? {
                  ':hover': {
                    color: '#007AFF',
                    transform: 'translateY(-1px)'
                  }
                } : {})
              }}
              onMouseEnter={(e) => {
                if (isMosaic && perfilName) {
                  e.currentTarget.style.color = '#007AFF';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (isMosaic && perfilName) {
                  e.currentTarget.style.color = '#1D1D1F';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {title} {isMosaic && perfilName && <span style={{ fontSize: '14px', opacity: 0.6 }}>→</span>}
            </h3>
          )}
          
          {/* Gráfico centrado y más grande */}
          <div className="mosaic-chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  <filter id="shadow-mosaic" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="rgba(0,0,0,0.1)"/>
                  </filter>
                </defs>
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
                  stroke="rgba(255, 255, 255, 0.8)"
                  strokeWidth={3}
                  filter="url(#shadow-mosaic)"
                  animationBegin={0}
                  animationDuration={800}
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
            margin: '0 0 1.5rem 0',
            fontSize: '20px',
            fontWeight: '700',
            color: '#1D1D1F',
            textAlign: 'center',
            lineHeight: '1.2',
            fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"
          }}>
            {title}
          </h3>
        )}
        <ResponsiveContainer width="100%" height="85%">
          <PieChart>
            <defs>
              <filter id="shadow-large" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="rgba(0,0,0,0.15)"/>
              </filter>
            </defs>
            <Pie
              data={dataWithTotal}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={90}
              innerRadius={35}
              fill="#8884d8"
              dataKey="value"
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth={3}
              filter="url(#shadow-large)"
              animationBegin={0}
              animationDuration={1200}
            >
              {dataWithTotal.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Leyenda personalizada estilo Apple */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '12px',
          marginTop: '20px',
          padding: '16px',
          background: 'rgba(255, 255, 255, 0.6)',
          borderRadius: '12px',
          backdropFilter: 'blur(8px)'
        }}>
          {dataWithTotal.map((entry, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              background: 'rgba(255, 255, 255, 0.8)',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '500',
              color: '#1D1D1F',
              border: `1px solid ${entry.color}30`,
              fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: entry.color,
                boxShadow: `0 0 0 2px ${entry.color}20`
              }}></div>
              <span>{entry.name}</span>
              <span style={{ 
                color: '#8E8E93', 
                fontSize: '12px',
                fontWeight: '400'
              }}>
                ({((entry.value / total) * 100).toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const globalCounts = useMemo(() => aggregated.porRedGlobal[red] || {}, [aggregated, red]);
  const globalTotal = useMemo(() => aggregated.totalPorRed?.[red] || 0, [aggregated, red]);
  const perfilesList = useMemo(() => Array.from(aggregated.perfilesPorRed[red] || []).sort(), [aggregated, red]);
  const perfilCounts = useMemo(() => aggregated.porPerfil[red]?.[perfil] || {}, [aggregated, red, perfil]);
  const perfilTotal = useMemo(() => aggregated.totalPorPerfil?.[red]?.[perfil] || 0, [aggregated, red, perfil]);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <nav className="dashboard-nav">
          <div className="dashboard-brand">
            <div className="dashboard-logo">📊</div>
            <div>
              <h1 className="dashboard-title">Analytics Dashboard</h1>
              <p className="dashboard-subtitle">Análisis de publicaciones por categoría</p>
            </div>
          </div>
          <div className="dashboard-actions">
            {/* CSVUploader compacto */}
            <div className="csv-uploader-compact">
              <CSVUploader
                compact={true}
                onUploadSuccess={async (result) => {
                  console.log('Upload success:', result);
                  // Invalidar caché para forzar recarga de datos frescos
                  invalidateCache();
                  refetchData();
                  // Recargar también todos los datos para las gráficas
                  const allData = await fetchAllData();
                  setAllRowsForCharts(allData);
                  // El banner ya muestra el éxito, no necesitamos alert
                }}
                onUploadError={(error) => {
                  console.error('Upload error:', error);
                  // El banner ya muestra el error, no necesitamos alert
                }}
                onStatusChange={(status) => {
                  setCsvStatus(status);
                }}
              />
            </div>
            
            {/* Botón comparar */}
            <button 
              className={`compare-btn ${isComparing ? 'active' : ''}`}
              onClick={() => setIsComparing(!isComparing)}
            >
              {isComparing ? '✕' : '⚖️'} {isComparing ? 'Cancelar' : 'Comparar'}
            </button>
          </div>
        </nav>
      </header>

      <main className="dashboard-main">

        {/* Barra de control compacta */}
        <section className="control-bar">
          <div className="control-bar-container">
            {/* Header con título y stats */}
            <div className="control-bar-header">
              <div className="control-title-section">
                <h2 className="control-title">⚙️ Configuración</h2>
                <div className="control-stats">
                  {dbLoading && <div className="status-chip loading">⏳ Cargando</div>}
                  {dbError && <div className="status-chip error">❌ Error</div>}
                  {stats && (
                    <>
                      <div className="status-chip success">
                        📊 {stats.totalPublicaciones.toLocaleString()} registros
                      </div>
                      <div className="status-chip info">
                        📱 {stats.redes.length} {stats.redes.length === 1 ? 'red' : 'redes'}
                      </div>
                      <div className="status-chip info">
                        👤 {stats.perfiles.length} {stats.perfiles.length === 1 ? 'perfil' : 'perfiles'}
                      </div>
                      <div className="status-chip info">
                        🏷️ {stats.categorias.length} {stats.categorias.length === 1 ? 'categoría' : 'categorías'}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="control-description">
                {modo === 'mosaico' ? 
                  `Vista mosaico • ${red} • ${ordenarPorImpacto ? 'Por impacto' : 'Por publicaciones'}` :
                  `Vista ${modo} • ${red}`
                }
              </div>
            </div>

            {/* Controles principales en línea */}
            <div className="control-bar-main">
              {/* Fechas */}
              <div className="control-group-inline">
                <label className="control-label-inline">📅</label>
                <div className="date-controls-inline">
                  <input 
                    type="date"
                    value={fechaInicio}
                    onChange={e => setFechaInicio(e.target.value)}
                    min={fechaMin}
                    max={fechaMax}
                    className="date-input-compact"
                    disabled={!fechaMin}
                    title="Fecha inicio"
                  />
                  <span className="date-sep">→</span>
                  <input 
                    type="date"
                    value={fechaFin}
                    onChange={e => setFechaFin(e.target.value)}
                    min={fechaMin}
                    max={fechaMax}
                    className="date-input-compact"
                    disabled={!fechaMin}
                    title="Fecha fin"
                  />
                  {(fechaInicio || fechaFin) && (
                    <button 
                      onClick={() => {
                        setFechaInicio('');
                        setFechaFin('');
                      }}
                      className="clear-btn-compact"
                      title="Limpiar fechas"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Vista y Red */}
              <div className="control-group-inline">
                <label className="control-label-inline">🎯</label>
                <select 
                  value={modo} 
                  onChange={e => setModo(e.target.value as any)}
                  className="select-compact"
                  title="Tipo de vista"
                >
                  <option value="global">📊 Global</option>
                  <option value="perfil">👤 Perfil</option>
                  <option value="mosaico">🎯 Mosaico</option>
                </select>
              </div>

              <div className="control-group-inline">
                <label className="control-label-inline">📱</label>
                <select 
                  value={red} 
                  onChange={e => setRed(e.target.value)}
                  className="select-compact"
                  title="Red social"
                >
                  {Object.keys(aggregated.porRedGlobal).map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Filtro de tipos de publicación */}
              <div className="control-group-inline">
                <label className="control-label-inline">📄</label>
                <select 
                  multiple
                  value={tiposPublicacionSeleccionados}
                  onChange={(e) => {
                    const selectedValues = Array.from(e.target.selectedOptions, option => option.value);
                    setTiposPublicacionSeleccionados(selectedValues);
                  }}
                  className="select-compact multi-select"
                  title="Tipos de publicación (mantén Ctrl/Cmd para seleccionar múltiples)"
                  style={{ minWidth: '140px' }}
                >
                  <option value="Publicar">Publicar</option>
                  <option value="Historia">Historia</option>
                  <option value="Reel">Reel</option>
                  <option value="Video">Video</option>
                  <option value="Foto">Foto</option>
                  <option value="Carrusel">Carrusel</option>
                  <option value="Evento">Evento</option>
                  <option value="Encuesta">Encuesta</option>
                </select>
              </div>

              {/* Perfil (solo en modo perfil) */}
              {modo === 'perfil' && (
                <div className="control-group-inline">
                  <label className="control-label-inline">👤</label>
                  <select 
                    value={perfil} 
                    onChange={e => setPerfil(e.target.value)}
                    className="select-compact select-wide"
                    title="Perfil específico"
                  >
                    <option value="">Seleccionar...</option>
                    {Array.from(aggregated.perfilesPorRed[red] || []).map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Toggle impacto (solo en mosaico) */}
              {modo === 'mosaico' && (
                <div className="control-group-inline">
                  <label className="control-label-inline">🚀</label>
                  <div className="toggle-compact-with-text">
                    <input 
                      type="checkbox" 
                      id="impact-toggle"
                      checked={ordenarPorImpacto}
                      onChange={e => setOrdenarPorImpacto(e.target.checked)}
                      className="toggle-input-compact"
                    />
                    <label htmlFor="impact-toggle" className="toggle-slider-with-text">
                      <span className="toggle-icon">{ordenarPorImpacto ? '🚀' : '📊'}</span>
                      <span className="toggle-text">
                        {ordenarPorImpacto ? 'Por impacto' : 'Por porcentaje'}
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Ordenamiento (solo en mosaico) */}
              {modo === 'mosaico' && (
                <>
                  <div className="control-group-inline">
                    <label className="control-label-inline">📊</label>
                    <select 
                      value={catOrder} 
                      onChange={e => setCatOrder(e.target.value)}
                      className="select-compact"
                      title="Categoría de ordenamiento"
                    >
                      {ALL_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat.substring(0, 15)}{cat.length > 15 ? '...' : ''}</option>
                      ))}
                    </select>
                  </div>

                  <div className="control-group-inline">
                    <label className="control-label-inline">↕️</label>
                    <select 
                      value={dirOrder} 
                      onChange={e => setDirOrder(e.target.value as any)}
                      className="select-compact"
                      title="Dirección de ordenamiento"
                    >
                      <option value="desc">↓ Mayor</option>
                      <option value="asc">↑ Menor</option>
                    </select>
                  </div>
                </>
              )}

              {/* Botón comparar */}
              <div className="control-group-inline">
                <button 
                  onClick={() => setIsComparing(!isComparing)}
                  className={`compare-btn-with-text ${isComparing ? 'active' : ''}`}
                  title={isComparing ? 'Cancelar comparación' : 'Comparar perfiles'}
                >
                  <span className="btn-icon">{isComparing ? '✕' : '⚖️'}</span>
                  <span className="btn-text">{isComparing ? 'Cancelar' : 'Comparar'}</span>
                </button>
              </div>
            </div>

            {/* Panel de comparación expandible */}
            {isComparing && (
              <div className="comparison-panel">
                <div className="comparison-controls">
                  <div className="comparison-side">
                    <label className="comparison-label-compact">🔵 A</label>
                    <select 
                      value={redA} 
                      onChange={e => setRedA(e.target.value)}
                      className="select-compact"
                    >
                      {Object.keys(aggregated.porRedGlobal).map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <select 
                      value={perfilA} 
                      onChange={e => setPerfilA(e.target.value)}
                      className="select-compact select-wide"
                    >
                      <option value="">Perfil...</option>
                      {Array.from(aggregated.perfilesPorRed[redA] || []).map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="comparison-vs">VS</div>
                  
                  <div className="comparison-side">
                    <label className="comparison-label-compact">🔴 B</label>
                    <select 
                      value={redB} 
                      onChange={e => setRedB(e.target.value)}
                      className="select-compact"
                    >
                      {Object.keys(aggregated.porRedGlobal).map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <select 
                      value={perfilB} 
                      onChange={e => setPerfilB(e.target.value)}
                      className="select-compact select-wide"
                    >
                      <option value="">Perfil...</option>
                      {Array.from(aggregated.perfilesPorRed[redB] || []).map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>



        {/* Área de gráficas */}
        <section className="charts-section">
          <div className="glass-card">
            <div className="charts-header">
              <div className="charts-icon">📈</div>
              <h2 className="charts-title">Visualizaciones</h2>
            </div>
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
                
                // Calcular publicaciones filtradas por fecha para este perfil
                const publicacionesFiltradas = filteredAllRowsForCharts.filter(row => 
                  (row['Red'] || '').trim() === red && 
                  (row['Perfil'] || '').trim() === p
                ).length;
                
                // Título con contador de publicaciones filtradas e indicador de impacto
                let titulo = `📊 ${publicacionesFiltradas} • ${p}`;
                if (ordenarPorImpacto) {
                  const impacto = profileImpact[red]?.[p]?.[catOrder] || 0;
                  titulo = `📊 ${publicacionesFiltradas} • ${p} • ${impacto.toLocaleString()} imp.`;
                }
                
                return <div key={p}>{renderPieChart(counts, titulo, denom, true, p)}</div>;
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
        </section>
      </main>

      {/* Footer con información */}
      <footer className="dashboard-footer">
        <div className="footer-stats">
          <div className="footer-stat">
            <div className="footer-stat-value">{(meta?.total || rows.length).toLocaleString()}</div>
            <div className="footer-stat-label">Total filas</div>
          </div>
          {filteredRows.length !== rows.length && (
            <div className="footer-stat">
              <div className="footer-stat-value">{filteredRows.length.toLocaleString()}</div>
              <div className="footer-stat-label">Filtradas</div>
            </div>
          )}
          <div className="footer-stat">
            <div className="footer-stat-value">{Object.keys(aggregated.porRedGlobal).length}</div>
            <div className="footer-stat-label">Redes</div>
          </div>
        </div>
        <div className="footer-info">
          <p>🔍 Columnas: Red={redKey}, Perfil={perfilKey}, Categoría={catKey}</p>
          {fechaMin && fechaMax && (
            <p>📅 Rango disponible: {fechaMin} a {fechaMax}</p>
          )}
          {(fechaInicio || fechaFin) && (
            <p>🎯 Filtro activo: {fechaInicio || 'inicio'} a {fechaFin || 'fin'}</p>
          )}
        </div>
      </footer>

      {/* Banner flotante de estado CSV */}
      <CSVStatusBanner 
        data={csvStatus} 
        onClose={() => setCsvStatus(null)} 
      />
    </div>
  );
}


