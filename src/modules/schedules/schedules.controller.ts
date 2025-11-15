/**
 * @openapi
 * /api/schedules/medication/{medicationId}:
 *   get:
 *     tags:
 *       - Schedules
 *     summary: Busca agendamentos por ID do medicamento
 *     description: |
 *       Retorna todos os agendamentos de um medicamento específico.
 *       Permite filtrar por status de ativação (ativo/inativo).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: medicationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único do medicamento
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filtrar por status de ativação (true para ativos, false para inativos)
 *         example: true
 *     responses:
 *       200:
 *         description: Lista de agendamentos recuperada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ScheduleResponse'
 *             example:
 *               success: true
 *               data:
 *                 - id: "660e8400-e29b-41d4-a716-446655440001"
 *                   medicationId: "550e8400-e29b-41d4-a716-446655440000"
 *                   time: "08:00"
 *                   daysOfWeek: ["MONDAY", "WEDNESDAY", "FRIDAY"]
 *                   isActive: true
 *                   createdAt: "2024-01-15T10:30:00.000Z"
 *                   updatedAt: "2024-01-20T14:45:00.000Z"
 *                   medication:
 *                     id: "550e8400-e29b-41d4-a716-446655440000"
 *                     name: "Paracetamol"
 *                     dosage: "500mg"
 *                 - id: "770e8400-e29b-41d4-a716-446655440002"
 *                   medicationId: "550e8400-e29b-41d4-a716-446655440000"
 *                   time: "20:00"
 *                   daysOfWeek: ["MONDAY", "WEDNESDAY", "FRIDAY"]
 *                   isActive: true
 *                   createdAt: "2024-01-15T10:30:00.000Z"
 *                   updatedAt: "2024-01-20T14:45:00.000Z"
 *                   medication:
 *                     id: "550e8400-e29b-41d4-a716-446655440000"
 *                     name: "Paracetamol"
 *                     dosage: "500mg"
 *       400:
 *         description: Erro na requisição - ID inválido ou parâmetros inválidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "ID do medicamento inválido"
 */

/**
 * @openapi
 * /api/schedules/user/{userId}:
 *   get:
 *     tags:
 *       - Schedules
 *     summary: Busca agendamentos por ID do usuário
 *     description: |
 *       Retorna todos os agendamentos de medicamentos de um usuário específico.
 *       Permite filtrar por status de ativação e incluir informações dos medicamentos.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único do usuário
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filtrar por status de ativação (true para ativos, false para inativos)
 *         example: true
 *       - in: query
 *         name: includeMedications
 *         schema:
 *           type: boolean
 *         description: Incluir informações completas dos medicamentos nos resultados
 *         example: true
 *     responses:
 *       200:
 *         description: Lista de agendamentos recuperada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ScheduleResponse'
 *             example:
 *               success: true
 *               data:
 *                 - id: "660e8400-e29b-41d4-a716-446655440001"
 *                   medicationId: "550e8400-e29b-41d4-a716-446655440000"
 *                   time: "08:00"
 *                   daysOfWeek: ["MONDAY", "WEDNESDAY", "FRIDAY"]
 *                   isActive: true
 *                   createdAt: "2024-01-15T10:30:00.000Z"
 *                   updatedAt: "2024-01-20T14:45:00.000Z"
 *                   medication:
 *                     id: "550e8400-e29b-41d4-a716-446655440000"
 *                     name: "Paracetamol"
 *                     dosage: "500mg"
 *                     stock: 30
 *                     minStock: 5
 *                 - id: "770e8400-e29b-41d4-a716-446655440002"
 *                   medicationId: "551e8400-e29b-41d4-a716-446655440001"
 *                   time: "14:00"
 *                   daysOfWeek: ["TUESDAY", "THURSDAY"]
 *                   isActive: false
 *                   createdAt: "2024-01-16T09:15:00.000Z"
 *                   updatedAt: "2024-01-25T16:20:00.000Z"
 *                   medication:
 *                     id: "551e8400-e29b-41d4-a716-446655440001"
 *                     name: "Ibuprofeno"
 *                     dosage: "200mg"
 *                     stock: 15
 *                     minStock: 3
 *       400:
 *         description: Erro na requisição - ID inválido ou parâmetros inválidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "ID do usuário inválido"
 */

/**
 * @openapi
 * /api/schedules:
 *   post:
 *     tags:
 *       - Schedules
 *     summary: Cria um novo agendamento personalizado
 *     description: |
 *       Cria um novo agendamento personalizado para um medicamento específico.
 *       Permite definir horário, dias da semana e status de ativação do agendamento.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ScheduleCreate'
 *           example:
 *             medicationId: "550e8400-e29b-41d4-a716-446655440000"
 *             time: "08:30"
 *             daysOfWeek: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]
 *             isActive: true
 *     responses:
 *       201:
 *         description: Agendamento criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Agendamento criado com sucesso"
 *                 data:
 *                   $ref: '#/components/schemas/ScheduleResponse'
 *             example:
 *               success: true
 *               message: "Agendamento criado com sucesso"
 *               data:
 *                 id: "880e8400-e29b-41d4-a716-446655440003"
 *                 medicationId: "550e8400-e29b-41d4-a716-446655440000"
 *                 time: "08:30"
 *                 daysOfWeek: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]
 *                 isActive: true
 *                 createdAt: "2024-01-26T10:30:00.000Z"
 *                 updatedAt: "2024-01-26T10:30:00.000Z"
 *                 medication:
 *                   id: "550e8400-e29b-41d4-a716-446655440000"
 *                   name: "Paracetamol"
 *                   dosage: "500mg"
 *       400:
 *         description: Erro na requisição - Dados inválidos ou medicamento não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Medicamento não encontrado"
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Erro ao criar agendamento"
 */

/**
 * @openapi
 * /api/schedules/{id}:
 *   get:
 *     tags:
 *       - Schedules
 *     summary: Busca agendamento por ID
 *     description: |
 *       Retorna os detalhes de um agendamento específico pelo seu ID único.
 *       Inclui informações completas do medicamento associado.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único do agendamento
 *     responses:
 *       200:
 *         description: Agendamento encontrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ScheduleResponse'
 *             example:
 *               success: true
 *               data:
 *                 id: "660e8400-e29b-41d4-a716-446655440001"
 *                 medicationId: "550e8400-e29b-41d4-a716-446655440000"
 *                 time: "08:00"
 *                 daysOfWeek: ["MONDAY", "WEDNESDAY", "FRIDAY"]
 *                 isActive: true
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *                 updatedAt: "2024-01-20T14:45:00.000Z"
 *                 medication:
 *                   id: "550e8400-e29b-41d4-a716-446655440000"
 *                   name: "Paracetamol"
 *                   dosage: "500mg"
 *                   stock: 30
 *                   minStock: 5
 *                   description: "Analgésico e antitérmico"
 *       400:
 *         description: Erro na requisição - ID inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "ID inválido"
 *       404:
 *         description: Agendamento não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Agendamento não encontrado"
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Erro ao buscar agendamento"
 */

/**
 * @openapi
 * /api/schedules/{id}:
 *   patch:
 *     tags:
 *       - Schedules
 *     summary: Atualiza um agendamento existente
 *     description: |
 *       Atualiza as informações de um agendamento existente.
 *       Permite modificar horário, dias da semana e status de ativação.
 *       Todos os campos são opcionais - apenas os fornecidos serão atualizados.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único do agendamento a ser atualizado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ScheduleUpdate'
 *           examples:
 *             updateTime:
 *               summary: Atualizar apenas o horário
 *               value:
 *                 time: "09:00"
 *             updateDays:
 *               summary: Atualizar apenas os dias da semana
 *               value:
 *                 daysOfWeek: ["MONDAY", "WEDNESDAY", "FRIDAY"]
 *             updateAll:
 *               summary: Atualizar múltiplos campos
 *               value:
 *                 time: "20:00"
 *                 daysOfWeek: ["TUESDAY", "THURSDAY"]
 *                 isActive: false
 *     responses:
 *       200:
 *         description: Agendamento atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Agendamento atualizado com sucesso"
 *                 data:
 *                   $ref: '#/components/schemas/ScheduleResponse'
 *             example:
 *               success: true
 *               message: "Agendamento atualizado com sucesso"
 *               data:
 *                 id: "660e8400-e29b-41d4-a716-446655440001"
 *                 medicationId: "550e8400-e29b-41d4-a716-446655440000"
 *                 time: "09:00"
 *                 daysOfWeek: ["MONDAY", "WEDNESDAY", "FRIDAY"]
 *                 isActive: true
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *                 updatedAt: "2024-01-26T15:20:00.000Z"
 *                 medication:
 *                   id: "550e8400-e29b-41d4-a716-446655440000"
 *                   name: "Paracetamol"
 *                   dosage: "500mg"
 *       400:
 *         description: Erro na requisição - ID inválido ou dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "ID inválido ou dados inválidos"
 *       404:
 *         description: Agendamento não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Agendamento não encontrado"
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Erro ao atualizar agendamento"
 */

/**
 * @openapi
 * /api/schedules/{id}/toggle:
 *   patch:
 *     tags:
 *       - Schedules
 *     summary: Alterna o status de ativação de um agendamento
 *     description: |
 *       Alterna o status de ativação de um agendamento entre ativo (true) e inativo (false).
 *       Se o agendamento estiver ativo, será desativado; se estiver inativo, será ativado.
 *       Retorna o agendamento atualizado com o novo status.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único do agendamento a ter seu status alternado
 *     responses:
 *       200:
 *         description: Status do agendamento alternado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Agendamento ativado com sucesso"
 *                 data:
 *                   $ref: '#/components/schemas/ScheduleResponse'
 *             examples:
 *               activated:
 *                 summary: Agendamento ativado
 *                 value:
 *                   success: true
 *                   message: "Agendamento ativado com sucesso"
 *                   data:
 *                     id: "660e8400-e29b-41d4-a716-446655440001"
 *                     medicationId: "550e8400-e29b-41d4-a716-446655440000"
 *                     time: "08:00"
 *                     daysOfWeek: ["MONDAY", "WENDESDAY", "FRIDAY"]
 *                     isActive: true
 *                     createdAt: "2024-01-15T10:30:00.000Z"
 *                     updatedAt: "2024-01-26T16:45:00.000Z"
 *                     medication:
 *                       id: "550e8400-e29b-41d4-a716-446655440000"
 *                       name: "Paracetamol"
 *                       dosage: "500mg"
 *               deactivated:
 *                 summary: Agendamento desativado
 *                 value:
 *                   success: true
 *                   message: "Agendamento desativado com sucesso"
 *                   data:
 *                     id: "770e8400-e29b-41d4-a716-446655440002"
 *                     medicationId: "551e8400-e29b-41d4-a716-446655440001"
 *                     time: "14:00"
 *                     daysOfWeek: ["TUESDAY", "THURSDAY"]
 *                     isActive: false
 *                     createdAt: "2024-01-16T09:15:00.000Z"
 *                     updatedAt: "2024-01-26T16:45:00.000Z"
 *                     medication:
 *                       id: "551e8400-e29b-41d4-a716-446655440001"
 *                       name: "Ibuprofeno"
 *                       dosage: "200mg"
 *       400:
 *         description: Erro na requisição - ID inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "ID inválido"
 *       404:
 *         description: Agendamento não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Agendamento não encontrado"
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Erro ao alternar status do agendamento"
 */

/**
 * @openapi
 * /api/schedules/{id}:
 *   delete:
 *     tags:
 *       - Schedules
 *     summary: Remove um agendamento
 *     description: |
 *       Remove permanentemente um agendamento do sistema.
 *       Esta operação não pode ser desfeita e o agendamento será completamente excluído.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único do agendamento a ser removido
 *     responses:
 *       200:
 *         description: Agendamento removido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Agendamento removido com sucesso"
 *             example:
 *               success: true
 *               message: "Agendamento removido com sucesso"
 *       400:
 *         description: Erro na requisição - ID inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "ID inválido"
 *       404:
 *         description: Agendamento não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Agendamento não encontrado"
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Erro ao remover agendamento"
 */

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
