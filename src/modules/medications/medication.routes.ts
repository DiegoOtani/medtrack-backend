import { Router } from 'express';
import {
  createMedicationHandler,
  getMedicationsHandler,
  getMedicationByIdHandler,
  updateMedicationHandler,
  deleteMedicationHandler,
  getTodayMedicationsHandler,
  updateMedicationStockHandler,
  getLowStockMedicationsHandler,
  getOutOfStockMedicationsHandler,
} from './medication.controller';
import { authMiddleware } from '../../shared/middlewares/auth';
import {
  validateMedicationData,
  sanitizeMedicationData,
} from '../../shared/middlewares/validation';
import { medicationRateLimit } from '../../shared/middlewares/rate-limit';

const router = Router();

// Aplicar rate limiting para medicamentos
router.use(medicationRateLimit);

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// Rotas para criação e atualização com validação e sanitização
router.post('/', sanitizeMedicationData, validateMedicationData, createMedicationHandler);
router.put('/:id', sanitizeMedicationData, validateMedicationData, updateMedicationHandler);

// Rota específica para atualização de estoque (sem validação completa)
router.put('/:id/stock', updateMedicationStockHandler);

// Rotas de leitura
router.get('/', getMedicationsHandler);
router.get('/today', getTodayMedicationsHandler);
router.get('/stock/low', getLowStockMedicationsHandler);
router.get('/stock/out', getOutOfStockMedicationsHandler);
router.get('/:id', getMedicationByIdHandler);

// Rota de exclusão
router.delete('/:id', deleteMedicationHandler);

export default router;
