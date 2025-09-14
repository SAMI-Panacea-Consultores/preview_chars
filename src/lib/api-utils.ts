import { NextApiResponse } from 'next';
import { ZodError } from 'zod';
import { PaginationMeta, PublicationStats } from './schemas';

// Tipos para respuestas API
export interface ApiSuccessResponse<T = any> {
  data: T;
  meta?: PaginationMeta;
  stats?: PublicationStats;
  message?: string;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  details?: any;
  timestamp: string;
}

// Clase para manejo de respuestas API
export class ApiResponse {
  static success<T>(
    res: NextApiResponse,
    data: T,
    meta?: PaginationMeta,
    stats?: PublicationStats,
    message?: string
  ) {
    const response: ApiSuccessResponse<T> = {
      data,
      ...(meta && { meta }),
      ...(stats && { stats }),
      ...(message && { message }),
    };

    return res.status(200).json(response);
  }

  static created<T>(
    res: NextApiResponse,
    data: T,
    message?: string
  ) {
    const response: ApiSuccessResponse<T> = {
      data,
      ...(message && { message }),
    };

    return res.status(201).json(response);
  }

  static noContent(res: NextApiResponse) {
    return res.status(204).end();
  }

  static badRequest(
    res: NextApiResponse,
    message: string = 'Solicitud inválida',
    details?: any
  ) {
    const response: ApiErrorResponse = {
      error: 'Bad Request',
      message,
      statusCode: 400,
      ...(details && { details }),
      timestamp: new Date().toISOString(),
    };

    return res.status(400).json(response);
  }

  static unauthorized(
    res: NextApiResponse,
    message: string = 'No autorizado'
  ) {
    const response: ApiErrorResponse = {
      error: 'Unauthorized',
      message,
      statusCode: 401,
      timestamp: new Date().toISOString(),
    };

    return res.status(401).json(response);
  }

  static forbidden(
    res: NextApiResponse,
    message: string = 'Acceso prohibido'
  ) {
    const response: ApiErrorResponse = {
      error: 'Forbidden',
      message,
      statusCode: 403,
      timestamp: new Date().toISOString(),
    };

    return res.status(403).json(response);
  }

  static notFound(
    res: NextApiResponse,
    message: string = 'Recurso no encontrado'
  ) {
    const response: ApiErrorResponse = {
      error: 'Not Found',
      message,
      statusCode: 404,
      timestamp: new Date().toISOString(),
    };

    return res.status(404).json(response);
  }

  static conflict(
    res: NextApiResponse,
    data?: any,
    message: string = 'Conflicto de recursos'
  ) {
    const response = {
      error: 'Conflict',
      message,
      statusCode: 409,
      timestamp: new Date().toISOString(),
      ...(data && { data }),
    };

    return res.status(409).json(response);
  }

  static unprocessableEntity(
    res: NextApiResponse,
    message: string = 'Entidad no procesable',
    details?: any
  ) {
    const response: ApiErrorResponse = {
      error: 'Unprocessable Entity',
      message,
      statusCode: 422,
      ...(details && { details }),
      timestamp: new Date().toISOString(),
    };

    return res.status(422).json(response);
  }

  static tooManyRequests(
    res: NextApiResponse,
    message: string = 'Demasiadas solicitudes'
  ) {
    const response: ApiErrorResponse = {
      error: 'Too Many Requests',
      message,
      statusCode: 429,
      timestamp: new Date().toISOString(),
    };

    return res.status(429).json(response);
  }

  static internalError(
    res: NextApiResponse,
    message: string = 'Error interno del servidor',
    details?: any
  ) {
    const response: ApiErrorResponse = {
      error: 'Internal Server Error',
      message,
      statusCode: 500,
      ...(details && { details }),
      timestamp: new Date().toISOString(),
    };

    return res.status(500).json(response);
  }

  static validationError(
    res: NextApiResponse,
    error: ZodError,
    message: string = 'Error de validación'
  ) {
    const response: ApiErrorResponse = {
      error: 'Validation Error',
      message,
      statusCode: 400,
      details: {
        issues: error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        })),
        formattedErrors: error.flatten(),
      },
      timestamp: new Date().toISOString(),
    };

    return res.status(400).json(response);
  }
}

// Middleware para manejo de errores
export const withErrorHandling = (
  handler: (req: any, res: NextApiResponse) => Promise<void>
) => {
  return async (req: any, res: NextApiResponse) => {
    try {
      await handler(req, res);
    } catch (error) {
      console.error('API Error:', error);

      if (error instanceof ZodError) {
        return ApiResponse.validationError(res, error);
      }

      if (error instanceof Error) {
        return ApiResponse.internalError(res, error.message);
      }

      return ApiResponse.internalError(res);
    }
  };
};

// Middleware para métodos HTTP permitidos
export const withMethods = (
  allowedMethods: string[],
  handler: (req: any, res: NextApiResponse) => Promise<void>
) => {
  return async (req: any, res: NextApiResponse) => {
    if (!allowedMethods.includes(req.method)) {
      res.setHeader('Allow', allowedMethods.join(', '));
      return ApiResponse.badRequest(res, `Método ${req.method} no permitido`);
    }

    await handler(req, res);
  };
};

// Middleware para CORS
export const withCORS = (
  handler: (req: any, res: NextApiResponse) => Promise<void>
) => {
  return async (req: any, res: NextApiResponse) => {
    // Configurar headers CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization'
    );

    // Manejar preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    await handler(req, res);
  };
};

// Middleware de rate limiting básico (en memoria)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const withRateLimit = (
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000, // 15 minutos
  handler: (req: any, res: NextApiResponse) => Promise<void>
) => {
  return async (req: any, res: NextApiResponse) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;

    // Limpiar entradas antiguas
    for (const [key, value] of requestCounts.entries()) {
      if (value.resetTime < windowStart) {
        requestCounts.delete(key);
      }
    }

    const current = requestCounts.get(ip) || { count: 0, resetTime: now + windowMs };

    if (current.resetTime < now) {
      current.count = 0;
      current.resetTime = now + windowMs;
    }

    current.count++;
    requestCounts.set(ip, current);

    // Headers informativos
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - current.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(current.resetTime / 1000));

    if (current.count > maxRequests) {
      return ApiResponse.tooManyRequests(
        res,
        `Límite de ${maxRequests} solicitudes por ${windowMs / 1000 / 60} minutos excedido`
      );
    }

    await handler(req, res);
  };
};

// Combinar middlewares
export const withMiddleware = (
  middlewares: Array<(handler: any) => any>,
  handler: (req: any, res: NextApiResponse) => Promise<void>
) => {
  return middlewares.reduce((acc, middleware) => middleware(acc), handler);
};

// Helper para logging
export const logRequest = (req: any, res: any, startTime: number) => {
  const duration = Date.now() - startTime;
  const logData = {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode || 200,
    duration: `${duration}ms`,
    ip: req.ip || req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown',
    userAgent: req.headers.get?.('user-agent') || req.headers['user-agent'],
    timestamp: new Date().toISOString(),
  };

  console.log('API Request:', JSON.stringify(logData));
};
