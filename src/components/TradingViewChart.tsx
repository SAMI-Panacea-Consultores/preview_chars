'use client'

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, LineStyle, AreaSeries } from 'lightweight-charts';

interface ChartData {
  time: string;
  value: number;
}

interface TradingViewChartProps {
  data: ChartData[];
  title?: string;
  height?: number;
  width?: number;
  lineColor?: string;
  backgroundColor?: string;
  textColor?: string;
  gridColor?: string;
}

export default function TradingViewChart({
  data,
  title = 'Gráfica de Datos',
  height = 400,
  width = 800,
  lineColor = '#007AFF',
  backgroundColor = '#FFFFFF',
  textColor = '#1D1D1F',
  gridColor = '#F2F2F7'
}: TradingViewChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    try {
      // Limpiar gráfico anterior si existe
      if (chartRef.current) {
        try {
          chartRef.current.remove();
        } catch (error) {
          // Ignorar errores de limpieza si el objeto ya está disposed
          console.warn('Chart cleanup warning:', error);
        }
        chartRef.current = null;
        seriesRef.current = null;
      }

      // Crear nuevo gráfico con configuración Apple-style
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: backgroundColor },
          textColor: textColor,
          fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
          fontSize: 14,
        },
        width: width,
        height: height,
        rightPriceScale: {
          borderColor: gridColor,
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
        },
        timeScale: {
          borderColor: gridColor,
          timeVisible: true,
          secondsVisible: false,
        },
        grid: {
          vertLines: {
            color: gridColor,
            style: LineStyle.Solid,
            visible: true,
          },
          horzLines: {
            color: gridColor,
            style: LineStyle.Solid,
            visible: true,
          },
        },
        crosshair: {
          mode: 1, // Normal crosshair
          vertLine: {
            color: lineColor,
            width: 1,
            style: LineStyle.Dashed,
          },
          horzLine: {
            color: lineColor,
            width: 1,
            style: LineStyle.Dashed,
          },
        },
        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true,
          horzTouchDrag: true,
          vertTouchDrag: true,
        },
        handleScale: {
          axisPressedMouseMove: true,
          mouseWheel: true,
          pinch: true,
        },
      });

      // Crear serie de área usando la nueva API v5.0+
      const areaSeries = chart.addSeries(AreaSeries, {
        lineColor: lineColor,
        topColor: lineColor + '40', // 25% opacity
        bottomColor: lineColor + '00', // 0% opacity
        lineWidth: 3,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 6,
        crosshairMarkerBorderColor: backgroundColor,
        crosshairMarkerBackgroundColor: lineColor,
        lastValueVisible: true,
        priceLineVisible: true,
      });

      // Procesar y agregar datos
      if (data && data.length > 0) {
        // Convertir datos al formato requerido por lightweight-charts
        const processedData = data
          .filter(item => item.time && item.value !== undefined)
          .map(item => ({
            time: item.time,
            value: Number(item.value) || 0,
          }))
          .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

        if (processedData.length > 0) {
          areaSeries.setData(processedData);
          
          // Ajustar vista para mostrar todos los datos
          chart.timeScale().fitContent();
          
          setError(null);
        } else {
          setError('No hay datos válidos para mostrar');
        }
      } else {
        setError('No se proporcionaron datos');
      }

      // Guardar referencias
      chartRef.current = chart;
      seriesRef.current = areaSeries;
      setIsLoading(false);

      // Manejar redimensionamiento
      const handleResize = () => {
        if (chartContainerRef.current && chart) {
          const containerWidth = chartContainerRef.current.clientWidth;
          chart.applyOptions({ width: containerWidth });
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (chart) {
          try {
            chart.remove();
          } catch (error) {
            // Ignorar errores de limpieza si el objeto ya está disposed
            console.warn('Chart cleanup warning:', error);
          }
        }
      };

    } catch (err) {
      console.error('Error creating chart:', err);
      setError(`Error al crear la gráfica: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      setIsLoading(false);
    }
  }, [data, title, height, width, lineColor, backgroundColor, textColor, gridColor]);

  // Actualizar datos cuando cambien
  useEffect(() => {
    if (seriesRef.current && data && data.length > 0) {
      try {
        const processedData = data
          .filter(item => item.time && item.value !== undefined)
          .map(item => ({
            time: item.time,
            value: Number(item.value) || 0,
          }))
          .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

        if (processedData.length > 0) {
          seriesRef.current.setData(processedData);
          if (chartRef.current) {
            try {
              chartRef.current.timeScale().fitContent();
            } catch (error) {
              console.warn('Chart update warning:', error);
            }
          }
          setError(null);
        }
      } catch (err) {
        console.error('Error updating chart data:', err);
        setError(`Error al actualizar datos: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      }
    }
  }, [data]);

  if (error) {
    return (
      <div className="chart-error-container" style={{
        width: '100%',
        height: height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F2F2F7',
        borderRadius: '12px',
        border: '1px solid #E5E5EA',
        flexDirection: 'column',
        gap: '12px',
        fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
      }}>
        <div style={{ fontSize: '48px' }}>📊</div>
        <div style={{ 
          color: '#8E8E93', 
          fontSize: '16px',
          textAlign: 'center',
          padding: '0 20px'
        }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="tradingview-chart-wrapper" style={{
      width: '100%',
      position: 'relative',
      backgroundColor: backgroundColor,
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(0, 0, 0, 0.05)',
    }}>
      {title && (
        <div style={{
          padding: '16px 20px 12px',
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
          backgroundColor: backgroundColor,
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: '600',
            color: textColor,
            fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
          }}>
            {title}
          </h3>
        </div>
      )}
      
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          zIndex: 10,
          fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            color: '#8E8E93'
          }}>
            <div className="loading-spinner" style={{
              width: '20px',
              height: '20px',
              border: '2px solid #E5E5EA',
              borderTop: '2px solid #007AFF',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}></div>
            Cargando gráfica...
          </div>
        </div>
      )}
      
      <div
        ref={chartContainerRef}
        style={{
          width: '100%',
          height: height,
          position: 'relative',
        }}
      />
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Componente helper para crear datos de ejemplo
export function createSampleData(days: number = 30): ChartData[] {
  const data: ChartData[] = [];
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Generar valores aleatorios que simulen impresiones
    const baseValue = 1000;
    const variation = Math.random() * 500;
    const trend = (days - i) * 10; // Tendencia creciente
    
    data.push({
      time: date.toISOString().split('T')[0], // YYYY-MM-DD format
      value: Math.round(baseValue + variation + trend),
    });
  }
  
  return data;
}

// Función helper para convertir datos de publicaciones a formato de gráfica
export function convertPublicationsToChartData(
  publications: any[],
  dateField: string = 'Fecha',
  valueField: string = 'Impresiones'
): ChartData[] {
  if (!publications || publications.length === 0) {
    return [];
  }

  // Agrupar por fecha y sumar valores
  const groupedData = publications.reduce((acc, pub) => {
    const dateStr = pub[dateField];
    if (!dateStr) return acc;

    // Convertir fecha a formato YYYY-MM-DD
    let formattedDate: string;
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return acc;
      formattedDate = date.toISOString().split('T')[0];
    } catch {
      return acc;
    }

    const value = Number(pub[valueField]) || 0;
    
    if (!acc[formattedDate]) {
      acc[formattedDate] = 0;
    }
    acc[formattedDate] += value;

    return acc;
  }, {} as Record<string, number>);

  // Convertir a array y ordenar por fecha
  return Object.entries(groupedData)
    .map(([time, value]) => ({ time, value }))
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
}
