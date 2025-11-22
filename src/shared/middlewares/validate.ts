import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Middleware genérico de validação com Zod
 * @param schema - Schema Zod para validação
 * @returns Middleware Express
 */
export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Valida o corpo, parâmetros e query da requisição
      const validatedData = await schema.parseAsync({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      // Substitui apenas o body pelos dados validados
      // params e query são somente leitura no Express
      if (validatedData.body) {
        req.body = validatedData.body;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Dados de entrada inválidos',
            details: error.errors.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
        });
      }

      console.error('Erro no middleware de validação:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro interno do servidor',
        },
      });
    }
  };
};
