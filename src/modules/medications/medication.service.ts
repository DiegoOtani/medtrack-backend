import prisma from '../../shared/lib/prisma';
import { MedicationSchema, MedicationQuery } from './medication.schemas';

export async function getMedications(query: MedicationQuery & { userId?: string }) {
  console.log(`[MedicationService] getMedications called with:`, query);

  const { page, limit, userId, ...filters } = query;
  console.log(
    `[MedicationService] page: ${page}, limit: ${limit}, userId: ${userId}, filters:`,
    filters
  );

  const where: any = {};
  if (filters.name) where.name = { contains: filters.name, mode: 'insensitive' };
  if (filters.dosage) where.dosage = { contains: filters.dosage, mode: 'insensitive' };
  if (filters.frequency) where.frequency = { contains: filters.frequency, mode: 'insensitive' };
  if (filters.expiresAt) where.expiresAt = filters.expiresAt;
  if (filters.stock !== undefined) where.stock = filters.stock;
  // Filtrar apenas medicamentos do usuário autenticado
  if (userId) where.userId = userId;

  console.log(`[MedicationService] where clause:`, where);

  const take = limit ?? undefined;
  const skip = page && limit ? (page - 1) * limit : undefined;

  console.log(`[MedicationService] take: ${take}, skip: ${skip}`);

  try {
    const [items, total] = await Promise.all([
      prisma.medication.findMany({
        where,
        skip,
        take,
      }),
      prisma.medication.count({ where }),
    ]);

    console.log(`[MedicationService] Found ${items.length} items, total: ${total}`);

    const result = {
      total,
      page: page ?? 1,
      limit: limit ?? total,
      items,
    };

    console.log(`[MedicationService] Returning result:`, result);
    return result;
  } catch (error) {
    console.error(`[MedicationService] Database error:`, error);
    throw error;
  }
}

export async function getTodayMedications(userId: string) {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Buscar agendamentos ativos que incluem hoje
  const schedules = await prisma.medicationSchedule.findMany({
    where: {
      medication: {
        userId: userId,
      },
      isActive: true,
      daysOfWeek: {
        has: dayOfWeek.toString(),
      },
    },
    include: {
      medication: true,
    },
    orderBy: {
      time: 'asc',
    },
  });

  // Para cada agendamento, verificar se já foi tomado hoje
  const todayMedications = await Promise.all(
    schedules.map(async (schedule) => {
      // Verificar se já existe histórico para hoje
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      const todayHistory = await prisma.medicationHistory.findFirst({
        where: {
          medicationId: schedule.medicationId,
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
          action: 'TAKEN',
        },
      });

      // Criar horário agendado para hoje
      const [hours, minutes] = schedule.time.split(':').map(Number);
      const scheduledTime = new Date(today);
      scheduledTime.setHours(hours, minutes, 0, 0);

      return {
        id: schedule.medication.id,
        name: schedule.medication.name,
        dosage: schedule.medication.dosage,
        time: schedule.time,
        taken: !!todayHistory,
        postponed: false, // TODO: implementar lógica de adiamento
        userId: schedule.medication.userId,
        scheduleId: schedule.id,
        scheduledTime: scheduledTime.toISOString(),
        status: todayHistory ? 'confirmed' : 'pending',
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
  console.log(`[MedicationService] updateMedication chamado com id: ${id}`);
  console.log(`[MedicationService] Dados para atualizar:`, JSON.stringify(data, null, 2));

  const result = await prisma.medication.update({
    where: { id },
    data,
  });

  console.log(`[MedicationService] Resultado da atualização:`, JSON.stringify(result, null, 2));

  return result;
}

export async function deleteMedication(id: string) {
  // Primeiro deletar os registros relacionados
  await prisma.medicationSchedule.deleteMany({
    where: { medicationId: id },
  });

  await prisma.medicationHistory.deleteMany({
    where: { medicationId: id },
  });

  await prisma.scheduledNotification.deleteMany({
    where: { medicationId: id },
  });

  // Depois deletar o medicamento
  return prisma.medication.delete({
    where: { id },
  });
}
