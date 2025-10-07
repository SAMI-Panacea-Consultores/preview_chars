'use client'

import { useState, useEffect, useMemo } from 'react';
import TradingViewChart, { convertPublicationsToChartData, createSampleData } from '@/components/TradingViewChart';
import TradingViewPieChart, { convertCategoriesToPieData } from '@/components/TradingViewPieChart';
import { usePublicaciones } from '@/hooks/usePublicaciones';

export default function ChartsTestPage() {
  const [selectedRed, setSelectedRed] = useState<string>('Instagram');
  const [selectedPerfil, setSelectedPerfil] = useState<string>('');
  const [selectedMetric, setSelectedMetric] = useState<'Impresiones' | 'Alcance' | 'Me gusta'>('Impresiones');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });

  // Hook para obtener datos de la base de datos
  const { 
    data: dbData, 
    loading: dbLoading, 
    error: dbError,
    fetchAllData,
    stats 
  } = usePublicaciones({
    autoFetch: true
  });

  const [allData, setAllData] = useState<any[]>([]);

  // Cargar todos los datos al inicio
  useEffect(() => {
    const loadAllData = async () => {
      if (fetchAllData) {
        try {
          const data = await fetchAllData();
          setAllData(data);
          console.log(`📊 Loaded ${data.length} records for charts`);
          
          // Configurar valores por defecto
          if (data.length > 0) {
            // Encontrar el primer perfil disponible para la red seleccionada
            const perfilesDisponibles = [...new Set(
              data
                .filter(item => item.Red === selectedRed)
                .map(item => item.Perfil)
            )];
            
            if (perfilesDisponibles.length > 0 && !selectedPerfil) {
              setSelectedPerfil(perfilesDisponibles[0]);
            }

            // Configurar rango de fechas por defecto (último mes)
            const fechas = data
              .map(item => new Date(item.Fecha))
              .filter(date => !isNaN(date.getTime()))
              .sort((a, b) => a.getTime() - b.getTime());

            if (fechas.length > 0 && !dateRange.start) {
              const endDate = fechas[fechas.length - 1];
              const startDate = new Date(endDate);
              startDate.setMonth(startDate.getMonth() - 1);
              
              setDateRange({
                start: startDate.toISOString().split('T')[0],
                end: endDate.toISOString().split('T')[0]
              });
            }
          }
        } catch (error) {
          console.error('Error loading all data:', error);
        }
      }
    };

    loadAllData();
  }, [fetchAllData, selectedRed, selectedPerfil, dateRange.start]);

  // Filtrar datos según selecciones
  const filteredData = useMemo(() => {
    if (!allData || allData.length === 0) return [];

    return allData.filter(item => {
      // Filtro por red
      if (selectedRed && item.Red !== selectedRed) return false;
      
      // Filtro por perfil
      if (selectedPerfil && item.Perfil !== selectedPerfil) return false;
      
      // Filtro por rango de fechas
      if (dateRange.start || dateRange.end) {
        const itemDate = new Date(item.Fecha);
        if (isNaN(itemDate.getTime())) return false;
        
        if (dateRange.start) {
          const startDate = new Date(dateRange.start);
          if (itemDate < startDate) return false;
        }
        
        if (dateRange.end) {
          const endDate = new Date(dateRange.end);
          endDate.setHours(23, 59, 59, 999); // Incluir todo el día final
          if (itemDate > endDate) return false;
        }
      }
      
      return true;
    });
  }, [allData, selectedRed, selectedPerfil, dateRange]);

  // Convertir datos para las gráficas
  const chartData = useMemo(() => {
    return convertPublicationsToChartData(filteredData, 'Fecha', selectedMetric);
  }, [filteredData, selectedMetric]);

  // Datos para la gráfica de torta (categorías)
  const pieChartData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];

    // Colores como en el home
    const categoryColors = {
      'Error en procesamiento': '#FF3B30', // System Red
      'INVERTIR PARA CRECER': '#34C759', // System Green  
      'SEGURIDAD': '#007AFF', // System Blue
      'TRANSPARENCIA PÚBLICA': '#5856D6', // System Purple
      'Sin categoría': '#8E8E93' // System Gray
    };

    // Función para normalizar categorías (similar al home)
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

    // Contar por categorías
    const categoryCounts: Record<string, number> = {};
    
    filteredData.forEach(item => {
      const rawCategory = item['categoria'] || item['Categoria'] || '';
      const category = normalizeCategory(rawCategory);
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    return convertCategoriesToPieData(categoryCounts, categoryColors);
  }, [filteredData]);

  // Obtener listas únicas para los selectores
  const redesDisponibles = useMemo(() => {
    return [...new Set(allData.map(item => item.Red))].sort();
  }, [allData]);

  const perfilesDisponibles = useMemo(() => {
    return [...new Set(
      allData
        .filter(item => item.Red === selectedRed)
        .map(item => item.Perfil)
    )].sort();
  }, [allData, selectedRed]);

  // Actualizar perfil cuando cambie la red
  useEffect(() => {
    if (perfilesDisponibles.length > 0 && !perfilesDisponibles.includes(selectedPerfil)) {
      setSelectedPerfil(perfilesDisponibles[0]);
    }
  }, [perfilesDisponibles, selectedPerfil]);

  // Datos de ejemplo para demostración
  const sampleData = createSampleData(30);

  return (
    <div className="charts-test-page" style={{
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto',
      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '32px',
        textAlign: 'center',
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#1D1D1F',
          margin: '0 0 8px 0',
        }}>
          📈 Prueba de TradingView Charts
        </h1>
        <p style={{
          fontSize: '18px',
          color: '#8E8E93',
          margin: 0,
        }}>
          Visualización avanzada de datos con gráficas financieras
        </p>
      </div>

      {/* Estado de carga */}
      {dbLoading && (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#F2F2F7',
          borderRadius: '12px',
          marginBottom: '20px',
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
          <div style={{ color: '#8E8E93' }}>Cargando datos...</div>
        </div>
      )}

      {/* Error */}
      {dbError && (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#FFEBEE',
          borderRadius: '12px',
          marginBottom: '20px',
          border: '1px solid #FFCDD2',
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>❌</div>
          <div style={{ color: '#D32F2F' }}>Error: {dbError}</div>
        </div>
      )}

      {/* Controles */}
      <div style={{
        backgroundColor: '#FFFFFF',
        padding: '24px',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        marginBottom: '24px',
        border: '1px solid rgba(0, 0, 0, 0.05)',
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#1D1D1F',
          margin: '0 0 16px 0',
        }}>
          ⚙️ Configuración
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}>
          {/* Red Social */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#1D1D1F',
              marginBottom: '6px',
            }}>
              📱 Red Social
            </label>
            <select
              value={selectedRed}
              onChange={(e) => setSelectedRed(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #D1D1D6',
                fontSize: '14px',
                backgroundColor: '#FFFFFF',
              }}
            >
              {redesDisponibles.map(red => (
                <option key={red} value={red}>{red}</option>
              ))}
            </select>
          </div>

          {/* Perfil */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#1D1D1F',
              marginBottom: '6px',
            }}>
              👤 Perfil
            </label>
            <select
              value={selectedPerfil}
              onChange={(e) => setSelectedPerfil(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #D1D1D6',
                fontSize: '14px',
                backgroundColor: '#FFFFFF',
              }}
            >
              <option value="">Todos los perfiles</option>
              {perfilesDisponibles.map(perfil => (
                <option key={perfil} value={perfil}>{perfil}</option>
              ))}
            </select>
          </div>

          {/* Métrica */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#1D1D1F',
              marginBottom: '6px',
            }}>
              📊 Métrica
            </label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as any)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #D1D1D6',
                fontSize: '14px',
                backgroundColor: '#FFFFFF',
              }}
            >
              <option value="Impresiones">Impresiones</option>
              <option value="Alcance">Alcance</option>
              <option value="Me gusta">Me gusta</option>
            </select>
          </div>

          {/* Fecha Inicio */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#1D1D1F',
              marginBottom: '6px',
            }}>
              📅 Fecha Inicio
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #D1D1D6',
                fontSize: '14px',
                backgroundColor: '#FFFFFF',
              }}
            />
          </div>

          {/* Fecha Fin */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#1D1D1F',
              marginBottom: '6px',
            }}>
              📅 Fecha Fin
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #D1D1D6',
                fontSize: '14px',
                backgroundColor: '#FFFFFF',
              }}
            />
          </div>
        </div>

        {/* Estadísticas */}
        {stats && (
          <div style={{
            marginTop: '16px',
            padding: '16px',
            backgroundColor: '#F2F2F7',
            borderRadius: '8px',
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
          }}>
            <div style={{ fontSize: '14px', color: '#8E8E93' }}>
              📊 <strong>{stats.totalPublicaciones.toLocaleString()}</strong> registros totales
            </div>
            <div style={{ fontSize: '14px', color: '#8E8E93' }}>
              📈 <strong>{filteredData.length.toLocaleString()}</strong> registros filtrados
            </div>
            <div style={{ fontSize: '14px', color: '#8E8E93' }}>
              📍 <strong>{chartData.length}</strong> puntos en gráfica
            </div>
          </div>
        )}
      </div>

      {/* Gráficas */}
      <div style={{
        display: 'grid',
        gap: '24px',
        gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
      }}>
        {/* Gráfica de área con datos reales */}
        <div>
          <TradingViewChart
            data={chartData}
            title={`${selectedMetric} - ${selectedRed}${selectedPerfil ? ` - ${selectedPerfil}` : ''}`}
            height={400}
            lineColor="#007AFF"
            backgroundColor="#FFFFFF"
            textColor="#1D1D1F"
            gridColor="#F2F2F7"
          />
        </div>

        {/* Gráfica de torta con categorías */}
        <div>
          <TradingViewPieChart
            data={pieChartData}
            title={`Distribución por Categorías - ${selectedRed}${selectedPerfil ? ` - ${selectedPerfil}` : ''}`}
            height={400}
            backgroundColor="#FFFFFF"
            textColor="#1D1D1F"
          />
        </div>

        {/* Gráfica de ejemplo */}
        <div style={{ gridColumn: '1 / -1' }}>
          <TradingViewChart
            data={sampleData}
            title="📊 Datos de Ejemplo (30 días)"
            height={300}
            lineColor="#34C759"
            backgroundColor="#FFFFFF"
            textColor="#1D1D1F"
            gridColor="#F2F2F7"
          />
        </div>
      </div>

      {/* Información adicional */}
      <div style={{
        marginTop: '32px',
        padding: '20px',
        backgroundColor: '#F2F2F7',
        borderRadius: '12px',
        textAlign: 'center',
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#1D1D1F',
          margin: '0 0 12px 0',
        }}>
          ✅ TradingView Charts - Integración Completa
        </h3>
        <p style={{
          fontSize: '14px',
          color: '#8E8E93',
          margin: 0,
          lineHeight: '1.5',
        }}>
          Se han integrado exitosamente las gráficas de TradingView con datos reales de tu proyecto:
          <br />
          <strong>📈 Gráfica de Área:</strong> Muestra la evolución temporal de métricas (impresiones, alcance, me gusta)
          <br />
          <strong>🥧 Gráfica de Torta:</strong> Visualiza la distribución por categorías usando los mismos colores del mosaico
          <br />
          <strong>🎯 Funcionalidades:</strong> Zoom interactivo, navegación, crosshair, responsive design, y estilo Apple
        </p>
      </div>
    </div>
  );
}
