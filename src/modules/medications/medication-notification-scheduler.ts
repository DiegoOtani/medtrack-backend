import prisma from '../../shared/lib/prisma';
import { NotificationService } from '../notifications/notification.service';
import { addMinutes, addDays, startOfDay, parseISO } from 'date-fns';

/**
 * Serviço para agendar notificações de medicamentos automaticamente
 * baseado no scheduledTime do MedicationSchedule e nas configurações do usuário
 */
export class MedicationNotificationScheduler {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Agenda notificações para todos os schedules de um medicamento
   * @param medicationId - ID do medicamento
   * @param daysAhead - Quantos dias adiante agendar (padrão: 7 dias)
   */
  async scheduleNotificationsForMedication(medicationId: string, daysAhead: number = 7) {
    // Buscar medicamento e schedules
    const medication = await prisma.medication.findUnique({
      where: { id: medicationId },
      include: {
        schedules: {
          where: { isActive: true },
        },
      },
    });

    if (!medication) {
      throw new Error('Medicamento não encontrado');
    }

    // Buscar configurações de notificação do usuário
    const reminderSettings = await prisma.reminderSettings.findUnique({
      where: { userId: medication.userId },
    });

    // Se notificações push estão desabilitadas, não agendar
    if (reminderSettings && !reminderSettings.enablePush) {
      return { scheduled: 0, message: 'Notificações push desabilitadas' };
    }

    const reminderBefore = reminderSettings?.reminderBefore || 0; // minutos antes
    const quietHoursStart = reminderSettings?.quietHoursStart;
    const quietHoursEnd = reminderSettings?.quietHoursEnd;

    let scheduledCount = 0;

    // Para cada schedule ativo
    for (const schedule of medication.schedules) {
      // Agendar notificações para os próximos N dias
      for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
        const targetDate = addDays(new Date(), dayOffset);
        const dayOfWeek = targetDate.getDay();
        const dayNames = [
          'SUNDAY',
          'MONDAY',
          'TUESDAY',
          'WEDNESDAY',
          'THURSDAY',
          'FRIDAY',
          'SATURDAY',
        ];
        const dayName = dayNames[dayOfWeek];

        // Verificar se este schedule está configurado para este dia da semana
        if (!schedule.daysOfWeek.includes(dayName)) {
          continue;
        }

        // Criar timestamp do horário agendado
        const [hours, minutes] = schedule.time.split(':').map(Number);
        const scheduledTime = new Date(targetDate);
        scheduledTime.setHours(hours, minutes, 0, 0);

        // Não agendar notificações para horários passados
        if (scheduledTime < new Date()) {
          continue;
        }

        // Verificar se já existe notificação agendada para este horário
        const existingNotification = await prisma.scheduledNotification.findFirst({
          where: {
            medicationId: medication.id,
            scheduleId: schedule.id,
            scheduledTime: scheduledTime,
            status: 'scheduled',
          },
        });

        if (existingNotification) {
          continue;
        }

        // Calcular horário de lembrete (considerando reminderBefore)
        let notificationTime = scheduledTime;
        if (reminderBefore > 0) {
          notificationTime = addMinutes(scheduledTime, -reminderBefore);
        }

        // Verificar quiet hours e ajustar se necessário
        const isQuietHour = this.isQuietHour(
          notificationTime,
          quietHoursStart || undefined,
          quietHoursEnd || undefined
        );
        if (isQuietHour) {
          notificationTime = this.adjustForQuietHours(
            notificationTime,
            quietHoursStart || undefined,
            quietHoursEnd || undefined
          );
        }

        // Agendar notificação no backend
        try {
          await this.notificationService.scheduleNotification(
            medication.userId,
            medication.id,
            schedule.id,
            scheduledTime, // Horário original do medicamento
            medication.name,
            medication.dosage
          );

          scheduledCount++;
        } catch (error: any) {
          console.error(`[Scheduler] Erro ao agendar notificação:`, error.message);
          // Continuar mesmo se falhar para um horário específico
        }
      }
    }

    return { scheduled: scheduledCount, message: `${scheduledCount} notificações agendadas` };
  }

  /**
   * Cancela todas as notificações de um medicamento
   */
  async cancelNotificationsForMedication(medicationId: string) {
    // Atualizar status de todas as notificações agendadas
    const result = await prisma.scheduledNotification.updateMany({
      where: {
        medicationId,
        status: 'scheduled',
      },
      data: {
        status: 'cancelled',
      },
    });

    return { cancelled: result.count };
  }

  /**
   * Cancela notificações de um schedule específico
   */
  async cancelNotificationsForSchedule(scheduleId: string) {
    const result = await prisma.scheduledNotification.updateMany({
      where: {
        scheduleId,
        status: 'scheduled',
      },
      data: {
        status: 'cancelled',
      },
    });

    return { cancelled: result.count };
  }

  /**
   * Reagenda notificações quando medicamento é atualizado
   */
  async rescheduleNotificationsForMedication(medicationId: string) {
    // Cancelar notificações antigas
    await this.cancelNotificationsForMedication(medicationId);

    // Agendar novas notificações
    const result = await this.scheduleNotificationsForMedication(medicationId);

    return result;
  }

  /**
   * Verifica se o horário atual está dentro do período de silêncio
   */
  private isQuietHour(
    scheduledTime: Date,
    quietHoursStart?: string,
    quietHoursEnd?: string
  ): boolean {
    if (!quietHoursStart || !quietHoursEnd) {
      return false;
    }

    const startTime = this.parseTime(quietHoursStart);
    const endTime = this.parseTime(quietHoursEnd);

    const currentMinutes = scheduledTime.getHours() * 60 + scheduledTime.getMinutes();
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
  private adjustForQuietHours(
    scheduledTime: Date,
    quietHoursStart?: string,
    quietHoursEnd?: string
  ): Date {
    if (!quietHoursEnd) return scheduledTime;

    const endTime = this.parseTime(quietHoursEnd);
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

// Exporta instância singleton
export const medicationNotificationScheduler = new MedicationNotificationScheduler();
