#!/usr/bin/env node

/**
 * Script para probar el API endpoint de categorización automática
 */

async function probarAPIEndpoint() {
  try {
    console.log('🚀 Probando API endpoint /api/categorize-pending...\n');
    
    // Verificar registros pendientes antes del procesamiento
    console.log('📊 Estado antes del procesamiento:');
    
    const response = await fetch('http://localhost:3000/api/categorize-pending', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        batchSize: 5, // Solo 5 para prueba
        delayMs: 1000 // 1 segundo entre requests
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    console.log('✅ Respuesta del API:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('\n🎉 Procesamiento exitoso!');
      console.log(`📈 Estadísticas:`);
      console.log(`   • Total pendientes encontrados: ${data.stats.totalPendientes}`);
      console.log(`   • Procesados exitosamente: ${data.stats.procesados}`);
      console.log(`   • Errores: ${data.stats.errores}`);
      console.log(`   • Tiempo de procesamiento: ${data.processingTime}`);
      
      if (data.stats.categorias) {
        console.log(`\n📋 Distribución de categorías:`);
        Object.entries(data.stats.categorias).forEach(([categoria, count]) => {
          if (count > 0) {
            console.log(`   • ${categoria}: ${count}`);
          }
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error al probar el API:', error.message);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  probarAPIEndpoint();
}
