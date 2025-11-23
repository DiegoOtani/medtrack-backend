import { Expo, ExpoPushMessage, ExpoPushToken, ExpoPushSuccessTicket } from 'expo-server-sdk';
import { addMinutes } from 'date-fns';
import prisma from '../../shared/lib/prisma';

export class NotificationService {
  private expo: Expo;

  constructor() {
    this.expo = new Expo();
  }

  /**
   * Registra o token do dispositivo para um usuário
   */
  async registerDeviceToken(userId: string, token: string, platform: string) {
    // Verifica se o token é válido
    // if (!Expo.isExpoPushToken(token)) {
    //   throw new Error('Token do dispositivo inválido');
    // }

    // Remove tokens antigos do usuário para esta plataforma
    await prisma.deviceToken.deleteMany({
      where: {
        userId,
        platform,
      },
    });

    // Cria novo token do dispositivo
    const deviceToken = await prisma.deviceToken.create({
      data: {
        token,
        platform,
        userId,
      },
    });

    return deviceToken;
  }

  /**
   * Agenda uma notificação para um medicamento
   */
  async scheduleNotification(
    userId: string,
    medicationId: string,
    scheduleId: string,
    scheduledTime: Date, // Horário do medicamento
    medicationName: string,
    dosage: string
  ) {
    // Busca configurações de lembrete do usuário
    const reminderSettings = await prisma.reminderSettings.findUnique({
      where: { userId },
    });

    const reminderBefore = reminderSettings?.reminderBefore || 0; // minutos antes

    // Calcula horário da notificação: scheduledTime - reminderBefore
    let notificationTime = scheduledTime;
    if (reminderBefore > 0) {
      notificationTime = addMinutes(scheduledTime, -reminderBefore);
    }

    // Não agendar se o horário da notificação já passou
    if (notificationTime < new Date()) {
      return null;
    }

    // Calcula horário de silêncio se configurado
    const isQuietHour = this.isQuietHour(notificationTime, reminderSettings);

    if (isQuietHour && reminderSettings?.enablePush) {
      // Se está no horário de silêncio, agenda para o próximo horário disponível
      notificationTime = this.adjustForQuietHours(notificationTime, reminderSettings);
    }

    // Cria notificação agendada no banco
    const scheduledNotification = await prisma.scheduledNotification.create({
      data: {
        medicationId,
        scheduleId,
        userId,
        medicationName,
        dosage,
        scheduledTime: notificationTime, // Horário da NOTIFICAÇÃO (scheduledTime - reminderBefore)
        status: 'scheduled',
      },
    });

    // 🔔 NÃO ENVIAR PUSH NOTIFICATION IMEDIATAMENTE!
    // Push notifications devem ser enviadas por um job worker quando chegarem no horário
    // Por enquanto, apenas salvamos no banco e o frontend agenda localmente

    return scheduledNotification;
  }

  /**
   * Cancela uma notificação agendada
   */
  async cancelNotification(notificationId: string, userId: string) {
    // Busca a notificação e verifica se pertence ao usuário
    const notification = await prisma.scheduledNotification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new Error('Notificação não encontrada');
    }

    // Atualiza o status para cancelled
    const updatedNotification = await prisma.scheduledNotification.update({
      where: { id: notificationId },
      data: { status: 'cancelled' },
    });

    return updatedNotification;
  }

  /**
   * Atualiza configurações de notificação do usuário
   */
  async updateNotificationSettings(
    userId: string,
    settings: {
      enablePush?: boolean;
      enableEmail?: boolean;
      reminderBefore?: number;
      quietHoursStart?: string | null;
      quietHoursEnd?: string | null;
    }
  ) {
    // Busca configurações existentes
    const existingSettings = await prisma.reminderSettings.findUnique({
      where: { userId },
    });

    if (existingSettings) {
      // Atualiza configurações existentes
      const updatedSettings = await prisma.reminderSettings.update({
        where: { userId },
        data: settings,
      });
      return updatedSettings;
    } else {
      // Cria novas configurações
      const newSettings = await prisma.reminderSettings.create({
        data: {
          userId,
          enablePush: true,
          enableEmail: false,
          reminderBefore: 15,
          quietHoursStart: null,
          quietHoursEnd: null,
          ...settings,
        },
      });
      return newSettings;
    }
  }

  /**
   * Envia notificação push para múltiplos dispositivos
   */
  private async sendPushNotification(
    deviceTokens: any[],
    medicationName: string,
    dosage: string,
    scheduledTime: Date,
    notificationId: string
  ) {
    const messages: ExpoPushMessage[] = [];

    for (const deviceToken of deviceTokens) {
      if (!Expo.isExpoPushToken(deviceToken.token)) {
        console.error(`Push token ${deviceToken.token} is not a valid Expo push token`);
        continue;
      }

      messages.push({
        to: deviceToken.token,
        sound: 'default',
        title: 'Lembrete de Medicamento',
        body: `Hora de tomar ${medicationName} - ${dosage}`,
        data: {
          notificationId,
          medicationName,
          dosage,
          scheduledTime: scheduledTime.toISOString(),
        },
      });
    }

    const chunks = this.expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending push notification:', error);
      }
    }

    // Atualiza a notificação com o ID do Expo (apenas se foi sucesso)
    const successTicket = tickets.find((ticket) => 'id' in ticket) as ExpoPushSuccessTicket;
    if (successTicket) {
      await prisma.scheduledNotification.update({
        where: { id: notificationId },
        data: {
          notificationId: successTicket.id,
        },
      });
    }
  }

  /**
   * Verifica se o horário atual está dentro do período de silêncio
   */
  private isQuietHour(scheduledTime: Date, settings: any): boolean {
    if (!settings?.quietHoursStart || !settings?.quietHoursEnd) {
      return false;
    }

    const now = new Date(scheduledTime);
    const startTime = this.parseTime(settings.quietHoursStart);
    const endTime = this.parseTime(settings.quietHoursEnd);

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = startTime.hours * 60 + startTime.minutes;
    const endMinutes = endTime.hours * 60 + endTime.minutes;

    if (startMinutes < endMinutes) {
      // Período não cruza meia-noite
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      // Período cruza meia-noite
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
  }

  /**
   * Ajusta o horário para fora do período de silêncio
   */
  private adjustForQuietHours(scheduledTime: Date, settings: any): Date {
    if (!settings?.quietHoursEnd) return scheduledTime;

    const endTime = this.parseTime(settings.quietHoursEnd);
    const adjustedTime = new Date(scheduledTime);
    adjustedTime.setHours(endTime.hours, endTime.minutes, 0, 0);

    return adjustedTime;
  }

  /**
   * Converte string HH:MM para objeto com horas e minutos
   */
  private parseTime(timeStr: string): { hours: number; minutes: number } {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return { hours, minutes };
  }
}
