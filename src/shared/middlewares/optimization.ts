import { Request, Response, NextFunction } from 'express';

/**
 * Middleware simples para adicionar headers de compressão
 * Indica ao cliente que o servidor suporta compressão gzip
 */
export const compressionMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Adicionar header indicando suporte a compressão
  res.set('Accept-Encoding', 'gzip, deflate');

  // Se o cliente suportar gzip, o Express pode comprimir automaticamente
  // Esta é uma implementação básica - em produção considere usar bibliotecas especializadas
  next();
};

/**
 * Middleware para adicionar headers de cache apropriados
 */
export const cacheMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Para rotas GET, adicionar cache de curta duração
  if (req.method === 'GET') {
    // Cache por 5 minutos para dados que mudam frequentemente
    res.set('Cache-Control', 'private, max-age=300');
  } else {
    // Para outras operações, não cachear
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }

  next();
};
