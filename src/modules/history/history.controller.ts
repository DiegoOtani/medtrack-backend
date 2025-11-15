import { Request, Response } from 'express';
import * as historyService from './history.service';
import { CreateHistoryInput } from './history.schemas';

/**
 * GET /api/history
 * Gets history entries for the authenticated user
 */
export const getHistoryByAuthenticatedUserHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Usuário não autenticado',
        },
      });
    }

    const { startDate, endDate, action, limit } = req.query;

    const history = await historyService.getHistoryByUser(userId, {
      startDate: startDate as string,
      endDate: endDate as string,
      action: action as any,
      limit: limit ? Number(limit) : undefined,
    });

    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar histórico',
    });
  }
};

/**
 * POST /api/history
 * Creates a new medication history entry
 */
export const createHistoryHandler = async (req: Request, res: Response) => {
  try {
    const data: CreateHistoryInput = req.body;
    const history = await historyService.createHistory(data);

    return res.status(201).json({
      success: true,
      data: history,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar histórico',
    });
  }
};

/**
 * GET /api/history/medication/:medicationId
 * Gets history entries by medication ID
 */
export const getHistoryByMedicationHandler = async (req: Request, res: Response) => {
  try {
    const { medicationId } = req.params;
    const { startDate, endDate, action, limit } = req.query;

    const history = await historyService.getHistoryByMedication(medicationId, {
      startDate: startDate as string,
      endDate: endDate as string,
      action: action as any,
      limit: limit ? Number(limit) : undefined,
    });

    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar histórico',
    });
  }
};

/**
 * GET /api/history/user/:userId
 * Gets history entries by user ID
 */
export const getHistoryByUserHandler = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, action, limit } = req.query;

    const history = await historyService.getHistoryByUser(userId, {
      startDate: startDate as string,
      endDate: endDate as string,
      action: action as any,
      limit: limit ? Number(limit) : undefined,
    });

    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar histórico',
    });
  }
};

/**
 * GET /api/history/:id
 * Gets a single history entry by ID
 */
export const getHistoryByIdHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const history = await historyService.getHistoryById(id);

    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      error: error instanceof Error ? error.message : 'Histórico não encontrado',
    });
  }
};

/**
 * DELETE /api/history/:id
 * Deletes a history entry
 */
export const deleteHistoryHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await historyService.deleteHistory(id);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao excluir histórico',
    });
  }
};

/**
 * GET /api/history/medication/:medicationId/adherence
 * Gets adherence statistics for a medication
 */
export const getAdherenceStatsHandler = async (req: Request, res: Response) => {
  try {
    const { medicationId } = req.params;
    const { startDate, endDate } = req.query;

    const stats = await historyService.getAdherenceStats(
      medicationId,
      startDate as string,
      endDate as string
    );

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao calcular adesão',
    });
  }
};
