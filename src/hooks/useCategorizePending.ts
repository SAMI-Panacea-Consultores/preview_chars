import { useState } from 'react';

interface ProcessingStats {
  totalPendientes: number;
  procesados: number;
  errores: number;
  categorias: {
    [key: string]: number;
  };
}

interface ProcessingResult {
  success: boolean;
  message: string;
  stats: ProcessingStats;
  processingTime: string;
}

interface ProcessingOptions {
  batchSize?: number;
  delayMs?: number;
}

export function useCategorizePending() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startProcessing = async (options: ProcessingOptions = {}) => {
    try {
      setIsProcessing(true);
      setError(null);
      setResult(null);

      console.log('🚀 Iniciando procesamiento de registros pendientes...');

      const response = await fetch('/api/categorize-pending', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          batchSize: options.batchSize || 10,
          delayMs: options.delayMs || 2000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: ProcessingResult = await response.json();
      setResult(data);
      
      console.log('✅ Procesamiento completado:', data);
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('❌ Error en procesamiento:', errorMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setIsProcessing(false);
  };

  return {
    isProcessing,
    result,
    error,
    startProcessing,
    reset,
  };
}
