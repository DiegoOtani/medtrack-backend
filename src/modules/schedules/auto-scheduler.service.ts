import { NotificationService } from '../notifications/notification.service';
import { getSchedulesByMedication } from '../schedules/schedules.service';
import prisma from '../../shared/lib/prisma';

/**
 * Serviço para agendamento automático de notificações de medicamentos
 */
export class AutoSchedulerService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Agenda automaticamente notificações para todos os horários de um medicamento
   */
  async scheduleMedicationNotifications(medicationId: string): Promise<void> {
    try {
      console.log(`[AutoScheduler] Iniciando agendamento para medicamento ${medicationId}`);

      // Buscar medicamento com dados necessários
      const medication = await prisma.medication.findUnique({
        where: { id: medicationId },
        include: { user: true },
      });

      if (!medication) {
        throw new Error(`Medicamento ${medicationId} não encontrado`);
      }

      // Buscar todos os schedules ativos do medicamento
      const schedules = await getSchedulesByMedication(medicationId, true);

      if (schedules.length === 0) {
        console.log(
          `[AutoScheduler] Nenhum schedule ativo encontrado para medicamento ${medicationId}`
        );
        return;
      }

      console.log(`[AutoScheduler] Encontrados ${schedules.length} schedules para agendamento`);

      // Agendar notificações para cada schedule
      const now = new Date();
      const notificationPromises = schedules.map(async (schedule: any) => {
        try {
          // Calcular próximos horários baseados no schedule
          const nextScheduledTimes = this.calculateNextScheduledTimes(schedule, now);

          // Agendar notificação para cada horário futuro
          for (const scheduledTime of nextScheduledTimes) {
            await this.notificationService.scheduleNotification(
              medication.userId,
              medicationId,
              schedule.id,
              scheduledTime,
              medication.name,
              medication.dosage
            );
          }

          console.log(`[AutoScheduler] Notificações agendadas para schedule ${schedule.id}`);
        } catch (error) {
          console.error(
            `[AutoScheduler] Erro ao agendar notificações para schedule ${schedule.id}:`,
            error
          );
        }
      });

      await Promise.all(notificationPromises);

      console.log(
        `[AutoScheduler] Agendamento automático concluído para medicamento ${medicationId}`
      );
    } catch (error) {
      console.error(`[AutoScheduler] Erro no agendamento automático:`, error);
      throw error;
    }
  }

  /**
   * Calcula os próximos horários de agendamento baseados no schedule
   */
  private calculateNextScheduledTimes(schedule: any, fromDate: Date): Date[] {
    const scheduledTimes: Date[] = [];
    const maxDaysAhead = 7; // Agendar para os próximos 7 dias

    for (let dayOffset = 0; dayOffset < maxDaysAhead; dayOffset++) {
      const currentDate = new Date(fromDate);
      currentDate.setDate(currentDate.getDate() + dayOffset);

      const dayOfWeek = this.getDayOfWeek(currentDate);

      // Verificar se este dia da semana está incluído no schedule
      if (schedule.daysOfWeek.includes(dayOfWeek)) {
        const [hours, minutes] = schedule.time.split(':').map(Number);
        const scheduledDateTime = new Date(currentDate);
        scheduledDateTime.setHours(hours, minutes, 0, 0);

        // Só incluir se o horário ainda não passou hoje
        if (scheduledDateTime > fromDate) {
          scheduledTimes.push(scheduledDateTime);
        }
      }
    }

    return scheduledTimes.slice(0, 10); // Limitar a 10 notificações por schedule
  }

  /**
   * Converte Date para dia da semana no formato do enum
   */
  private getDayOfWeek(date: Date): string {
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    return days[date.getDay()];
  }

  /**
   * Cancela todas as notificações agendadas de um medicamento
   */
  async cancelMedicationNotifications(medicationId: string): Promise<void> {
    try {
      console.log(`[AutoScheduler] Cancelando notificações para medicamento ${medicationId}`);

      // Buscar todas as notificações agendadas para este medicamento
      const scheduledNotifications = await prisma.scheduledNotification.findMany({
        where: {
          medicationId,
          status: 'scheduled',
        },
      });

      // Cancelar cada notificação
      const cancelPromises = scheduledNotifications.map(async (notification: any) => {
        try {
          await this.notificationService.cancelNotification(notification.id, notification.userId);
        } catch (error) {
          console.error(`[AutoScheduler] Erro ao cancelar notificação ${notification.id}:`, error);
        }
      });

      await Promise.all(cancelPromises);

      console.log(
        `[AutoScheduler] ${cancelPromises.length} notificações canceladas para medicamento ${medicationId}`
      );
    } catch (error) {
      console.error(`[AutoScheduler] Erro ao cancelar notificações:`, error);
      throw error;
    }
  }

  /**
   * Reagenda notificações após alteração no medicamento ou schedules
   */
  async rescheduleMedicationNotifications(medicationId: string): Promise<void> {
    // Primeiro cancelar todas as notificações existentes
    await this.cancelMedicationNotifications(medicationId);

    // Depois agendar novas notificações
    await this.scheduleMedicationNotifications(medicationId);
  }
}
