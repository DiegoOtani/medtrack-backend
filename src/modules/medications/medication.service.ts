import prisma from '../../shared/lib/prisma';
import { MedicationSchema, MedicationQuery } from './medication.schemas';
import { addMinutes, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { recreateSchedules } from '../schedules/schedules.service';

export async function getMedications(query: MedicationQuery & { userId?: string }) {
  const { page, limit, userId, ...filters } = query;

  const where: any = {};
  if (filters.name) where.name = { contains: filters.name, mode: 'insensitive' };
  if (filters.dosage) where.dosage = { contains: filters.dosage, mode: 'insensitive' };
  if (filters.frequency) where.frequency = { contains: filters.frequency, mode: 'insensitive' };
  if (filters.expiresAt) where.expiresAt = filters.expiresAt;
  if (filters.stock !== undefined) where.stock = filters.stock;
  if (userId) where.userId = userId;

  const take = limit ?? undefined;
  const skip = page && limit ? (page - 1) * limit : undefined;

  const [items, total] = await Promise.all([
    prisma.medication.findMany({
      where,
      skip,
      take,
    }),
    prisma.medication.count({ where }),
  ]);

  return {
    total,
    page: page ?? 1,
    limit: limit ?? total,
    items,
  };
}

/**
 * Get today's medications with timezone support
 * @param userId - User ID
 * @param userTimezone - User's timezone offset in minutes (e.g., -180 for UTC-3)
 */
export async function getTodayMedications(userId: string, userTimezone?: number) {
  // Use user's timezone if provided, otherwise use server timezone
  const timezoneOffset = userTimezone !== undefined ? userTimezone : new Date().getTimezoneOffset();

  // Create date in user's timezone using date-fns
  const now = new Date();
  const userDate = addMinutes(now, timezoneOffset);

  const dayOfWeek = userDate.getDay();
  const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const dayName = dayNames[dayOfWeek];

  const schedules = await prisma.medicationSchedule.findMany({
    where: {
      medication: {
        userId: userId,
      },
      isActive: true,
      daysOfWeek: {
        has: dayName,
      },
    },
    include: {
      medication: true,
    },
    orderBy: {
      time: 'asc',
    },
  });

  const todayMedications = await Promise.all(
    schedules.map(async (schedule) => {
      const startOfDay = new Date(userDate.getFullYear(), userDate.getMonth(), userDate.getDate());
      const endOfDay = new Date(
        userDate.getFullYear(),
        userDate.getMonth(),
        userDate.getDate(),
        23,
        59,
        59
      );

      const todayHistory = await prisma.medicationHistory.findFirst({
        where: {
          scheduleId: schedule.id,
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const [hours, minutes] = schedule.time.split(':').map(Number);

      // Criar scheduledTime considerando o timezone do usuário
      // schedule.time é hora LOCAL do usuário (ex: 19:00 BRT)
      // timezoneOffset = -180 para BRT (UTC-3)

      // Para converter hora local para UTC:
      // 19:00 BRT = 19:00 - (-3h) = 19:00 + 3h = 22:00 UTC
      // Portanto, precisamos SUBTRAIR o offset (adicionar o valor negativo)

      const year = userDate.getFullYear();
      const month = userDate.getMonth();
      const day = userDate.getDate();

      // Criar timestamp em UTC para o horário LOCAL do usuário
      let scheduledTime = new Date(Date.UTC(year, month, day, hours, minutes, 0, 0));

      // Converter de hora local para UTC: subtrair o offset
      // timezoneOffset = -180 (BRT), então subtraímos -180 = adicionamos 180
      scheduledTime = addMinutes(scheduledTime, -timezoneOffset);

      // Se foi adiado (POSTPONED), usar o novo horário do histórico
      if (todayHistory?.action === 'POSTPONED' && todayHistory.scheduledFor) {
        scheduledTime = new Date(todayHistory.scheduledFor);
      }

      const currentUserTime = new Date(userDate);

      let status: 'confirmed' | 'pending' | 'missed' | 'postponed' = 'pending';

      // Marcar como MISSED apenas se:
      // 1. Já passou do horário
      // 2. Medicamento foi criado antes do horário agendado
      // 3. Não foi tomado/pulado
      const hasPassed = currentUserTime > scheduledTime;
      const medicationCreatedAt = new Date(schedule.medication.createdAt);
      const wasScheduledAfterCreation = scheduledTime >= medicationCreatedAt;

      if (todayHistory) {
        // Já tem histórico - usar status do histórico
        if (todayHistory.action === 'TAKEN') {
          status = 'confirmed';
        } else if (todayHistory.action === 'MISSED') {
          status = 'missed';
        } else if (todayHistory.action === 'SKIPPED') {
          status = 'missed';
        } else if (todayHistory.action === 'POSTPONED') {
          status = 'postponed';
        }
      } else if (hasPassed && wasScheduledAfterCreation) {
        // Passou do horário E medicamento existia - marcar como MISSED
        status = 'missed';

        await prisma.medicationHistory.create({
          data: {
            medicationId: schedule.medicationId,
            scheduleId: schedule.id,
            scheduledFor: scheduledTime,
            action: 'MISSED',
            notes: 'Dose não tomada no horário programado (registrado automaticamente)',
          },
        });
      }

      return {
        id: schedule.medication.id,
        name: schedule.medication.name,
        dosage: schedule.medication.dosage,
        time: schedule.time,
        taken: status === 'confirmed',
        postponed: status === 'postponed',
        userId: schedule.medication.userId,
        scheduleId: schedule.id,
        scheduledTime: scheduledTime.toISOString(),
        status,
        hasPassed, // ✅ NOVO: indicar se já passou
      };
    })
  );

  // Filtrar: Mostrar apenas do DIA ATUAL
  // 1. Doses CONFIRMADAS (tomadas hoje)
  // 2. Doses FUTURAS (pending - ainda não passou o horário)
  // 3. Doses ADIADAS (postponed)
  // 4. NÃO mostrar MISSED (passadas e não tomadas)
  const confirmedMedications = todayMedications.filter((med) => med.status === 'confirmed');
  const postponedMedications = todayMedications.filter((med) => med.status === 'postponed');
  const upcomingMedications = todayMedications.filter(
    (med) => !med.hasPassed && med.status === 'pending'
  );

  // Combinar confirmados + adiados + futuros, ordenados por horário
  const result = [...confirmedMedications, ...postponedMedications, ...upcomingMedications].sort(
    (a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
  );

  return result;
}

export async function updateMedicationStock(medicationId: string, newStock: number) {
  if (newStock < 0) {
    throw new Error('Estoque não pode ser negativo');
  }

  const medication = await prisma.medication.update({
    where: { id: medicationId },
    data: { stock: newStock },
  });

  return medication;
}

export async function getLowStockMedications(userId: string, threshold: number = 5) {
  const medications = await prisma.medication.findMany({
    where: {
      userId: userId,
      stock: {
        lte: threshold,
        gt: 0, // Excluir medicamentos sem estoque
      },
    },
    orderBy: {
      stock: 'asc',
    },
  });

  return medications;
}

export async function getOutOfStockMedications(userId: string) {
  const medications = await prisma.medication.findMany({
    where: {
      userId: userId,
      stock: 0,
    },
  });

  return medications;
}

export async function getMedicationsById(id: string) {
  return prisma.medication.findUnique({ where: { id } });
}

export async function createMedication(data: MedicationSchema, userTimezone?: number) {
  // Validar se o horário de início não é no passado (considerando timezone do usuário)
  if (data.startTime) {
    const now = new Date();
    const timezoneOffset =
      userTimezone !== undefined ? userTimezone : new Date().getTimezoneOffset();

    // Calcular hora atual no timezone do usuário com date-fns
    const userNow = addMinutes(now, timezoneOffset);

    const [hours, minutes] = data.startTime.split(':').map(Number);

    const startTimeToday = new Date(userNow);
    startTimeToday.setHours(hours, minutes, 0, 0);

    // Se o horário já passou hoje, não permitir
    if (startTimeToday < userNow) {
      const horaAtual = userNow.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      throw new Error(
        `O horário de início (${data.startTime}) já passou. ` +
          `Hora atual: ${horaAtual}. ` +
          `Por favor, escolha um horário futuro.`
      );
    }
  }

  return prisma.medication.create({ data });
}

export async function updateMedication(id: string, data: Partial<MedicationSchema>) {
  // Buscar medicamento atual para comparar mudanças
  const currentMedication = await prisma.medication.findUnique({
    where: { id },
    select: {
      frequency: true,
      intervalHours: true,
      startTime: true,
    },
  });

  if (!currentMedication) {
    throw new Error('Medicamento não encontrado');
  }

  // Verificar se houve mudança na frequência, intervalo ou horário de início
  const frequencyChanged = data.frequency && data.frequency !== currentMedication.frequency;
  const intervalChanged =
    data.intervalHours && data.intervalHours !== currentMedication.intervalHours;
  const startTimeChanged = data.startTime && data.startTime !== currentMedication.startTime;

  const needsScheduleRecreation = frequencyChanged || intervalChanged || startTimeChanged;

  // Se precisa recriar schedules, deletar os antigos primeiro
  if (needsScheduleRecreation) {
    // Deletar schedules antigos
    await prisma.medicationSchedule.deleteMany({
      where: { medicationId: id },
    });

    // Deletar notificações agendadas antigas
    await prisma.scheduledNotification.deleteMany({
      where: { medicationId: id },
    });
  }

  // Atualizar medicamento
  const updatedMedication = await prisma.medication.update({
    where: { id },
    data,
  });

  // Se precisa recriar schedules, criar novos
  if (needsScheduleRecreation) {
    // Usar dados novos se fornecidos, senão manter os atuais
    const finalFrequency = data.frequency || currentMedication.frequency;
    const finalIntervalHours = data.intervalHours || currentMedication.intervalHours;
    const finalStartTime = data.startTime || currentMedication.startTime;

    await recreateSchedules(id, finalFrequency, finalStartTime, finalIntervalHours);
  }

  return updatedMedication;
}

export async function deleteMedication(id: string) {
  await prisma.medicationSchedule.deleteMany({
    where: { medicationId: id },
  });

  await prisma.medicationHistory.deleteMany({
    where: { medicationId: id },
  });

  await prisma.scheduledNotification.deleteMany({
    where: { medicationId: id },
  });

  return prisma.medication.delete({
    where: { id },
  });
}
