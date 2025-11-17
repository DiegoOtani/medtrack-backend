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
 * Registra o token do dispositivo para notificações push
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
 * Agenda uma notificação para um medicamento
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
 * Cancela uma notificação agendada
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
 * Atualiza as configurações de notificação do usuário
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
 * Busca as configurações de notificação do usuário
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
