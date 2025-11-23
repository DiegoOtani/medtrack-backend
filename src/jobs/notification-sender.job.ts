import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import prisma from '../shared/lib/prisma';

/**
 * Job Worker para enviar notificações push agendadas
 *
 * Este worker:
 * 1. Busca notificações com scheduledTime <= agora e status = 'scheduled'
 * 2. Busca os tokens dos dispositivos dos usuários
 * 3. Envia push notifications via Expo Push API
 * 4. Atualiza o status das notificações para 'SENT' ou 'FAILED'
 *
 * Deve ser executado a cada minuto via cron job ou setInterval
 */

const expo = new Expo();

export class NotificationSenderJob {
  private isRunning = false;

  /**
   * Executa o job de envio de notificações
   */
  async run(): Promise<void> {
    if (this.isRunning) {
      console.log('[NotificationJob] Job já está rodando, pulando execução...');
      return;
    }

    this.isRunning = true;

    try {
      const now = new Date();
      console.log(
        `[NotificationJob] 🔍 Verificando notificações pendentes... (${now.toISOString()})`
      );

      // Buscar notificações que devem ser enviadas agora
      const pendingNotifications = await prisma.scheduledNotification.findMany({
        where: {
          status: 'scheduled',
          scheduledTime: {
            lte: now, // Notificações que já passaram do horário
          },
        },
        take: 100, // Processar no máximo 100 por vez
        orderBy: {
          scheduledTime: 'asc',
        },
      });

      if (pendingNotifications.length === 0) {
        console.log('[NotificationJob] ✅ Nenhuma notificação pendente no momento');
        return;
      }

      console.log(
        `[NotificationJob] 📬 Encontradas ${pendingNotifications.length} notificações para enviar`
      );

      // Agrupar notificações por usuário
      const notificationsByUser = new Map<string, typeof pendingNotifications>();

      for (const notification of pendingNotifications) {
        const userNotifications = notificationsByUser.get(notification.userId) || [];
        userNotifications.push(notification);
        notificationsByUser.set(notification.userId, userNotifications);
      }

      console.log(`[NotificationJob] 👥 ${notificationsByUser.size} usuários diferentes`);

      // Processar cada usuário
      for (const [userId, notifications] of notificationsByUser) {
        await this.sendNotificationsForUser(userId, notifications);
      }

      console.log('[NotificationJob] 🎉 Job concluído com sucesso!');
    } catch (error) {
      console.error('[NotificationJob] ❌ Erro ao executar job:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Envia notificações para um usuário específico
   */
  private async sendNotificationsForUser(userId: string, notifications: any[]): Promise<void> {
    try {
      // Buscar usuário e seus tokens de dispositivo
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          deviceTokens: {
            select: {
              token: true,
              platform: true,
            },
          },
        },
      });

      if (!user) {
        console.log(`[NotificationJob] ⚠️ Usuário ${userId} não encontrado`);
        await this.markNotificationsAsFailed(notifications, 'Usuário não encontrado');
        return;
      }

      if (!user.deviceTokens || user.deviceTokens.length === 0) {
        console.log(`[NotificationJob] ⚠️ Usuário ${user.name} não tem tokens de push`);
        await this.markNotificationsAsFailed(notifications, 'Token de push não registrado');
        return;
      }

      // Filtrar apenas tokens válidos do Expo
      const validTokens = user.deviceTokens
        .map((dt) => dt.token)
        .filter((token) => Expo.isExpoPushToken(token));

      if (validTokens.length === 0) {
        console.log(`[NotificationJob] ⚠️ Usuário ${user.name} não tem tokens válidos`);
        await this.markNotificationsAsFailed(notifications, 'Nenhum token de push válido');
        return;
      }

      console.log(
        `[NotificationJob] 📱 ${validTokens.length} dispositivo(s) encontrado(s) para ${user.name}`
      );

      // Preparar mensagens (uma notificação para cada dispositivo)
      const messages: ExpoPushMessage[] = [];

      for (const token of validTokens) {
        for (const notification of notifications) {
          messages.push({
            to: token,
            sound: 'default',
            title: `🔔 Lembrete: ${notification.medicationName}`,
            body: `Hora de tomar ${notification.dosage} de ${notification.medicationName}`,
            data: {
              medicationId: notification.medicationId,
              scheduleId: notification.scheduleId,
              notificationId: notification.id,
              type: 'medication_reminder',
              screen: 'home',
            },
            categoryId: 'medication_reminder',
            priority: 'high',
          });
        }
      }

      console.log(
        `[NotificationJob] 📤 Enviando ${messages.length} mensagens (${notifications.length} notificações × ${validTokens.length} dispositivos)...`
      );

      // Enviar em chunks (Expo recomenda max 100 por request)
      const chunks = expo.chunkPushNotifications(messages);
      const tickets: ExpoPushTicket[] = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('[NotificationJob] ❌ Erro ao enviar chunk:', error);
        }
      }

      // Atualizar status das notificações (marca como SENT se pelo menos 1 dispositivo recebeu)
      for (const notification of notifications) {
        const notificationTickets = tickets.slice(0, validTokens.length);
        tickets.splice(0, validTokens.length);

        const hasSuccess = notificationTickets.some((ticket) => ticket.status === 'ok');
        const hasError = notificationTickets.some((ticket) => ticket.status === 'error');

        if (hasSuccess) {
          const successTicket = notificationTickets.find((t) => t.status === 'ok');
          console.log(
            `[NotificationJob] ✅ Notificação ${notification.medicationName} enviada (ticket: ${successTicket?.id})`
          );
          await this.markNotificationAsSent(notification.id, successTicket?.id);
        } else if (hasError) {
          const errorTicket = notificationTickets.find((t) => t.status === 'error');
          console.error(
            `[NotificationJob] ❌ Erro ao enviar notificação ${notification.id}:`,
            errorTicket?.message
          );
          await this.markNotificationAsFailed(
            notification.id,
            errorTicket?.message || 'Erro desconhecido'
          );
        } else {
          await this.markNotificationAsFailed(notification.id, 'Nenhum ticket recebido');
        }
      }
    } catch (error) {
      console.error(`[NotificationJob] ❌ Erro ao processar usuário ${userId}:`, error);
      await this.markNotificationsAsFailed(notifications, 'Erro ao processar');
    }
  }

  /**
   * Marca uma notificação como enviada
   */
  private async markNotificationAsSent(notificationId: string, ticketId?: string): Promise<void> {
    try {
      await prisma.scheduledNotification.update({
        where: { id: notificationId },
        data: {
          status: 'SENT',
          notificationId: ticketId || undefined,
        },
      });
    } catch (error) {
      console.error(`[NotificationJob] Erro ao atualizar notificação ${notificationId}:`, error);
    }
  }

  /**
   * Marca uma notificação como falha
   */
  private async markNotificationAsFailed(notificationId: string, reason: string): Promise<void> {
    try {
      await prisma.scheduledNotification.update({
        where: { id: notificationId },
        data: {
          status: 'FAILED',
          // Você pode adicionar um campo 'errorMessage' no schema se quiser registrar o motivo
        },
      });
      console.log(
        `[NotificationJob] ⚠️ Notificação ${notificationId} marcada como FAILED: ${reason}`
      );
    } catch (error) {
      console.error(
        `[NotificationJob] Erro ao marcar notificação ${notificationId} como falha:`,
        error
      );
    }
  }

  /**
   * Marca múltiplas notificações como falha
   */
  private async markNotificationsAsFailed(notifications: any[], reason: string): Promise<void> {
    for (const notification of notifications) {
      await this.markNotificationAsFailed(notification.id, reason);
    }
  }
}

// Singleton instance
export const notificationSenderJob = new NotificationSenderJob();
