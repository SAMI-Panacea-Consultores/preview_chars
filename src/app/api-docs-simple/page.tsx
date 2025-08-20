'use client';

import React, { useEffect, useState } from 'react';

interface ApiSpec {
  info?: {
    title?: string;
    description?: string;
    version?: string;
  };
  paths?: Record<string, any>;
  components?: {
    schemas?: Record<string, any>;
  };
}

export default function SimpleApiDocsPage() {
  const [apiSpec, setApiSpec] = useState<ApiSpec | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/docs')
      .then(res => res.json())
      .then(data => {
        setApiSpec(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          📚 Cargando documentación de la API...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">
          ❌ Error cargando documentación: {error}
        </div>
      </div>
    );
  }

  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      lineHeight: 1.6,
      color: '#333'
    },
    header: {
      borderBottom: '2px solid #007AFF',
      paddingBottom: '2rem',
      marginBottom: '3rem'
    },
    title: {
      fontSize: '2.5rem',
      fontWeight: 700,
      color: '#1a1a1a',
      margin: '0 0 1rem 0'
    },
    description: {
      fontSize: '1.2rem',
      color: '#666',
      margin: 0
    },
    version: {
      display: 'inline-block',
      background: '#007AFF',
      color: 'white',
      padding: '0.25rem 0.75rem',
      borderRadius: '1rem',
      fontSize: '0.875rem',
      fontWeight: 500,
      marginTop: '1rem'
    },
    sectionTitle: {
      fontSize: '1.75rem',
      fontWeight: 600,
      color: '#1a1a1a',
      margin: '0 0 1.5rem 0',
      borderBottom: '1px solid #e1e5e9',
      paddingBottom: '0.5rem'
    },
    endpoint: {
      background: 'white',
      border: '1px solid #e1e5e9',
      borderRadius: '8px',
      marginBottom: '1.5rem',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    endpointHeader: {
      padding: '1rem 1.5rem',
      background: '#f8f9fa',
      borderBottom: '1px solid #e1e5e9',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    },
    method: {
      fontWeight: 600,
      fontSize: '0.875rem',
      padding: '0.25rem 0.75rem',
      borderRadius: '4px',
      textTransform: 'uppercase' as const
    },
    methodGet: {
      background: '#49cc90',
      color: 'white'
    },
    methodPost: {
      background: '#fca130',
      color: 'white'
    },
    path: {
      fontFamily: 'Monaco, Menlo, monospace',
      fontSize: '1rem',
      color: '#1a1a1a'
    },
    endpointContent: {
      padding: '1.5rem'
    },
    tryLink: {
      display: 'inline-block',
      background: '#007AFF',
      color: 'white',
      padding: '0.5rem 1rem',
      borderRadius: '6px',
      textDecoration: 'none',
      fontSize: '0.875rem',
      fontWeight: 500,
      marginTop: '1rem'
    },
    loading: {
      textAlign: 'center' as const,
      padding: '3rem',
      fontSize: '1.2rem',
      color: '#666'
    },
    error: {
      textAlign: 'center' as const,
      padding: '3rem',
      fontSize: '1.2rem',
      color: '#d73a49'
    }
  };

  return (
    <div style={styles.container}>

      <div style={styles.header}>
        <h1 style={styles.title}>
          🚀 {apiSpec?.info?.title || 'API Documentation'}
        </h1>
        <p style={styles.description}>
          {apiSpec?.info?.description || 'Documentación de la API'}
        </p>
        <span style={styles.version}>
          v{apiSpec?.info?.version || '1.0.0'}
        </span>
      </div>

      <div style={{ marginBottom: '3rem' }}>
        <h2 style={styles.sectionTitle}>📋 Endpoints</h2>
        
        {Object.entries(apiSpec?.paths || {}).map(([path, methods]) => (
          Object.entries(methods as Record<string, any>).map(([method, details]) => (
            <div key={`${method}-${path}`} style={styles.endpoint}>
              <div style={styles.endpointHeader}>
                <span style={{
                  ...styles.method,
                  ...(method.toLowerCase() === 'get' ? styles.methodGet : styles.methodPost)
                }}>
                  {method.toUpperCase()}
                </span>
                <span style={styles.path}>{path}</span>
              </div>
              <div style={styles.endpointContent}>
                <p style={{ color: '#666', marginBottom: '1rem' }}>
                  {details.summary || details.description || 'Sin descripción disponible'}
                </p>
                
                {details.parameters && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1a1a1a', marginBottom: '0.75rem' }}>
                      📝 Parámetros:
                    </div>
                    {details.parameters.map((param: any, idx: number) => (
                      <div key={idx} style={{
                        background: '#f8f9fa',
                        padding: '0.75rem',
                        borderRadius: '4px',
                        marginBottom: '0.5rem',
                        fontFamily: 'Monaco, Menlo, monospace',
                        fontSize: '0.875rem'
                      }}>
                        <strong>{param.name}</strong> ({param.in}) - {param.description}
                      </div>
                    ))}
                  </div>
                )}
                
                {details.responses && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1a1a1a', marginBottom: '0.75rem' }}>
                      📤 Respuestas:
                    </div>
                    {Object.entries(details.responses).map(([code, response]: [string, any]) => (
                      <div key={code} style={{
                        background: '#f8f9fa',
                        padding: '0.75rem',
                        borderRadius: '4px',
                        marginBottom: '0.5rem',
                        fontFamily: 'Monaco, Menlo, monospace',
                        fontSize: '0.875rem'
                      }}>
                        <strong>{code}</strong> - {response.description}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        ))}
      </div>

      {apiSpec?.components?.schemas && (
        <div style={{ marginTop: '3rem' }}>
          <h2 style={styles.sectionTitle}>📊 Esquemas de Datos</h2>
          
          {Object.entries(apiSpec.components.schemas).map(([name, schema]: [string, any]) => (
            <div key={name} style={styles.endpoint}>
              <div style={{
                background: '#f8f9fa',
                padding: '1rem 1.5rem',
                borderBottom: '1px solid #e1e5e9',
                fontWeight: 600,
                color: '#1a1a1a'
              }}>
                {name}
              </div>
              <div style={{ padding: '1.5rem' }}>
                {schema.properties && Object.entries(schema.properties).map(([propName, prop]: [string, any]) => (
                  <div key={propName} style={{
                    marginBottom: '0.75rem',
                    padding: '0.5rem',
                    background: '#f8f9fa',
                    borderRadius: '4px'
                  }}>
                    <span style={{
                      fontWeight: 600,
                      color: '#007AFF',
                      fontFamily: 'Monaco, Menlo, monospace'
                    }}>
                      {propName}
                    </span>
                    <span style={{
                      color: '#666',
                      fontSize: '0.875rem',
                      marginLeft: '0.5rem'
                    }}>
                      ({prop.type})
                    </span>
                    {prop.description && (
                      <div style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: '#666' }}>
                        {prop.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '3rem', textAlign: 'center', paddingTop: '2rem', borderTop: '1px solid #e1e5e9' }}>
        <p style={{ color: '#666', marginBottom: '1rem' }}>
          ¿Prefieres la documentación interactiva completa?
        </p>
        <a href="/api-docs" style={styles.tryLink}>
          🔧 Probar con SwaggerUI
        </a>
        <span style={{ margin: '0 1rem', color: '#ccc' }}>|</span>
        <a href="/api/docs" style={styles.tryLink} target="_blank">
          📄 Ver JSON OpenAPI
        </a>
      </div>
    </div>
  );
}
