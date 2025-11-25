import { Router } from 'express';
import {
  getSchedulesByMedicationHandler,
  getSchedulesByUserHandler,
  getScheduleByIdHandler,
  createCustomScheduleHandler,
  updateScheduleHandler,
  toggleScheduleHandler,
  deleteScheduleHandler,
  getSyncDataHandler,
} from './schedules.controller';
import { validate } from '../../shared/middlewares/validate';
import {
  getSchedulesByMedicationSchema,
  getSchedulesByUserSchema,
  createCustomScheduleSchema,
  updateScheduleSchema,
  toggleScheduleSchema,
  deleteScheduleSchema,
} from './schedules.schemas';

const router = Router();

/**
 * @route   GET /api/schedules/sync
 * @desc    Get comprehensive data for offline sync
 * @access  Private
 * @note    MUST be defined before routes with :id parameters to avoid conflicts
 */
router.get('/sync', getSyncDataHandler);

/**
 * @route   GET /api/schedules/medication/:medicationId
 * @desc    Get all schedules for a medication
 * @access  Private
 * @query   isActive - Filter by active status (optional)
 */
router.get(
  '/medication/:medicationId',
  validate(getSchedulesByMedicationSchema),
  getSchedulesByMedicationHandler
);

/**
 * @route   GET /api/schedules/user/:userId
 * @desc    Get all schedules for a user's medications
 * @access  Private
 * @query   isActive - Filter by active status (optional)
 */
router.get(
  '/user/:userId',
  validate(getSchedulesByUserSchema),
  getSchedulesByUserHandler
);

/**
 * @route   POST /api/schedules
 * @desc    Create a custom schedule
 * @access  Private
 */
router.post(
  '/',
  validate(createCustomScheduleSchema),
  createCustomScheduleHandler
);

/**
 * @route   GET /api/schedules/:id
 * @desc    Get a single schedule by ID
 * @access  Private
 */
router.get('/:id', getScheduleByIdHandler);

/**
 * @route   PATCH /api/schedules/:id
 * @desc    Update a schedule
 * @access  Private
 */
router.patch('/:id', validate(updateScheduleSchema), updateScheduleHandler);

/**
 * @route   PATCH /api/schedules/:id/toggle
 * @desc    Toggle a schedule's active status
 * @access  Private
 */
router.patch(
  '/:id/toggle',
  validate(toggleScheduleSchema),
  toggleScheduleHandler
);

/**
 * @route   DELETE /api/schedules/:id
 * @desc    Delete a schedule
 * @access  Private
 */
router.delete('/:id', validate(deleteScheduleSchema), deleteScheduleHandler);

export default router;
