import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Middleware para validação de dados de entrada
 */
export const validateMedicationData = (req: Request, res: Response, next: NextFunction) => {
  const { name, dosage, frequency, stock, expiryDate } = req.body;
  const errors: string[] = [];
  const requestId = (req as any).requestId || 'unknown';

  // Validação do nome
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Nome do medicamento é obrigatório e deve ter pelo menos 2 caracteres');
  }

  // Validação da dosagem
  if (!dosage || typeof dosage !== 'string' || dosage.trim().length === 0) {
    errors.push('Dosagem é obrigatória');
  }

  // Validação da frequência
  if (
    !frequency ||
    typeof frequency !== 'string' ||
    !['daily', 'twice_daily', 'three_times_daily', 'weekly'].includes(frequency)
  ) {
    errors.push(
      'Frequência deve ser uma das opções: daily, twice_daily, three_times_daily, weekly'
    );
  }

  // Validação do estoque
  if (stock !== undefined && (typeof stock !== 'number' || stock < 0)) {
    errors.push('Estoque deve ser um número não negativo');
  }

  // Validação da data de validade
  if (expiryDate) {
    const expiry = new Date(expiryDate);
    const now = new Date();
    if (isNaN(expiry.getTime()) || expiry <= now) {
      errors.push('Data de validade deve ser uma data futura válida');
    }
  }

  if (errors.length > 0) {
    logger.warn('Validation failed for medication data', {
      requestId,
      userId: (req as any).user?.id,
      errors,
      data: { name, dosage, frequency, stock, expiryDate },
      type: 'validation_error',
    });

    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Dados inválidos fornecidos',
        details: errors,
      },
    });
  }

  // Dados válidos - prosseguir
  logger.info('Medication data validation passed', {
    requestId,
    userId: (req as any).user?.id,
    medicationName: name,
    type: 'validation_success',
  });

  next();
};

/**
 * Middleware para sanitização de dados de entrada
 */
export const sanitizeMedicationData = (req: Request, res: Response, next: NextFunction) => {
  if (req.body.name) {
    req.body.name = req.body.name.trim();
  }

  if (req.body.dosage) {
    req.body.dosage = req.body.dosage.trim();
  }

  // Garantir que o userId venha do token JWT, não do body
  if (req.body.userId) {
    delete req.body.userId;
  }

  next();
};
