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
import { AutoSchedulerService } from '../schedules/auto-scheduler.service';
import {
  medicationQuerySchema,
  medicationSchema,
  partialMedicationSchema,
} from './medication.schemas';
import { ZodError } from 'zod';

/**
 * @openapi
 * /api/medications:
 *   post:
 *     tags:
 *       - Medications
 *     summary: Cria um novo medicamento
 *     description: |
 *       Cria um novo medicamento no sistema com os horários de administração automáticos.
 *       O sistema automaticamente cria os agendamentos baseados na frequência especificada.
 *       **Nota**: Atualmente usando userId mockado para desenvolvimento.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MedicationCreate'
 *           example:
 *             name: "Paracetamol"
 *             dosage: "500mg"
 *             frequency: "TWICE_A_DAY"
 *             expiresAt: "2024-12-31"
 *             stock: 30
 *             notes: "Tomar com água"
 *             startTime: "08:00"
 *             intervalHours: 8
 *     responses:
 *       201:
 *         description: Medicamento criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Medicamento criado com sucesso"
 *                 medication:
 *                   $ref: '#/components/schemas/MedicationResponse'
 *                 schedules:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       time:
 *                         type: string
 *                       daysOfWeek:
 *                         type: array
 *                         items:
 *                           type: string
 *                       isActive:
 *                         type: boolean
 *             example:
 *               message: "Medicamento criado com sucesso"
 *               medication:
 *                 id: "550e8400-e29b-41d4-a716-446655440000"
 *                 name: "Paracetamol"
 *                 dosage: "500mg"
 *                 frequency: "TWICE_A_DAY"
 *                 expiresAt: "2024-12-31T00:00:00.000Z"
 *                 stock: 30
 *                 notes: "Tomar com água"
 *                 startTime: "08:00"
 *                 intervalHours: 8
 *                 userId: "550e8400-e29b-41d4-a716-446655440000"
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *                 updatedAt: "2024-01-15T10:30:00.000Z"
 *               schedules:
 *                 - id: "660e8400-e29b-41d4-a716-446655440001"
 *                   time: "08:00"
 *                   daysOfWeek: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]
 *                   isActive: true
 *                 - id: "660e8400-e29b-41d4-a716-446655440002"
 *                   time: "20:00"
 *                   daysOfWeek: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]
 *                   isActive: true
 *       400:
 *         description: Erro de validação dos dados
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *             example:
 *               success: false
 *               error: "Erro de validação"
 *               details:
 *                 - field: "name"
 *                   message: "Nome do medicamento é obrigatório"
 *                 - field: "stock"
 *                   message: "Estoque do medicamento deve ser pelo menos 0"
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Erro ao criar medicamento"
 */

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
    // const mockUserId = '550e8400-e29b-41d4-a716-446655440000';
    const data = medicationSchema.parse({ ...req.body, userId });

    // if (!userId) {
    //   return res.status(401).json({ error: "Usuário não autenticado" });
    // }

    // Cria o medicamento associando ao userId
    const medication = await createMedication({ ...data, userId });
    const schedules = await createMedicationSchedules(
      medication.id,
      medication.frequency,
      medication.startTime,
      medication.intervalHours
    );

    // Agendar notificações automaticamente
    try {
      const autoScheduler = new AutoSchedulerService();
      await autoScheduler.scheduleMedicationNotifications(medication.id);
      console.log(`Notificações agendadas automaticamente para medicamento ${medication.id}`);
    } catch (schedulerError) {
      console.error('Erro ao agendar notificações automaticamente:', schedulerError);
      // Não falhar a criação do medicamento por causa do agendamento
    }

    res.status(201).json({
      message: 'Medicamento criado com sucesso',
      medication,
      schedules,
    });
  } catch (error: any) {
    console.error('Erro ao criar medicamento:', error);
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Erro de validação',
        details: error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }
    return res.status(400).json({
      error: error.message || 'Erro ao criar medicamento',
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
 * - userId: string (optional, UUID, filter by user ID)
 * - name: string (optional, partial search, case insensitive)
 * - dosage: string (optional, partial search, case insensitive)
 * - frequency: string (optional, enum: ONE_TIME, TWICE_A_DAY, THREE_TIMES_A_DAY, FOUR_TIMES_A_DAY, EVERY_OTHER_DAY, WEEKLY, MONTHLY, AS_NEEDED, CUSTOM)
 * - expiresAt: date (optional, format YYYY-MM-DD)
 * - stock: number (optional, filter by stock quantity)
 *
 * Example:
 * ```http
 * GET /medications?page=1&limit=10&name=para&frequency=TWICE_A_DAY&stock=30
 * ```
 */
/**
 * @openapi
 * /api/medications:
 *   get:
 *     tags:
 *       - Medications
 *     summary: Lista todos os medicamentos
 *     description: |
 *       Retorna uma lista paginada de todos os medicamentos com suporte a filtros opcionais.
 *       Permite filtrar por nome, dosagem, frequência, data de expiração, estoque e usuário.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número da página para paginação
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Quantidade de itens por página
 *         example: 10
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar medicamentos por ID do usuário
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filtrar medicamentos por nome (busca parcial, case insensitive)
 *         example: "Paracetamol"
 *       - in: query
 *         name: dosage
 *         schema:
 *           type: string
 *         description: Filtrar medicamentos por dosagem (busca parcial, case insensitive)
 *         example: "500mg"
 *       - in: query
 *         name: frequency
 *         schema:
 *           type: string
 *           enum: [ONE_TIME, TWICE_A_DAY, THREE_TIMES_A_DAY, FOUR_TIMES_A_DAY, EVERY_OTHER_DAY, WEEKLY, MONTHLY, AS_NEEDED, CUSTOM]
 *         description: Filtrar medicamentos por frequência
 *         example: "TWICE_A_DAY"
 *       - in: query
 *         name: expiresAt
 *         schema:
 *           type: string
 *           format: date
 *         description: Filtrar medicamentos por data de expiração (formato YYYY-MM-DD)
 *         example: "2024-12-31"
 *       - in: query
 *         name: stock
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Filtrar medicamentos por quantidade em estoque
 *         example: 30
 *     responses:
 *       200:
 *         description: Lista de medicamentos recuperada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MedicationPaginatedResponse'
 *             example:
 *               data:
 *                 - id: "550e8400-e29b-41d4-a716-446655440000"
 *                   name: "Paracetamol"
 *                   dosage: "500mg"
 *                   frequency: "TWICE_A_DAY"
 *                   expiresAt: "2024-12-31T00:00:00.000Z"
 *                   stock: 30
 *                   notes: "Tomar com água"
 *                   startTime: "08:00"
 *                   intervalHours: 8
 *                   userId: "550e8400-e29b-41d4-a716-446655440000"
 *                   createdAt: "2024-01-15T10:30:00.000Z"
 *                   updatedAt: "2024-01-15T10:30:00.000Z"
 *                 - id: "660e8400-e29b-41d4-a716-446655440001"
 *                   name: "Ibuprofeno"
 *                   dosage: "400mg"
 *                   frequency: "AS_NEEDED"
 *                   expiresAt: "2024-11-15T00:00:00.000Z"
 *                   stock: 20
 *                   notes: "Tomar após as refeições"
 *                   startTime: "12:00"
 *                   intervalHours: 6
 *                   userId: "550e8400-e29b-41d4-a716-446655440000"
 *                   createdAt: "2024-01-10T14:20:00.000Z"
 *                   updatedAt: "2024-01-10T14:20:00.000Z"
 *               pagination:
 *                 page: 1
 *                 limit: 10
 *                 total: 2
 *                 totalPages: 1
 *       400:
 *         description: Erro de validação dos parâmetros
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *             example:
 *               success: false
 *               error: "Erro de validação"
 *               details:
 *                 - field: "page"
 *                   message: "Expected number, received string"
 *                 - field: "frequency"
 *                   message: "Invalid enum value. Expected 'TWICE_A_DAY' | 'THREE_TIMES_A_DAY' | ..., received 'INVALID'"
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Erro ao buscar medicamentos"
 */

export const getMedicationsHandler: RequestHandler = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    console.log(`[GetMedications] ===== INÍCIO DA REQUISIÇÃO =====`);
    console.log(`[GetMedications] Request query:`, req.query);
    console.log(`[GetMedications] Request headers:`, req.headers);
    console.log(`[GetMedications] Request user:`, req.user);

    const userId = req.user?.id;
    console.log(`[GetMedications] User ID:`, userId);

    if (!userId) {
      console.log(`[GetMedications] Usuário não autenticado, retornando 401`);
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Usuário não autenticado',
        },
      });
    }

    console.log(`[GetMedications] Parsing query schema...`);
    const query = medicationQuerySchema.partial().parse(req.query);
    console.log(`[GetMedications] Query parsed:`, query);

    // Adicionar filtro de userId para segurança
    console.log(`[GetMedications] Calling getMedications service...`);
    const medications = await getMedications({ ...query, userId });
    console.log(`[GetMedications] Service returned:`, JSON.stringify(medications, null, 2));
    console.log(`[GetMedications] Type of medications:`, typeof medications);
    console.log(`[GetMedications] Medications keys:`, Object.keys(medications));

    const response = {
      success: true,
      data: medications,
      message: 'Medicamentos recuperados com sucesso',
    };
    console.log(`[GetMedications] Response to send:`, JSON.stringify(response, null, 2));

    res.json(response);
    console.log(`[GetMedications] ===== FIM DA REQUISIÇÃO =====`);
  } catch (error: any) {
    console.error(`[GetMedications] ===== ERRO =====`);
    console.error(`[GetMedications] Error:`, error);
    console.error(`[GetMedications] Error stack:`, error.stack);

    if (error instanceof ZodError) {
      console.error(`[GetMedications] Zod validation errors:`, error.errors);
      return res.status(400).json({
        success: false,
        error: 'Erro de validação',
        details: error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    console.error(`[GetMedications] Returning 500 error`);
    return res.status(500).json({
      error: 'Erro ao buscar medicamentos',
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
/**
 * @openapi
 * /api/medications/{id}:
 *   get:
 *     tags:
 *       - Medications
 *     summary: Busca um medicamento por ID
 *     description: |
 *       Retorna os detalhes de um medicamento específico pelo seu ID.
 *       **Nota**: Atualmente usando userId mockado para desenvolvimento.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único do medicamento
 *     responses:
 *       200:
 *         description: Medicamento encontrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MedicationResponse'
 *             example:
 *               id: "550e8400-e29b-41d4-a716-446655440000"
 *               name: "Paracetamol"
 *               dosage: "500mg"
 *               frequency: "TWICE_A_DAY"
 *               expiresAt: "2024-12-31T00:00:00.000Z"
 *               stock: 30
 *               notes: "Tomar com água"
 *               startTime: "08:00"
 *               intervalHours: 8
 *               userId: "550e8400-e29b-41d4-a716-446655440000"
 *               createdAt: "2024-01-15T10:30:00.000Z"
 *               updatedAt: "2024-01-15T10:30:00.000Z"
 *       400:
 *         description: ID inválido fornecido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "ID inválido"
 *       404:
 *         description: Medicamento não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Medicamento não encontrado"
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Erro ao buscar medicamento"
 */

export const getMedicationByIdHandler: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
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

    const medication = await getMedicationsById(id);

    if (!medication) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Medicamento não encontrado',
        },
      });
    }

    // Verificar se o medicamento pertence ao usuário
    if (medication.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Você não tem permissão para acessar este medicamento',
        },
      });
    }

    return res.json({
      success: true,
      data: medication,
      message: 'Medicamento encontrado com sucesso',
    });
  } catch (error: any) {
    console.error(`[GetMedicationById] Erro ao buscar medicamento:`, error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro ao buscar medicamento',
      },
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
/**
 * @openapi
 * /api/medications/{id}:
 *   put:
 *     tags:
 *       - Medications
 *     summary: Atualiza um medicamento existente
 *     description: |
 *       Atualiza as informações de um medicamento existente pelo seu ID.
 *       Todos os campos são opcionais, apenas os fornecidos serão atualizados.
 *       **Nota**: Atualmente usando userId mockado para desenvolvimento.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único do medicamento a ser atualizado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MedicationUpdate'
 *           example:
 *             name: "Paracetamol 750mg"
 *             dosage: "750mg"
 *             stock: 45
 *             notes: "Tomar com água em jejum"
 *     responses:
 *       200:
 *         description: Medicamento atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Medicamento atualizado com sucesso"
 *                 medication:
 *                   $ref: '#/components/schemas/MedicationResponse'
 *             example:
 *               message: "Medicamento atualizado com sucesso"
 *               medication:
 *                 id: "550e8400-e29b-41d4-a716-446655440000"
 *                 name: "Paracetamol 750mg"
 *                 dosage: "750mg"
 *                 frequency: "TWICE_A_DAY"
 *                 expiresAt: "2024-12-31T00:00:00.000Z"
 *                 stock: 45
 *                 notes: "Tomar com água em jejum"
 *                 startTime: "08:00"
 *                 intervalHours: 8
 *                 userId: "550e8400-e29b-41d4-a716-446655440000"
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *                 updatedAt: "2024-01-20T15:45:00.000Z"
 *       400:
 *         description: Erro de validação dos dados ou ID inválido
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ValidationError'
 *                 - $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               validationError:
 *                 value:
 *                   success: false
 *                   error: "Erro de validação"
 *                   details:
 *                     - field: "stock"
 *                       message: "Estoque do medicamento deve ser pelo menos 0"
 *               invalidId:
 *                 value:
 *                   error: "ID inválido"
 *       404:
 *         description: Medicamento não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Medicamento não encontrado"
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Erro ao atualizar medicamento"
 */

export const updateMedicationHandler: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log(`[UpdateMedication] Request body raw:`, req.body);
  console.log(`[UpdateMedication] Request headers:`, req.headers);

  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const rawData = req.body;

    console.log(`[UpdateMedication] Tentando atualizar medicamento: ${id}`);
    console.log(`[UpdateMedication] User autenticado:`, userId);
    console.log(`[UpdateMedication] Dados recebidos:`, JSON.stringify(rawData, null, 2));

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Usuário não autenticado',
        },
      });
    }

    const data = partialMedicationSchema.parse(rawData);
    console.log(`[UpdateMedication] Dados após validação:`, JSON.stringify(data, null, 2));

    // Validação adicional: data de validade deve ser futura
    if (data.expiresAt && data.expiresAt <= new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Erro de validação',
        details: [
          {
            field: 'expiresAt',
            message: 'Data de validade deve ser futura',
          },
        ],
      });
    }

    // Verificar se o medicamento existe e pertence ao usuário
    const existingMedication = await getMedicationsById(id);
    if (!existingMedication) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Medicamento não encontrado',
        },
      });
    }

    // Verificar se o medicamento pertence ao usuário
    if (existingMedication.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Você não tem permissão para atualizar este medicamento',
        },
      });
    }

    console.log(
      `[UpdateMedication] Medicamento existente:`,
      JSON.stringify(existingMedication, null, 2)
    );

    const medication = await updateMedication(id, data);
    console.log(
      `[UpdateMedication] Medicamento atualizado com sucesso:`,
      JSON.stringify(medication, null, 2)
    );

    // Reagendar notificações se campos relevantes foram alterados
    const relevantFieldsChanged = data.frequency || data.startTime || data.intervalHours;
    if (relevantFieldsChanged) {
      try {
        const autoScheduler = new AutoSchedulerService();
        await autoScheduler.rescheduleMedicationNotifications(medication.id);
        console.log(
          `[UpdateMedication] Notificações reagendadas para medicamento ${medication.id}`
        );
      } catch (schedulerError) {
        console.error('[UpdateMedication] Erro ao reagendar notificações:', schedulerError);
        // Não falhar a atualização por causa do reagendamento
      }
    }

    res.json({
      success: true,
      message: 'Medicamento atualizado com sucesso',
      medication,
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      console.error(`[UpdateMedication] Erro de validação Zod:`, error.errors);
      return res.status(400).json({
        success: false,
        error: 'Erro de validação',
        details: error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }
    console.error(`[UpdateMedication] Erro ao atualizar:`, error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.errors || 'Erro ao atualizar medicamento',
      },
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
/**
 * @openapi
 * /api/medications/{id}:
 *   delete:
 *     tags:
 *       - Medications
 *     summary: Remove um medicamento
 *     description: |
 *       Remove permanentemente um medicamento do sistema pelo seu ID.
 *       **Nota**: Atualmente usando userId mockado para desenvolvimento.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único do medicamento a ser removido
 *     responses:
 *       200:
 *         description: Medicamento removido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Medicamento removido com sucesso"
 *             example:
 *               message: "Medicamento removido com sucesso"
 *       400:
 *         description: ID inválido fornecido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "ID inválido"
 *       404:
 *         description: Medicamento não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Medicamento não encontrado"
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Erro ao remover medicamento"
 */

export const deleteMedicationHandler: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    console.log(`[DeleteMedication] Tentando deletar medicamento: ${id}`);
    console.log(`[DeleteMedication] User autenticado:`, userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Usuário não autenticado',
        },
      });
    }

    // Verificar se o medicamento existe e pertence ao usuário
    const medication = await getMedicationsById(id);
    if (!medication) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Medicamento não encontrado',
        },
      });
    }

    // Verificar se o medicamento pertence ao usuário
    if (medication.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Você não tem permissão para deletar este medicamento',
        },
      });
    }

    const result = await deleteMedication(id);
    console.log(`[DeleteMedication] Medicamento deletado com sucesso:`, result);

    return res.json({
      success: true,
      message: 'Medicamento deletado com sucesso',
    });
  } catch (error: any) {
    console.error(`[DeleteMedication] Erro ao deletar:`, error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro ao deletar medicamento',
      },
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
    const userId = req.user?.id;

    console.log(`[UpdateStock] Tentando atualizar estoque do medicamento: ${id}`);
    console.log(`[UpdateStock] User autenticado:`, userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Usuário não autenticado',
        },
      });
    }

    if (typeof stock !== 'number' || stock < 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Estoque deve ser um número não negativo',
        },
      });
    }

    // Verificar se o medicamento existe e pertence ao usuário
    const existingMedication = await getMedicationsById(id);
    if (!existingMedication) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Medicamento não encontrado',
        },
      });
    }

    // Verificar se o medicamento pertence ao usuário
    if (existingMedication.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Você não tem permissão para atualizar este medicamento',
        },
      });
    }

    const medication = await updateMedicationStock(id, stock);
    console.log(`[UpdateStock] Estoque atualizado com sucesso`);

    res.json({
      success: true,
      message: 'Estoque atualizado com sucesso',
      medication,
    });
  } catch (error: any) {
    console.error(`[UpdateStock] Erro ao atualizar estoque:`, error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Erro ao atualizar estoque',
      },
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
