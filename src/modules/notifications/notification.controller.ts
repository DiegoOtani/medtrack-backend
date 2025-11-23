import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { NotificationService } from './notification.service';
import {
  registerDeviceSchema,
  scheduleNotificationSchema,
  cancelNotificationSchema,
  updateSettingsSchema,
  RegisterDeviceInput,
  ScheduleNotificationInput,
  CancelNotificationInput,
  UpdateSettingsInput,
} from './notification.schema';
import prisma from '../../shared/lib/prisma';

const notificationService = new NotificationService();

/**
 * @openapi
 * /api/notifications/register-device:
 *   post:
 *     tags:
 *       - Notifications
 *     summary: Registra token do dispositivo para push notifications
 *     description: |
 *       Registra o token Expo Push do dispositivo do usuário para receber notificações push.
 *       Necessário chamar este endpoint ao fazer login ou quando o token do dispositivo for atualizado.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - platform
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token Expo Push do dispositivo
 *                 example: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
 *               platform:
 *                 type: string
 *                 enum: [ios, android]
 *                 description: Plataforma do dispositivo
 *                 example: "android"
 *     responses:
 *       201:
 *         description: Token registrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Token do dispositivo registrado com sucesso"
 *                 deviceToken:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     userId:
 *                       type: string
 *                       format: uuid
 *                     token:
 *                       type: string
 *                     platform:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Erro de validação
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       401:
 *         description: Não autenticado
 */
export const registerDeviceHandler: RequestHandler = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const { body } = registerDeviceSchema.parse(req);
    const userId = (req as any).user?.id || 'user-123'; // Fallback para desenvolvimento

    const deviceToken = await notificationService.registerDeviceToken(
      userId,
      body.token,
      body.platform
    );

    console.log('Device token created:', deviceToken);

    res.status(201).json({
      message: 'Token do dispositivo registrado com sucesso',
      deviceToken,
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(400).json({
      error: error.message || 'Erro ao registrar token do dispositivo',
    });
  }
};

/**
 * @openapi
 * /api/notifications/schedule:
 *   post:
 *     tags:
 *       - Notifications
 *     summary: Agenda uma notificação para um medicamento
 *     description: |
 *       Cria um agendamento de notificação push para lembrar o usuário de tomar um medicamento.
 *       A notificação será enviada no horário especificado em scheduledTime.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - medicationId
 *               - scheduleId
 *               - scheduledTime
 *               - medicationName
 *               - dosage
 *             properties:
 *               medicationId:
 *                 type: string
 *                 format: uuid
 *                 description: ID do medicamento
 *               scheduleId:
 *                 type: string
 *                 format: uuid
 *                 description: ID do agendamento
 *               scheduledTime:
 *                 type: string
 *                 format: date-time
 *                 description: Horário programado para a notificação
 *               medicationName:
 *                 type: string
 *                 description: Nome do medicamento
 *               dosage:
 *                 type: string
 *                 description: Dosagem do medicamento
 *           example:
 *             medicationId: "550e8400-e29b-41d4-a716-446655440000"
 *             scheduleId: "660e8400-e29b-41d4-a716-446655440001"
 *             scheduledTime: "2025-11-22T14:00:00.000Z"
 *             medicationName: "Paracetamol"
 *             dosage: "500mg"
 *     responses:
 *       201:
 *         description: Notificação agendada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Notificação agendada com sucesso"
 *                 notification:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     userId:
 *                       type: string
 *                       format: uuid
 *                     medicationId:
 *                       type: string
 *                       format: uuid
 *                     scheduleId:
 *                       type: string
 *                       format: uuid
 *                     scheduledTime:
 *                       type: string
 *                       format: date-time
 *                     sent:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Erro de validação
 *       401:
 *         description: Não autenticado
 */
export const scheduleNotificationHandler: RequestHandler = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const { body } = scheduleNotificationSchema.parse(req);
    const userId = (req as any).user?.id || 'user-123'; // Fallback para desenvolvimento

    const scheduledTime = new Date(body.scheduledTime);

    const notification = await notificationService.scheduleNotification(
      userId,
      body.medicationId,
      body.scheduleId,
      scheduledTime,
      body.medicationName,
      body.dosage
    );

    res.status(201).json({
      message: 'Notificação agendada com sucesso',
      notification,
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(400).json({
      error: error.message || 'Erro ao agendar notificação',
    });
  }
};

/**
 * @openapi
 * /api/notifications/cancel/{id}:
 *   delete:
 *     tags:
 *       - Notifications
 *     summary: Cancela uma notificação agendada
 *     description: |
 *       Cancela uma notificação que foi previamente agendada.
 *       A notificação não será mais enviada ao usuário.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da notificação a ser cancelada
 *         example: "770e8400-e29b-41d4-a716-446655440002"
 *     responses:
 *       200:
 *         description: Notificação cancelada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Notificação cancelada com sucesso"
 *                 notification:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     userId:
 *                       type: string
 *                       format: uuid
 *                     medicationId:
 *                       type: string
 *                       format: uuid
 *                     scheduledTime:
 *                       type: string
 *                       format: date-time
 *                     sent:
 *                       type: boolean
 *       400:
 *         description: Erro ao cancelar notificação
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Notificação não encontrada
 */
export const cancelNotificationHandler: RequestHandler = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const { params } = cancelNotificationSchema.parse(req);
    const userId = (req as any).user?.id || 'user-123'; // Fallback para desenvolvimento

    const notification = await notificationService.cancelNotification(params.id, userId);

    res.json({
      message: 'Notificação cancelada com sucesso',
      notification,
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(400).json({
      error: error.message || 'Erro ao cancelar notificação',
    });
  }
};

/**
 * @openapi
 * /api/notifications/settings:
 *   put:
 *     tags:
 *       - Notifications
 *     summary: Atualiza configurações de notificações do usuário
 *     description: |
 *       Permite ao usuário configurar preferências de notificações, incluindo:
 *       - Habilitar/desabilitar notificações push e email
 *       - Definir tempo de antecedência do lembrete
 *       - Configurar horário de silêncio (quiet hours)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enablePush:
 *                 type: boolean
 *                 description: Habilitar notificações push
 *                 example: true
 *               enableEmail:
 *                 type: boolean
 *                 description: Habilitar notificações por email
 *                 example: false
 *               reminderBefore:
 *                 type: integer
 *                 description: Minutos de antecedência do lembrete
 *                 example: 15
 *               quietHoursStart:
 *                 type: string
 *                 format: time
 *                 description: Horário de início do modo silencioso (HH:mm)
 *                 example: "22:00"
 *                 nullable: true
 *               quietHoursEnd:
 *                 type: string
 *                 format: time
 *                 description: Horário de fim do modo silencioso (HH:mm)
 *                 example: "07:00"
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Configurações atualizadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Configurações de notificação atualizadas com sucesso"
 *                 settings:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     userId:
 *                       type: string
 *                       format: uuid
 *                     enablePush:
 *                       type: boolean
 *                     enableEmail:
 *                       type: boolean
 *                     reminderBefore:
 *                       type: integer
 *                     quietHoursStart:
 *                       type: string
 *                       nullable: true
 *                     quietHoursEnd:
 *                       type: string
 *                       nullable: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Erro de validação
 *       401:
 *         description: Não autenticado
 */
export const updateSettingsHandler: RequestHandler = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const { body } = updateSettingsSchema.parse(req);
    const userId = (req as any).user?.id || 'user-123'; // Fallback para desenvolvimento
    console.log('[Backend] updateSettingsHandler - userId:', userId);
    console.log('[Backend] updateSettingsHandler - body:', body);

    const settings = await notificationService.updateNotificationSettings(userId, body);
    console.log('[Backend] updateSettingsHandler - configurações salvas:', settings);

    res.json({
      message: 'Configurações de notificação atualizadas com sucesso',
      settings,
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(400).json({
      error: error.message || 'Erro ao atualizar configurações',
    });
  }
};

/**
 * @openapi
 * /api/notifications/settings:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: Busca configurações de notificações do usuário
 *     description: |
 *       Retorna as configurações atuais de notificação do usuário.
 *       Se o usuário ainda não tiver configurações salvas, retorna valores padrão.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configurações retornadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 settings:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     userId:
 *                       type: string
 *                       format: uuid
 *                     enablePush:
 *                       type: boolean
 *                       example: true
 *                     enableEmail:
 *                       type: boolean
 *                       example: false
 *                     reminderBefore:
 *                       type: integer
 *                       example: 15
 *                       description: Minutos de antecedência
 *                     quietHoursStart:
 *                       type: string
 *                       nullable: true
 *                       example: "22:00"
 *                       description: Horário de início do modo silencioso
 *                     quietHoursEnd:
 *                       type: string
 *                       nullable: true
 *                       example: "07:00"
 *                       description: Horário de fim do modo silencioso
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *             example:
 *               settings:
 *                 enablePush: true
 *                 enableEmail: false
 *                 reminderBefore: 15
 *                 quietHoursStart: null
 *                 quietHoursEnd: null
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro ao buscar configurações
 */
export const getSettingsHandler: RequestHandler = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id || 'user-123'; // Fallback para desenvolvimento
    console.log('[Backend] getSettingsHandler - userId:', userId);
    console.log('[Backend] getSettingsHandler - req.user:', (req as any).user);

    const settings = await prisma.reminderSettings.findUnique({
      where: { userId },
    });

    console.log('[Backend] getSettingsHandler - configurações encontradas:', settings);

    // Se não encontrou configurações, retorna valores padrão
    const responseSettings = settings || {
      enablePush: true,
      enableEmail: false,
      reminderBefore: 15,
      quietHoursStart: null,
      quietHoursEnd: null,
    };

    console.log('[Backend] getSettingsHandler - retornando configurações:', responseSettings);

    res.json({
      settings: responseSettings,
    });
  } catch (error: any) {
    console.error('[Backend] getSettingsHandler - erro:', error);
    res.status(500).json({
      error: error.message || 'Erro ao buscar configurações',
    });
  }
};
