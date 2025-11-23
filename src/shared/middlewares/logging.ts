import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Middleware para logging de requests HTTP
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  // Adicionar requestId à requisição para rastreamento
  (req as any).requestId = requestId;

  // Log da requisição recebida
  logger.info(`Request started: ${req.method} ${req.originalUrl}`, {
    requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    type: 'request_start',
  });

  // Interceptar resposta para log de conclusão
  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - start;

    logger.request({
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      userId: (req as any).user?.id,
      ip: req.ip,
    });

    // Chamar método original
    return originalSend.call(this, data);
  };

  next();
};

/**
 * Middleware para logging de erros
 */
export const errorLogger = (error: any, req: Request, res: Response, next: NextFunction) => {
  const requestId = (req as any).requestId || 'unknown';

  logger.apiError('Request error', error, {
    requestId,
    method: req.method,
    url: req.originalUrl,
    userId: (req as any).user?.id,
    ip: req.ip,
    statusCode: res.statusCode,
  });

  next(error);
};
