import { Router } from 'express';
import {
  createHistoryHandler,
  getHistoryByAuthenticatedUserHandler,
  getHistoryByMedicationHandler,
  getHistoryByUserHandler,
  getHistoryByIdHandler,
  deleteHistoryHandler,
  getAdherenceStatsHandler,
} from './history.controller';
import { validate } from '../../shared/middlewares/validate';
import { authMiddleware } from '../../shared/middlewares/auth';
import { apiRateLimit } from '../../shared/middlewares/rate-limit';
import {
  createHistorySchema,
  getHistoryByMedicationSchema,
  getHistoryByUserSchema,
  deleteHistorySchema,
} from './history.schemas';

const router = Router();

// Rota de teste (pública, sem autenticação)
/**
 * @route   GET /api/history/test
 * @desc    Test route for history module
 * @access  Public (for testing)
 */
router.get('/test', (req, res) => {
  res.json({ message: 'History routes are working', timestamp: new Date().toISOString() });
});

// Aplicar rate limiting para histórico
router.use(apiRateLimit);

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

/**
 * @route   GET /api/history/me
 * @desc    Get history entries for authenticated user
 * @access  Private
 */
router.get('/me', getHistoryByAuthenticatedUserHandler);

/**
 * @route   POST /api/history
 * @desc    Create a new medication history entry
 * @access  Private
 */
router.post('/', validate(createHistorySchema), createHistoryHandler);

/**
 * @route   GET /api/history/medication/:medicationId/adherence
 * @desc    Get adherence statistics for a medication
 * @access  Private
 */
router.get('/medication/:medicationId/adherence', getAdherenceStatsHandler);

/**
 * @route   GET /api/history/medication/:medicationId
 * @desc    Get history entries by medication ID
 * @access  Private
 */
router.get(
  '/medication/:medicationId',
  validate(getHistoryByMedicationSchema),
  getHistoryByMedicationHandler
);

/**
 * @route   GET /api/history/user/:userId
 * @desc    Get history entries by user ID
 * @access  Private
 */
router.get('/user/:userId', validate(getHistoryByUserSchema), getHistoryByUserHandler);

/**
 * @route   GET /api/history/:id
 * @desc    Get a single history entry by ID
 * @access  Private
 */
router.get('/:id', getHistoryByIdHandler);

/**
 * @route   DELETE /api/history/:id
 * @desc    Delete a history entry
 * @access  Private
 */
router.delete('/:id', validate(deleteHistorySchema), deleteHistoryHandler);

export default router;
