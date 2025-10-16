import { Router } from 'express';
import {
  createHistoryHandler,
  getHistoryByMedicationHandler,
  getHistoryByUserHandler,
  getHistoryByIdHandler,
  deleteHistoryHandler,
  getAdherenceStatsHandler,
} from './history.controller';
import { validate } from '../../shared/middlewares/validate';
import {
  createHistorySchema,
  getHistoryByMedicationSchema,
  getHistoryByUserSchema,
  deleteHistorySchema,
} from './history.schemas';

const router = Router();

/**
 * @route   POST /api/history
 * @desc    Create a new medication history entry
 * @access  Private
 */
router.post('/', validate(createHistorySchema), createHistoryHandler);

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
 * @route   GET /api/history/medication/:medicationId/adherence
 * @desc    Get adherence statistics for a medication
 * @access  Private
 */
router.get('/medication/:medicationId/adherence', getAdherenceStatsHandler);

/**
 * @route   GET /api/history/user/:userId
 * @desc    Get history entries by user ID
 * @access  Private
 */
router.get(
  '/user/:userId',
  validate(getHistoryByUserSchema),
  getHistoryByUserHandler
);

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
