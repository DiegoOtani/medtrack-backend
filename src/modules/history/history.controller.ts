/**
 * @openapi
 * /api/history:
 *   post:
 *     tags:
 *       - History
 *     summary: Cria um novo registro de histórico
 *     description: |
 *       Cria um novo registro no histórico de medicamentos, registrando ações como
 *       tomar, pular, perder, descartar ou reabastecer medicamentos.
 *       O sistema automaticamente atualiza o estoque do medicamento quando necessário.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HistoryCreate'
 *           example:
 *             medicationId: "550e8400-e29b-41d4-a716-446655440000"
 *             action: "TAKEN"
 *             quantity: 2
 *             notes: "Tomado com água conforme recomendado"
 *             scheduledFor: "2024-01-15T08:00:00.000Z"
 *             scheduleId: "660e8400-e29b-41d4-a716-446655440001"
 *     responses:
 *       201:
 *         description: Registro de histórico criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/HistoryResponse'
 *             example:
 *               success: true
 *               data:
 *                 id: "770e8400-e29b-41d4-a716-446655440002"
 *                 medicationId: "550e8400-e29b-41d4-a716-446655440000"
 *                 action: "TAKEN"
 *                 quantity: 2
 *                 notes: "Tomado com água conforme recomendado"
 *                 scheduledFor: "2024-01-15T08:00:00.000Z"
 *                 scheduleId: "660e8400-e29b-41d4-a716-446655440001"
 *                 createdAt: "2024-01-15T08:15:00.000Z"
 *                 medication:
 *                   id: "550e8400-e29b-41d4-a716-446655440000"
 *                   name: "Paracetamol"
 *                   dosage: "500mg"
 *       400:
 *         description: Erro na requisição - medicamento não encontrado ou dados inválidos
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
 *       401:
 *         description: Token de acesso não fornecido ou inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingToken:
 *                 value:
 *                   error: "Token de acesso necessário"
 *               invalidToken:
 *                 value:
 *                   error: "Token inválido"
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

import { Request, Response } from 'express';
import * as historyService from './history.service';
import { CreateHistoryInput } from './history.schemas';

/**
 * Interface for history item returned by Prisma with medication relation
 */
interface HistoryWithMedication {
  id: string;
  medicationId: string;
  scheduleId: string | null;
  scheduledFor: Date | null;
  action: string;
  quantity: number | null;
  notes: string | null;
  createdAt: Date;
  medication: {
    id: string;
    name: string;
    dosage: string;
  } | null;
}

/**
 * @openapi
 * /api/history/me:
 *   get:
 *     tags:
 *       - History
 *     summary: Busca histórico do usuário autenticado
 *     description: |
 *       Retorna o histórico de medicamentos do usuário atualmente autenticado.
 *       Permite filtrar por período (startDate e endDate) e retorna dados formatados para o frontend.
 *       Inclui informações sobre medicamentos tomados, adiados, pulados ou perdidos.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Data de início do período (ISO 8601)
 *         example: "2025-11-01T00:00:00.000Z"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Data de fim do período (ISO 8601)
 *         example: "2025-11-30T23:59:59.999Z"
 *     responses:
 *       200:
 *         description: Histórico retornado com sucesso
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       scheduleId:
 *                         type: string
 *                         format: uuid
 *                       medicationName:
 *                         type: string
 *                         example: "Paracetamol"
 *                       dosage:
 *                         type: string
 *                         example: "500mg"
 *                       scheduledTime:
 *                         type: string
 *                         format: date-time
 *                       status:
 *                         type: string
 *                         enum: [taken, postponed, skipped, missed]
 *                         description: Status mapeado da ação
 *                       confirmedAt:
 *                         type: string
 *                         format: date-time
 *                         description: Quando foi confirmado (apenas se status=taken)
 *                       postponedTo:
 *                         type: string
 *                         format: date-time
 *                         description: Para quando foi adiado (apenas se status=postponed)
 *             example:
 *               success: true
 *               data:
 *                 - id: "770e8400-e29b-41d4-a716-446655440002"
 *                   scheduleId: "660e8400-e29b-41d4-a716-446655440001"
 *                   medicationName: "Paracetamol"
 *                   dosage: "500mg"
 *                   scheduledTime: "2025-11-22T08:00:00.000Z"
 *                   status: "taken"
 *                   confirmedAt: "2025-11-22T08:05:00.000Z"
 *       400:
 *         description: Erro ao buscar histórico
 *       401:
 *         description: Usuário não autenticado
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

    const { startDate, endDate } = req.query;

    const history = await historyService.getHistoryByUser(userId, {
      startDate: startDate as string,
      endDate: endDate as string,
      limit: 100, // Limitar para não sobrecarregar
    });

    // Mapear dados do Prisma para o formato esperado pelo frontend
    const formattedHistory = history.map((item: HistoryWithMedication) => ({
      id: item.id,
      scheduleId: item.scheduleId || '',
      medicationName: item.medication?.name || 'Medicamento desconhecido',
      dosage: item.medication?.dosage || '',
      scheduledTime:
        item.scheduledFor?.toISOString() ||
        item.createdAt?.toISOString() ||
        new Date().toISOString(),
      status: mapActionToStatus(item.action),
      confirmedAt: item.action === 'TAKEN' ? item.createdAt?.toISOString() : undefined,
      postponedTo: item.action === 'POSTPONED' ? item.scheduledFor?.toISOString() : undefined,
    }));

    return res.status(200).json({
      success: true,
      data: formattedHistory,
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
    console.error(`[createHistoryHandler] Error: ${error}`);
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar histórico',
    });
  }
};

/**
 * @openapi
 * /api/history/medication/{medicationId}:
 *   get:
 *     tags:
 *       - History
 *     summary: Busca histórico por ID do medicamento
 *     description: |
 *       Retorna os registros de histórico para um medicamento específico.
 *       Permite filtrar por data, tipo de ação e limitar a quantidade de resultados.
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
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Data inicial para filtro (formato ISO 8601)
 *         example: "2024-01-01T00:00:00.000Z"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Data final para filtro (formato ISO 8601)
 *         example: "2024-01-31T23:59:59.999Z"
 *       - in: query
 *         name: action
 *         schema:
 *           $ref: '#/components/schemas/HistoryAction'
 *         description: Filtrar por tipo de ação específica
 *         example: "TAKEN"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 100
 *         description: Limite de registros a retornar
 *         example: 50
 *     responses:
 *       200:
 *         description: Lista de histórico recuperada com sucesso
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
 *                     $ref: '#/components/schemas/HistoryResponse'
 *             example:
 *               success: true
 *               data:
 *                 - id: "770e8400-e29b-41d4-a716-446655440002"
 *                   medicationId: "550e8400-e29b-41d4-a716-446655440000"
 *                   action: "TAKEN"
 *                   quantity: 2
 *                   notes: "Tomado com água"
 *                   scheduledFor: "2024-01-15T08:00:00.000Z"
 *                   scheduleId: "660e8400-e29b-41d4-a716-446655440001"
 *                   createdAt: "2024-01-15T08:15:00.000Z"
 *                   medication:
 *                     id: "550e8400-e29b-41d4-a716-446655440000"
 *                     name: "Paracetamol"
 *                     dosage: "500mg"
 *                 - id: "880e8400-e29b-41d4-a716-446655440003"
 *                   medicationId: "550e8400-e29b-41d4-a716-446655440000"
 *                   action: "SKIPPED"
 *                   quantity: null
 *                   notes: "Pulado por recomendação médica"
 *                   scheduledFor: "2024-01-15T20:00:00.000Z"
 *                   scheduleId: "660e8400-e29b-41d4-a716-446655440002"
 *                   createdAt: "2024-01-15T20:30:00.000Z"
 *                   medication:
 *                     id: "550e8400-e29b-41d4-a716-446655440000"
 *                     name: "Paracetamol"
 *                     dosage: "500mg"
 *       400:
 *         description: Erro na requisição - ID inválido ou parâmetros de consulta inválidos
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
 *       401:
 *         description: Token de acesso não fornecido ou inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingToken:
 *                 value:
 *                   error: "Token de acesso necessário"
 *               invalidToken:
 *                 value:
 *                   error: "Token inválido"
 */

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
 * @openapi
 * /api/history/medication/{medicationId}/adherence:
 *   get:
 *     tags:
 *       - History
 *     summary: Calcula estatísticas de adesão do medicamento
 *     description: |
 *       Calcula e retorna estatísticas de adesão para um medicamento específico,
 *       incluindo taxa de adesão, total de ações e distribuição por tipo de ação.
 *       Considera apenas as ações TAKEN, SKIPPED e MISSED para o cálculo.
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
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Data inicial para o cálculo (formato ISO 8601)
 *         example: "2024-01-01T00:00:00.000Z"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Data final para o cálculo (formato ISO 8601)
 *         example: "2024-01-31T23:59:59.999Z"
 *     responses:
 *       200:
 *         description: Estatísticas de adesão calculadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AdherenceStats'
 *             example:
 *               success: true
 *               data:
 *                 total: 30
 *                 taken: 25
 *                 skipped: 3
 *                 missed: 2
 *                 adherenceRate: "83.33"
 *       400:
 *         description: Erro na requisição - ID inválido ou parâmetros de consulta inválidos
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
 *                   example: "Erro ao calcular adesão"
 *       401:
 *         description: Token de acesso não fornecido ou inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingToken:
 *                 value:
 *                   error: "Token de acesso necessário"
 *               invalidToken:
 *                 value:
 *                   error: "Token inválido"
 */

/**
 * @openapi
 * /api/history/user/{userId}:
 *   get:
 *     tags:
 *       - History
 *     summary: Lista histórico de ações do usuário
 *     description: |
 *       Retorna o histórico completo de ações de medicação de um usuário específico.
 *       Permite filtrar por intervalo de datas, tipo de ação e paginação.
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
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Data inicial para filtrar o histórico (formato ISO 8601)
 *         example: "2024-01-01T00:00:00.000Z"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Data final para filtrar o histórico (formato ISO 8601)
 *         example: "2024-01-31T23:59:59.999Z"
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [TAKEN, SKIPPED, MISSED, STOCK_UPDATED]
 *         description: Tipo de ação para filtrar o histórico
 *         example: "TAKEN"
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
 *           default: 20
 *         description: Número de itens por página
 *         example: 20
 *     responses:
 *       200:
 *         description: Histórico recuperado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/HistoryPaginatedResponse'
 *             example:
 *               success: true
 *               data:
 *                 items:
 *                   - id: "550e8400-e29b-41d4-a716-446655440001"
 *                     medicationId: "550e8400-e29b-41d4-a716-446655440002"
 *                     userId: "550e8400-e29b-41d4-a716-446655440003"
 *                     action: "TAKEN"
 *                     quantity: 1
 *                     scheduledFor: "2024-01-15T08:00:00.000Z"
 *                     notes: "Tomado conforme agendado"
 *                     createdAt: "2024-01-15T08:15:23.456Z"
 *                     medication:
 *                       id: "550e8400-e29b-41d4-a716-446655440002"
 *                       name: "Paracetamol 500mg"
 *                       dosage: "1 comprimido"
 *                       frequency: "DAILY"
 *                 total: 1
 *                 page: 1
 *                 limit: 20
 *                 totalPages: 1
 *       400:
 *         description: Erro na requisição - ID inválido ou parâmetros de consulta inválidos
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
 *                   example: "Erro ao buscar histórico"
 *       401:
 *         description: Token de acesso não fornecido ou inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingToken:
 *                 value:
 *                   error: "Token de acesso necessário"
 *               invalidToken:
 *                 value:
 *                   error: "Token inválido"
 */

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
 * @openapi
 * /api/history/{id}:
 *   get:
 *     tags:
 *       - History
 *     summary: Obtém um registro de histórico específico
 *     description: |
 *       Retorna os detalhes completos de um registro de histórico específico
 *       através do seu ID único, incluindo informações do medicamento relacionado.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único do registro de histórico
 *     responses:
 *       200:
 *         description: Registro de histórico encontrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/HistoryResponse'
 *             example:
 *               success: true
 *               data:
 *                 id: "550e8400-e29b-41d4-a716-446655440001"
 *                 medicationId: "550e8400-e29b-41d4-a716-446655440002"
 *                 userId: "550e8400-e29b-41d4-a716-446655440003"
 *                 action: "TAKEN"
 *                 quantity: 1
 *                 scheduleId: "550e8400-e29b-41d4-a716-446655440004"
 *                 scheduledFor: "2024-01-15T08:00:00.000Z"
 *                 notes: "Tomado conforme agendado"
 *                 createdAt: "2024-01-15T08:15:23.456Z"
 *                 medication:
 *                   id: "550e8400-e29b-41d4-a716-446655440002"
 *                   name: "Paracetamol 500mg"
 *                   dosage: "1 comprimido"
 *                   frequency: "DAILY"
 *                   stock: 28
 *                   instructions: "Tomar com água"
 *                   userId: "550e8400-e29b-41d4-a716-446655440003"
 *                   createdAt: "2024-01-01T10:00:00.000Z"
 *                   updatedAt: "2024-01-15T08:15:23.456Z"
 *       400:
 *         description: Erro na requisição - ID inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "ID inválido"
 *       401:
 *         description: Token de acesso não fornecido ou inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingToken:
 *                 value:
 *                   error: "Token de acesso necessário"
 *               invalidToken:
 *                 value:
 *                   error: "Token inválido"
 *       404:
 *         description: Registro de histórico não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Registro de histórico não encontrado"
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Erro ao buscar registro de histórico"
 */

/**
 * GET /api/history/:id
 * Gets a specific history entry by ID
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
 * @openapi
 * /api/history/{id}:
 *   delete:
 *     tags:
 *       - History
 *     summary: Remove um registro de histórico
 *     description: |
 *       Remove permanentemente um registro de histórico do sistema.
 *       Esta operação é irreversível e deve ser usada com cautela.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único do registro de histórico a ser removido
 *     responses:
 *       200:
 *         description: Registro de histórico removido com sucesso
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
 *                   example: "Registro de histórico removido com sucesso"
 *             example:
 *               success: true
 *               message: "Registro de histórico removido com sucesso"
 *       400:
 *         description: Erro na requisição - ID inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "ID inválido"
 *       401:
 *         description: Token de acesso não fornecido ou inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingToken:
 *                 value:
 *                   error: "Token de acesso necessário"
 *               invalidToken:
 *                 value:
 *                   error: "Token inválido"
 *       404:
 *         description: Registro de histórico não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Registro de histórico não encontrado"
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Erro ao remover registro de histórico"
 */

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

/**
 * Helper function to map HistoryAction to status expected by frontend
 */
function mapActionToStatus(action: string): 'confirmed' | 'missed' | 'postponed' {
  switch (action) {
    case 'TAKEN':
      return 'confirmed';
    case 'MISSED':
      return 'missed';
    case 'POSTPONED':
      return 'postponed';
    case 'SKIPPED':
      return 'missed';
    default:
      return 'missed';
  }
}
