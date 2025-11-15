import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Mapa simples para armazenar contadores de requests (em produção, usar Redis)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

/**
 * Middleware de rate limiting básico
 * Em produção, considere usar bibliotecas como express-rate-limit ou Redis
 */
export const rateLimit = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Limpar entradas antigas
    for (const [k, v] of requestCounts.entries()) {
      if (v.resetTime < windowStart) {
        requestCounts.delete(k);
      }
    }

    const current = requestCounts.get(key);

    if (!current || current.resetTime < windowStart) {
      // Primeira request ou janela expirada
      requestCounts.set(key, { count: 1, resetTime: now + windowMs });
      next();
    } else if (current.count < maxRequests) {
      // Incrementar contador
      current.count++;
      next();
    } else {
      // Rate limit excedido
      const requestId = (req as any).requestId || 'unknown';

      logger.warn('Rate limit exceeded', {
        requestId,
        ip: req.ip,
        path: req.path,
        userId: (req as any).user?.id,
        maxRequests,
        windowMs,
        type: 'rate_limit',
      });

      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Muitas requisições. Tente novamente mais tarde.',
          retryAfter: Math.ceil((current.resetTime - now) / 1000),
        },
      });
    }
  };
};

/**
 * Rate limiting específico para autenticação (mais restritivo)
 */
export const authRateLimit = rateLimit(5, 15 * 60 * 1000); // 5 requests por 15 minutos

/**
 * Rate limiting para operações de medicamentos
 */
export const medicationRateLimit = rateLimit(50, 15 * 60 * 1000); // 50 requests por 15 minutos

/**
 * Rate limiting para operações gerais da API
 */
export const apiRateLimit = rateLimit(100, 15 * 60 * 1000); // 100 requests por 15 minutos
