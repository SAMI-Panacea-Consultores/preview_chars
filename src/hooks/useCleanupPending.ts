import { useState } from 'react';

interface CleanupStats {
  totalPendientesAntes: number;
  eliminados: number;
  conservados: number;
  totalPendientesDespues: number;
}

interface CleanupResult {
  success: boolean;
  message: string;
  stats: CleanupStats;
  eliminatedRecords: string[];
}

export function useCleanupPending() {
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [result, setResult] = useState<CleanupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCleanup = async () => {
    try {
      setIsCleaningUp(true);
      setError(null);
      setResult(null);

      console.log('🧹 Iniciando limpieza de registros pendientes sin contenido...');

      const response = await fetch('/api/cleanup-pending', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: CleanupResult = await response.json();
      setResult(data);
      
      console.log('✅ Limpieza completada:', data);
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('❌ Error en limpieza:', errorMessage);
      throw err;
    } finally {
      setIsCleaningUp(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setIsCleaningUp(false);
  };

  return {
    isCleaningUp,
    result,
    error,
    startCleanup,
    reset,
  };
}
