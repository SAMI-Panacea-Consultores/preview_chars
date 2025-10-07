import { z } from 'zod';

// Esquemas base
export const RedSocialSchema = z.enum(['Instagram', 'Facebook', 'TikTok', 'Twitter']);

export const CategoriaSchema = z.enum([
  'SEGURIDAD',
  'INVERTIR PARA CRECER', 
  'TRANSPARENCIA PÚBLICA',
  'Sin categoría',
  'Error en procesamiento'
]);

// Tipos de publicación disponibles
export const TipoPublicacionSchema = z.enum([
  'Publicar',
  'Historia',
  'Reel',
  'Video',
  'Foto',
  'Carrusel',
  'Evento',
  'Encuesta'
]);

// Esquema para publicación completa
export const PublicationSchema = z.object({
  id: z.string().min(1, 'ID es requerido'),
  fecha: z.string().datetime('Fecha debe ser un datetime válido'),
  red: RedSocialSchema,
  perfil: z.string().min(1, 'Perfil es requerido'),
  categoria: z.string().min(1, 'Categoría es requerida'),
  tipoPublicacion: z.string().default('Publicar'),
  impresiones: z.number().int().min(0, 'Impresiones debe ser un número positivo'),
  alcance: z.number().int().min(0, 'Alcance debe ser un número positivo'),
  meGusta: z.number().int().min(0, 'Me gusta debe ser un número positivo'),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

// Esquema para crear/actualizar publicación
export const CreatePublicationSchema = PublicationSchema.omit({
  createdAt: true,
  updatedAt: true,
});

export const UpdatePublicationSchema = PublicationSchema.partial().omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Esquemas para queries
export const PublicationQuerySchema = z.object({
  red: RedSocialSchema.optional(),
  perfil: z.string().optional(),
  categoria: z.string().optional(),
  tipoPublicacion: z.string().optional(),
  fechaInicio: z.string().datetime('Fecha inicio debe ser un datetime válido').optional(),
  fechaFin: z.string().datetime('Fecha fin debe ser un datetime válido').optional(),
  limit: z.coerce.number().int().min(1).max(50000).default(100),
  offset: z.coerce.number().int().min(0).default(0),
  sortBy: z.enum(['fecha', 'impresiones', 'alcance', 'meGusta']).default('fecha'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Esquema para upload CSV
export const UploadCSVSchema = z.object({
  overwrite: z.string().transform((val) => val === 'true').default('false'),
});

// Esquemas para analytics
export const AnalyticsQuerySchema = z.object({
  red: RedSocialSchema.optional(),
  perfil: z.string().optional(),
  categoria: z.string().optional(),
  tipoPublicacion: z.string().optional(),
  fechaInicio: z.string().datetime().optional(),
  fechaFin: z.string().datetime().optional(),
  groupBy: z.array(z.enum(['red', 'perfil', 'categoria', 'tipoPublicacion', 'fecha'])).default([]),
});

export const ImpactAnalysisSchema = z.object({
  red: RedSocialSchema,
  perfil: z.string().min(1, 'Perfil es requerido'),
});

// Esquemas de respuesta
export const PaginationMetaSchema = z.object({
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
});

export const PublicationStatsSchema = z.object({
  totalPublicaciones: z.number().int(),
  redes: z.array(z.string()),
  perfiles: z.array(z.string()),
  categorias: z.array(z.string()),
});

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) => z.object({
  data: dataSchema,
  meta: PaginationMetaSchema.optional(),
  stats: PublicationStatsSchema.optional(),
  message: z.string().optional(),
});

// Esquemas de error
export const ApiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number().int(),
  details: z.record(z.string(), z.any()).optional(),
  timestamp: z.string().datetime(),
});

// Tipos TypeScript derivados
export type Publication = z.infer<typeof PublicationSchema>;
export type CreatePublication = z.infer<typeof CreatePublicationSchema>;
export type UpdatePublication = z.infer<typeof UpdatePublicationSchema>;
export type PublicationQuery = z.infer<typeof PublicationQuerySchema>;
export type UploadCSV = z.infer<typeof UploadCSVSchema>;
export type AnalyticsQuery = z.infer<typeof AnalyticsQuerySchema>;
export type ImpactAnalysis = z.infer<typeof ImpactAnalysisSchema>;
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;
export type PublicationStats = z.infer<typeof PublicationStatsSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;

// Helper para validación
export const validateSchema = <T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: z.ZodError } => {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};

// Middleware para validación en Next.js API routes
export const withValidation = <T extends z.ZodTypeAny>(
  schema: T,
  handler: (req: any, res: any, validatedData: z.infer<T>) => Promise<void>
) => {
  return async (req: any, res: any) => {
    try {
      const dataToValidate = req.method === 'GET' ? req.query : req.body;
      const validatedData = schema.parse(dataToValidate);
      
      await handler(req, res, validatedData);
    } catch (error) {
      console.error('API Error:', error);
      
      // Manejar errores de validación Zod
      if (error instanceof Error && error.name === 'ZodError') {
        const zodError = error as any;
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Los datos proporcionados no son válidos',
          statusCode: 400,
          details: {
            issues: zodError.issues?.map((issue: any) => ({
              path: issue.path.join('.'),
              message: issue.message,
              code: issue.code,
            })) || [],
            formattedErrors: zodError.flatten?.() || {},
          },
          timestamp: new Date().toISOString(),
        });
      }
      
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Error interno del servidor',
        statusCode: 500,
        timestamp: new Date().toISOString(),
      });
    }
  };
};
