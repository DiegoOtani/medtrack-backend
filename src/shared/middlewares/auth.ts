import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

/**
 * Middleware de autenticação JWT
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extrai token do header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Token de autenticação não fornecido' });
    }

    // Verifica se o header tem o formato "Bearer <token>"
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

    if (!token) {
      return res.status(401).json({ error: 'Token de autenticação não fornecido' });
    }

    // Verifica e decodifica o token
    const authService = new AuthService();
    const decoded = authService.verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }

    // Busca usuário completo
    const user = await authService.getUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    // Adiciona usuário na requisição
    (req as any).user = user;

    next();
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
