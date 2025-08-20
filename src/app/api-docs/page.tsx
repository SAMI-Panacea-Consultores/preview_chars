'use client';

import { useEffect, useState } from 'react';

interface ApiSpec {
  info?: {
    title?: string;
    description?: string;
    version?: string;
  };
}

declare global {
  interface Window {
    SwaggerUIBundle: any;
  }
}

export default function ApiDocsPage() {
  const [swaggerLoaded, setSwaggerLoaded] = useState(false);
  const [swaggerError, setSwaggerError] = useState(false);
  const [apiSpec, setApiSpec] = useState<ApiSpec | null>(null);

  useEffect(() => {
    // Cargar especificación de la API primero
    fetch('/api/docs')
      .then(res => res.json())
      .then(data => setApiSpec(data))
      .catch(err => console.error('Error loading API spec:', err));

    // Intentar cargar SwaggerUI
    const loadSwaggerUI = () => {
      try {
        // Crear contenedor para SwaggerUI
        const swaggerContainer = document.getElementById('swagger-ui');
        if (!swaggerContainer) return;

        // Limpiar contenido previo
        swaggerContainer.innerHTML = '';

        // Usar fetch para cargar la especificación y mostrarla en SwaggerUI
        fetch('/api/docs')
          .then(response => response.json())
          .then(spec => {
            // Crear SwaggerUI usando el script cargado
            if (window.SwaggerUIBundle) {
              window.SwaggerUIBundle({
                spec: spec, // Usar la especificación directamente
                dom_id: '#swagger-ui',
                presets: [
                  window.SwaggerUIBundle.presets.apis,
                  window.SwaggerUIBundle.presets.standalone
                ],
                layout: 'BaseLayout',
                deepLinking: true,
                showExtensions: true,
                showCommonExtensions: true,
                defaultModelsExpandDepth: 1,
                defaultModelExpandDepth: 1,
                docExpansion: 'list',
                filter: true,
                tryItOutEnabled: true,
                supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
              });
              setSwaggerLoaded(true);
            } else {
              throw new Error('SwaggerUIBundle not available');
            }
          })
          .catch(err => {
            console.error('Error loading SwaggerUI:', err);
            setSwaggerError(true);
          });
      } catch (err) {
        console.error('Error initializing SwaggerUI:', err);
        setSwaggerError(true);
      }
    };

    // Cargar SwaggerUI desde CDN
    const loadSwaggerFromCDN = () => {
      // CSS
      const swaggerCSS = document.createElement('link');
      swaggerCSS.rel = 'stylesheet';
      swaggerCSS.href = 'https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css';
      document.head.appendChild(swaggerCSS);

      // JS
      const swaggerJS = document.createElement('script');
      swaggerJS.src = 'https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js';
      swaggerJS.onload = () => {
        setTimeout(loadSwaggerUI, 100); // Pequeño delay para asegurar que el script esté listo
      };
      swaggerJS.onerror = () => {
        console.error('Failed to load SwaggerUI from CDN');
        setSwaggerError(true);
      };
      document.head.appendChild(swaggerJS);

      // Cleanup function
      return () => {
        try {
          if (document.head.contains(swaggerCSS)) {
            document.head.removeChild(swaggerCSS);
          }
          if (document.head.contains(swaggerJS)) {
            document.head.removeChild(swaggerJS);
          }
        } catch (err) {
          console.warn('Error during cleanup:', err);
        }
      };
    };

    // Si SwaggerUI ya está disponible, usarlo directamente
    if (typeof window !== 'undefined' && window.SwaggerUIBundle) {
      loadSwaggerUI();
    } else {
      // Cargar desde CDN
      const cleanup = loadSwaggerFromCDN();
      return cleanup;
    }
  }, []);

  if (swaggerError) {
    return (
      <div style={{ 
        minHeight: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: '2rem'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          textAlign: 'center',
          padding: '3rem'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '2rem' }}>⚠️</div>
          <h1 style={{ color: '#d73a49', marginBottom: '1rem' }}>
            Error cargando SwaggerUI
          </h1>
          <p style={{ color: '#666', marginBottom: '2rem', lineHeight: 1.6 }}>
            No se pudo cargar la interfaz interactiva de SwaggerUI desde el CDN. 
            Esto puede deberse a problemas de conectividad o bloqueo de recursos externos.
          </p>
          
          <div style={{ 
            background: '#f8f9fa', 
            border: '1px solid #e1e5e9',
            borderRadius: '8px',
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            <h3 style={{ marginTop: 0, color: '#1a1a1a' }}>
              📋 Alternativas disponibles:
            </h3>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a 
                href="/api-docs-simple" 
                style={{
                  display: 'inline-block',
                  background: '#007AFF',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontWeight: 500
                }}
              >
                📋 Documentación Simplificada
              </a>
              <a 
                href="/api/docs" 
                target="_blank"
                style={{
                  display: 'inline-block',
                  background: '#28a745',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontWeight: 500
                }}
              >
                📄 Especificación JSON
              </a>
            </div>
          </div>

          <button 
            onClick={() => window.location.reload()}
            style={{
              background: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            🔄 Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '2rem',
        textAlign: 'center',
        marginBottom: '2rem'
      }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          margin: '0 0 1rem 0',
          fontWeight: 700
        }}>
          🚀 {apiSpec?.info?.title || 'Andi Analytics API'}
        </h1>
        <p style={{ 
          fontSize: '1.2rem',
          margin: 0,
          opacity: 0.9
        }}>
          {apiSpec?.info?.description || 'Documentación interactiva de la API para análisis de publicaciones en redes sociales'}
        </p>
        {apiSpec?.info?.version && (
          <span style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.2)',
            padding: '0.25rem 0.75rem',
            borderRadius: '1rem',
            fontSize: '0.875rem',
            marginTop: '1rem'
          }}>
            v{apiSpec.info.version}
          </span>
        )}
      </div>
      
      <div 
        id="swagger-ui"
        style={{
          padding: '0 2rem 2rem 2rem'
        }}
      >
        {!swaggerLoaded && (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: '#666'
          }}>
            <div style={{
              fontSize: '3rem',
              marginBottom: '1rem'
            }}>
              📚
            </div>
            <p>Cargando documentación interactiva...</p>
            <div style={{
              marginTop: '2rem',
              fontSize: '0.875rem'
            }}>
              <p>Si la carga toma mucho tiempo, puedes probar:</p>
              <a 
                href="/api-docs-simple" 
                style={{
                  color: '#007AFF',
                  textDecoration: 'none',
                  fontWeight: 500
                }}
              >
                📋 Documentación simplificada
              </a>
              <span style={{ margin: '0 1rem', color: '#ccc' }}>|</span>
              <a 
                href="/api/docs" 
                target="_blank"
                style={{
                  color: '#007AFF',
                  textDecoration: 'none',
                  fontWeight: 500
                }}
              >
                📄 JSON OpenAPI
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}