'use client'

import { useEffect, useRef, useState } from 'react';

interface PieChartData {
  name: string;
  value: number;
  color: string;
}

interface TradingViewPieChartProps {
  data: PieChartData[];
  title?: string;
  height?: number;
  width?: number;
  backgroundColor?: string;
  textColor?: string;
}

export default function TradingViewPieChart({
  data,
  title = 'Distribución de Datos',
  height = 400,
  width = 400,
  backgroundColor = '#FFFFFF',
  textColor = '#1D1D1F'
}: TradingViewPieChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) {
      setError('No hay datos para mostrar');
      setIsLoading(false);
      return;
    }

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setError('No se pudo obtener el contexto del canvas');
        setIsLoading(false);
        return;
      }

      // Configurar el canvas
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      ctx.scale(dpr, dpr);
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';

      // Limpiar canvas
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, rect.width, rect.height);

      // Calcular total
      const total = data.reduce((sum, item) => sum + item.value, 0);
      if (total === 0) {
        setError('No hay datos válidos para mostrar');
        setIsLoading(false);
        return;
      }

      // Configuración del gráfico
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const radius = Math.min(rect.width, rect.height) * 0.35;
      const innerRadius = radius * 0.4; // Para crear un donut chart

      let currentAngle = -Math.PI / 2; // Empezar desde arriba

      // Dibujar cada segmento
      data.forEach((item, index) => {
        const percentage = item.value / total;
        const sliceAngle = percentage * 2 * Math.PI;

        // Dibujar el segmento
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
        ctx.closePath();
        
        // Aplicar color con gradiente
        const gradient = ctx.createRadialGradient(centerX, centerY, innerRadius, centerX, centerY, radius);
        gradient.addColorStop(0, item.color + '80');
        gradient.addColorStop(1, item.color);
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Borde sutil
        ctx.strokeStyle = backgroundColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Dibujar etiqueta si el segmento es suficientemente grande
        if (percentage > 0.05) {
          const labelAngle = currentAngle + sliceAngle / 2;
          const labelRadius = radius + 30;
          const labelX = centerX + Math.cos(labelAngle) * labelRadius;
          const labelY = centerY + Math.sin(labelAngle) * labelRadius;

          // Configurar texto
          ctx.fillStyle = textColor;
          ctx.font = "600 12px 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif";
          ctx.textAlign = labelX > centerX ? 'left' : 'right';
          ctx.textBaseline = 'middle';

          // Dibujar porcentaje
          const percentageText = `${(percentage * 100).toFixed(1)}%`;
          ctx.fillText(percentageText, labelX, labelY);
        }

        currentAngle += sliceAngle;
      });

      // Dibujar texto central con el total
      ctx.fillStyle = textColor;
      ctx.font = "700 24px 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(total.toLocaleString(), centerX, centerY - 5);
      
      ctx.font = "500 14px 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillStyle = textColor + '80';
      ctx.fillText('Total', centerX, centerY + 15);

      setError(null);
      setIsLoading(false);

    } catch (err) {
      console.error('Error creating pie chart:', err);
      setError(`Error al crear la gráfica: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      setIsLoading(false);
    }
  }, [data, height, width, backgroundColor, textColor]);

  if (error) {
    return (
      <div className="pie-chart-error-container" style={{
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
        <div style={{ fontSize: '48px' }}>🥧</div>
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
    <div className="tradingview-pie-chart-wrapper" style={{
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
      
      <div style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
      }}>
        <canvas
          ref={canvasRef}
          style={{
            width: width,
            height: height - 100,
            maxWidth: '100%',
          }}
        />
        
        {/* Leyenda */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '12px',
          maxWidth: '100%',
        }}>
          {data.map((item, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              background: 'rgba(255, 255, 255, 0.8)',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '500',
              color: textColor,
              border: `1px solid ${item.color}30`,
              fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: item.color,
                boxShadow: `0 0 0 2px ${item.color}20`
              }}></div>
              <span>{item.name}</span>
              <span style={{ 
                color: '#8E8E93', 
                fontSize: '12px',
                fontWeight: '400'
              }}>
                ({item.value.toLocaleString()})
              </span>
            </div>
          ))}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Función helper para convertir datos de categorías a formato de pie chart
export function convertCategoriesToPieData(
  categoriesData: Record<string, number>,
  categoryColors: Record<string, string> = {}
): PieChartData[] {
  const defaultColors = [
    '#007AFF', // System Blue
    '#34C759', // System Green  
    '#FF3B30', // System Red
    '#5856D6', // System Purple
    '#FF9500', // System Orange
    '#8E8E93', // System Gray
    '#AF52DE', // System Purple 2
    '#FF2D92', // System Pink
  ];

  return Object.entries(categoriesData)
    .filter(([_, value]) => value > 0)
    .map(([name, value], index) => ({
      name,
      value,
      color: categoryColors[name] || defaultColors[index % defaultColors.length]
    }))
    .sort((a, b) => b.value - a.value); // Ordenar por valor descendente
}
