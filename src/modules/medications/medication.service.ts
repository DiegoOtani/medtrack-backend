import prisma from '../../shared/lib/prisma';
import { MedicationSchema, MedicationQuery } from './medication.schemas';
import { addMinutes } from 'date-fns';

export async function getMedications(query: MedicationQuery & { userId?: string }) {
  const { page, limit, userId, ...filters } = query;

  const where: any = {};
  if (filters.name) where.name = { contains: filters.name, mode: 'insensitive' };
  if (filters.dosage) where.dosage = { contains: filters.dosage, mode: 'insensitive' };
  if (filters.frequency) where.frequency = { contains: filters.frequency, mode: 'insensitive' };
  if (filters.expiresAt) where.expiresAt = filters.expiresAt;
  if (filters.stock !== undefined) where.stock = filters.stock;
  if (userId) where.userId = userId;
  where.deletedAt = { isSet: false }

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
  const timezoneOffset = userTimezone ?? -(new Date().getTimezoneOffset());

  const nowUTC = new Date();
  const userDate = addMinutes(nowUTC, timezoneOffset);

  const dayOfWeek = userDate.getUTCDay();
  const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const dayName = dayNames[dayOfWeek];

  const schedules = await prisma.medicationSchedule.findMany({
    where: {
      medication: {
        userId: userId,
        deletedAt: { isSet: false },
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

  const startOfDayUser = new Date(Date.UTC(
    userDate.getUTCFullYear(),
    userDate.getUTCMonth(),
    userDate.getUTCDate(),
    0, 0, 0,
  ));

  const startOfDayUTC = addMinutes(startOfDayUser, -timezoneOffset);
  const endOfDayUTC = addMinutes(startOfDayUTC, 24 * 60 - 1 / 60000);

  const todayMedications = await Promise.all(
    schedules.map(async (schedule) => {
      const todayHistory = await prisma.medicationHistory.findFirst({
        where: {
          scheduleId: schedule.id,
          createdAt: {
            gte: startOfDayUTC,
            lte: endOfDayUTC,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const [hours, minutes] = schedule.time.split(':').map(Number);

      const scheduledTimeLocal = new Date(Date.UTC(
        userDate.getUTCFullYear(),
        userDate.getUTCMonth(),
        userDate.getUTCDate(),
        hours,
        minutes,
        0
      ));

      let scheduledTimeUTC = addMinutes(scheduledTimeLocal, -timezoneOffset);
      console.log(`\n\n[scheduledTimeUTC] - ${scheduledTimeUTC}\n`);

      // Se foi adiado (POSTPONED), usar o novo horário do histórico
      if (todayHistory?.action === 'POSTPONED' && todayHistory.scheduledFor) {
        scheduledTimeUTC = new Date(todayHistory.scheduledFor);
      }

      // Marcar como MISSED apenas se:
      // 1. Já passou do horário
      // 2. Medicamento foi criado antes do horário agendado
      // 3. Não foi tomado/pulado
      const hasPassed = nowUTC > scheduledTimeUTC;
      const medicationCreatedAt = new Date(schedule.medication.createdAt);
      const wasScheduledAfterCreation = scheduledTimeUTC >= medicationCreatedAt;

      let status: 'confirmed' | 'pending' | 'missed' | 'postponed' = 'pending';

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
            scheduledFor: scheduledTimeUTC,
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
        scheduledTime: scheduledTimeUTC.toISOString(),
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
      deletedAt: { isSet: false },
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
      deletedAt: { isSet: false },
    },
  });

  return medications;
}

export async function getMedicationsById(id: string) {
  return prisma.medication.findUnique({ where: { id, deletedAt: { isSet: false } } });
}

export async function createMedication(data: MedicationSchema, userTimezone?: number) {
  const medication = await prisma.medication.create({ data });
  return medication;
}

export async function updateMedication(id: string, data: Partial<MedicationSchema>) {
  console.log(`\n\n[updateMedication] updating with startTime: ${data.startTime}\n`);
  const updatedMedication = await prisma.medication.update({
    where: { id },
    data,
  });

  try {
    await prisma.medicationSchedule.deleteMany({
      where: {
        medicationId: id,
      }
    })
  } catch (error) {
    console.error(`[updatedMedication] Error: ${error}`);
  }

  return updatedMedication;
}

export async function deleteMedication(id: string) {
  console.info(`\n[MedicationService] deleteMedication - deleting medication with id: ${id}`);

  await prisma.medicationSchedule.deleteMany({
    where: { medicationId: id },
  });

  const medication = await prisma.medication.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  })

  console.info(`\n[MedicationService] deleteMedication - medication soft deleted: ${id}`);
  return medication;
}
