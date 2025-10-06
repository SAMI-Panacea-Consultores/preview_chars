#!/usr/bin/env node

/**
 * Script para probar el API endpoint de limpieza de registros pendientes
 */

async function probarLimpiezaAPI() {
  try {
    console.log('🧹 Probando API endpoint /api/cleanup-pending...\n');
    
    const response = await fetch('http://localhost:3000/api/cleanup-pending', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    console.log('✅ Respuesta del API:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('\n🎉 Limpieza exitosa!');
      console.log(`📈 Estadísticas:`);
      console.log(`   • Total pendientes antes: ${data.stats.totalPendientesAntes}`);
      console.log(`   • Eliminados: ${data.stats.eliminados}`);
      console.log(`   • Conservados: ${data.stats.conservados}`);
      console.log(`   • Total pendientes después: ${data.stats.totalPendientesDespues}`);
      
      if (data.eliminatedRecords && data.eliminatedRecords.length > 0) {
        console.log(`\n🗑️  IDs eliminados (primeros 5):`);
        data.eliminatedRecords.slice(0, 5).forEach((id, index) => {
          console.log(`   ${index + 1}. ${id}`);
        });
        if (data.eliminatedRecords.length > 5) {
          console.log(`   ... y ${data.eliminatedRecords.length - 5} más`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error al probar el API:', error.message);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  probarLimpiezaAPI();
}
