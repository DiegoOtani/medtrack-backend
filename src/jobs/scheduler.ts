import { notificationSenderJob } from './notification-sender.job';

/**
 * Scheduler para executar jobs em background
 *
 * Atualmente executa:
 * - NotificationSenderJob: A cada 1 minuto
 */

class JobScheduler {
  private intervals: NodeJS.Timeout[] = [];

  /**
   * Inicia todos os jobs agendados
   */
  start(): void {
    console.log('[JobScheduler] 🚀 Iniciando jobs em background...');

    // Job de envio de notificações - executa a cada 1 minuto
    const notificationJobInterval = setInterval(async () => {
      await notificationSenderJob.run();
    }, 60 * 1000); // 60 segundos = 1 minuto

    this.intervals.push(notificationJobInterval);

    // Executar imediatamente na primeira vez
    notificationSenderJob.run();

    console.log('[JobScheduler] ✅ Jobs agendados com sucesso!');
    console.log('[JobScheduler] - NotificationSenderJob: a cada 1 minuto');
  }

  /**
   * Para todos os jobs agendados
   */
  stop(): void {
    console.log('[JobScheduler] 🛑 Parando jobs em background...');

    for (const interval of this.intervals) {
      clearInterval(interval);
    }

    this.intervals = [];
    console.log('[JobScheduler] ✅ Todos os jobs foram parados');
  }
}

export const jobScheduler = new JobScheduler();
