import prisma from '../../shared/lib/prisma';
import { MedicationSchema, MedicationQuery } from './medication.schemas';

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

export async function getTodayMedications(userId: string) {
  const today = new Date();
  const dayOfWeek = today.getDay();

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
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

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
      const scheduledTime = new Date(today);
      scheduledTime.setHours(hours, minutes, 0, 0);

      const now = new Date();
      let status: 'confirmed' | 'pending' | 'missed' = 'pending';

      if (todayHistory) {
        if (todayHistory.action === 'TAKEN') {
          status = 'confirmed';
        } else if (todayHistory.action === 'MISSED') {
          status = 'missed';
        } else if (todayHistory.action === 'SKIPPED') {
          status = 'missed';
        }
      } else if (now > scheduledTime) {
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
        postponed: false,
        userId: schedule.medication.userId,
        scheduleId: schedule.id,
        scheduledTime: scheduledTime.toISOString(),
        status,
      };
    })
  );

  return todayMedications;
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

export async function createMedication(data: MedicationSchema) {
  return prisma.medication.create({ data });
}

export async function updateMedication(id: string, data: Partial<MedicationSchema>) {
  return prisma.medication.update({
    where: { id },
    data,
  });
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
