import { Request, Response, NextFunction, RequestHandler } from 'express';
import {
  createMedication,
  updateMedication,
  getMedications,
  getMedicationsById,
  deleteMedication,
  getTodayMedications,
  updateMedicationStock,
  getLowStockMedications,
  getOutOfStockMedications,
} from './medication.service';
import { createMedicationSchedules } from '../schedules/schedules.service';
import {
  medicationQuerySchema,
  medicationSchema,
  partialMedicationSchema,
} from './medication.schemas';
import { ZodError } from 'zod';

/**
 * Handles the request to create a new medication for a specific user.
 *
 * @param req - Express request object containing the medication data and user info
 * @param res - Express response object
 * @param _next - Express next function (not used here)
 * @returns JSON response with the created medication
 */
export const createMedicationHandler: RequestHandler = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const mockUserId = '550e8400-e29b-41d4-a716-446655440000';
    const data = medicationSchema.parse({ ...req.body, userId: mockUserId });

    // if (!userId) {
    //   return res.status(401).json({ error: "Usuário não autenticado" });
    // }

    // Cria o medicamento associando ao userId
    const medication = await createMedication({ ...data, userId: mockUserId });
    const schedules = await createMedicationSchedules(
      medication.id,
      medication.frequency,
      medication.startTime,
      medication.intervalHours
    );

    res.status(201).json({
      message: 'Medicamento criado com sucesso',
      medication,
      schedules,
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: error.errors[0].message });
    }
    res.status(400).json({
      error: error.errors || error.message || 'Erro ao criar medicamento',
    });
  }
};
/**
 * Handles the request to get a paginated list of medications with optional filters.
 *
 * @param {RequestHandler} req - Express request object containing query parameters
 * @param {Response} res - Express response object
 * @param {NextFunction} _next - Express next function (not used here)
 * @returns {Promise<void>} Returns a JSON response with medications and pagination info
 *
 * @throws {500} When an internal server error occurs
 *
 * Expected query parameters:
 * - page: number (optional, page number)
 * - limit: number (optional, items per page)
 * - name, dosage, frequency, expiresAt, stock: filters (optional)
 *
 * Example:
 * ```http
 * GET /medications?page=1&limit=10&name=para
 * ```
 */
export const getMedicationsHandler: RequestHandler = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const query = medicationQuerySchema.parse(req.query);
    const medications = await getMedications(query);
    res.json(medications);
  } catch (error: any) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({
      error: error.message || 'Erro ao buscar medicamentos',
    });
  }
};

/**
 * Handles the request to get a specific medication by its ID.
 *
 * @param {RequestHandler} req - Express request object containing the medication ID
 * @param {Response} res - Express response object
 * @param {NextFunction} _next - Express next function (not used here)
 * @returns {Promise<void>} Returns a JSON response with the medication
 *
 * @throws {404} When the medication is not found
 * @throws {500} When an internal server error occurs
 */
export const getMedicationByIdHandler: RequestHandler = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const { id } = req.params;
    const medication = await getMedicationsById(id);

    if (!medication) {
      return res.status(404).json({ error: 'Medicamento não encontrado' });
    }

    res.json(medication);
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Erro ao buscar medicamento',
    });
  }
};

/**
 * Handles the request to update a medication by ID.
 *
 * @param {RequestHandler} req - Express request object containing the medication ID and update data
 * @param {Response} res - Express response object
 * @param {NextFunction} _next - Express next function (not used here)
 * @returns {Promise<void>} Returns a JSON response with the updated medication
 *
 * @throws {400} When validation fails or update cannot be applied
 *
 * Expected request body:
 * - Any subset of: name, dosage, frequency, expiresAt, stock
 */
export const updateMedicationHandler: RequestHandler = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const { id } = req.params;
    const data = partialMedicationSchema.parse(req.body);

    const medication = await updateMedication(id, data);
    res.json({
      message: 'Medicamento atualizado com sucesso',
      medication,
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: error.errors[0].message });
    }
    res.status(400).json({
      error: error.errors || error.message || 'Erro ao atualizar medicamento',
    });
  }
};

/**
 * Handles the request to delete a medication by ID.
 *
 * @param {RequestHandler} req - Express request object containing the medication ID
 * @param {Response} res - Express response object
 * @param {NextFunction} _next - Express next function (not used here)
 * @returns {Promise<void>} Returns a JSON response confirming deletion
 *
 * @throws {400} When the medication cannot be deleted
 */
export const deleteMedicationHandler: RequestHandler = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const { id } = req.params;
    await deleteMedication(id);
    res.json({ message: 'Medicamento deletado com sucesso' });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'Erro ao deletar medicamento',
    });
  }
};

/**
 * Handles the request to get today's medications for the authenticated user.
 *
 * @param {RequestHandler} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} _next - Express next function (not used here)
 * @returns {Promise<void>} Returns a JSON response with today's medications
 *
 * @throws {401} When user is not authenticated
 * @throws {500} When an internal server error occurs
 */
export const getTodayMedicationsHandler: RequestHandler = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
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

    const medications = await getTodayMedications(userId);
    res.json({
      success: true,
      data: medications,
      message: 'Medicamentos de hoje recuperados com sucesso',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Erro ao buscar medicamentos de hoje',
      },
    });
  }
};

/**
 * Handles the request to update medication stock.
 *
 * @param {RequestHandler} req - Express request object containing medication ID and new stock
 * @param {Response} res - Express response object
 * @param {NextFunction} _next - Express next function (not used here)
 * @returns {Promise<void>} Returns a JSON response with the updated medication
 *
 * @throws {400} When validation fails
 * @throws {404} When medication is not found
 */
export const updateMedicationStockHandler: RequestHandler = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;

    if (typeof stock !== 'number' || stock < 0) {
      return res.status(400).json({ error: 'Estoque deve ser um número não negativo' });
    }

    const medication = await updateMedicationStock(id, stock);
    res.json({
      message: 'Estoque atualizado com sucesso',
      medication,
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'Erro ao atualizar estoque',
    });
  }
};

/**
 * Handles the request to get medications with low stock.
 *
 * @param {RequestHandler} req - Express request object with optional threshold parameter
 * @param {Response} res - Express response object
 * @param {NextFunction} _next - Express next function (not used here)
 * @returns {Promise<void>} Returns a JSON response with low stock medications
 *
 * @throws {401} When user is not authenticated
 */
export const getLowStockMedicationsHandler: RequestHandler = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
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

    const threshold = req.query.threshold ? parseInt(req.query.threshold as string) : 5;
    const medications = await getLowStockMedications(userId, threshold);

    res.json({
      success: true,
      data: medications,
      message: 'Medicamentos com estoque baixo recuperados com sucesso',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Erro ao buscar medicamentos com estoque baixo',
      },
    });
  }
};

/**
 * Handles the request to get medications that are out of stock.
 *
 * @param {RequestHandler} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} _next - Express next function (not used here)
 * @returns {Promise<void>} Returns a JSON response with out of stock medications
 *
 * @throws {401} When user is not authenticated
 */
export const getOutOfStockMedicationsHandler: RequestHandler = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
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

    const medications = await getOutOfStockMedications(userId);

    res.json({
      success: true,
      data: medications,
      message: 'Medicamentos sem estoque recuperados com sucesso',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Erro ao buscar medicamentos sem estoque',
      },
    });
  }
};
