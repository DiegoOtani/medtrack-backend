import { Request, Response } from 'express';
import * as schedulesService from './schedules.service';
import {
  CreateCustomScheduleInput,
  UpdateScheduleInput,
} from './schedules.schemas';

/**
 * GET /api/schedules/medication/:medicationId
 * Gets all schedules for a medication
 */
export const getSchedulesByMedicationHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const { medicationId } = req.params;
    const { isActive } = req.query;

    const schedules = await schedulesService.getSchedulesByMedication(
      medicationId,
      isActive === 'true' ? true : isActive === 'false' ? false : undefined
    );

    return res.status(200).json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error:
        error instanceof Error ? error.message : 'Erro ao buscar agendamentos',
    });
  }
};

/**
 * GET /api/schedules/user/:userId
 * Gets all schedules for a user's medications
 */
export const getSchedulesByUserHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.query;

    const schedules = await schedulesService.getSchedulesByUser(
      userId,
      isActive === 'true' ? true : isActive === 'false' ? false : undefined
    );

    return res.status(200).json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error:
        error instanceof Error ? error.message : 'Erro ao buscar agendamentos',
    });
  }
};

/**
 * GET /api/schedules/:id
 * Gets a single schedule by ID
 */
export const getScheduleByIdHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const schedule = await schedulesService.getScheduleById(id);

    return res.status(200).json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      error:
        error instanceof Error ? error.message : 'Agendamento não encontrado',
    });
  }
};

/**
 * POST /api/schedules
 * Creates a custom schedule
 */
export const createCustomScheduleHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const data: CreateCustomScheduleInput = req.body;
    const schedule = await schedulesService.createCustomSchedule(data);

    return res.status(201).json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error:
        error instanceof Error ? error.message : 'Erro ao criar agendamento',
    });
  }
};

/**
 * PATCH /api/schedules/:id
 * Updates a schedule
 */
export const updateScheduleHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data: UpdateScheduleInput['body'] = req.body;
    const schedule = await schedulesService.updateSchedule(id, data);

    return res.status(200).json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Erro ao atualizar agendamento',
    });
  }
};

/**
 * PATCH /api/schedules/:id/toggle
 * Toggles a schedule's active status
 */
export const toggleScheduleHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const schedule = await schedulesService.toggleSchedule(id);

    return res.status(200).json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error:
        error instanceof Error ? error.message : 'Erro ao alternar agendamento',
    });
  }
};

/**
 * DELETE /api/schedules/:id
 * Deletes a schedule
 */
export const deleteScheduleHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await schedulesService.deleteSchedule(id);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      error:
        error instanceof Error ? error.message : 'Erro ao excluir agendamento',
    });
  }
};
