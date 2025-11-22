import { Frequency, Prisma } from '@prisma/client';
import scheduleHandlers from './handler';
import prisma from '../../shared/lib/prisma';
import { CreateCustomScheduleInput, UpdateScheduleInput } from './schedules.schemas';

/**
 * Creates the schedules for a medication
 * @param medicationId - The id of the medication to create the schedules for
 * @param frequency - The frequency of the medication
 * @param startTime - The start time of the medication
 * @param intervalHours - The interval hours of the medication
 * @returns The created schedules
 */
export const createMedicationSchedules = async (
  medicationId: string,
  frequency: Frequency,
  startTime?: string,
  intervalHours?: number | null
) => {
  console.log(`[createMedicationSchedules] Criando schedules para medicationId: ${medicationId}`);
  console.log(
    `[createMedicationSchedules] Frequency: ${frequency}, StartTime: ${startTime}, IntervalHours: ${intervalHours}`
  );

  const schedules = scheduleHandlers[frequency](startTime, intervalHours);

  console.log(
    `[createMedicationSchedules] Schedules gerados pelo handler:`,
    JSON.stringify(schedules, null, 2)
  );

  if (schedules.length === 0) {
    console.log(
      `[createMedicationSchedules] Nenhum agendamento gerado para frequency ${frequency}`
    );
    return { count: 0, message: 'Nenhum agendamento criado' };
  }

  const dataToInsert = schedules.map((schedule) => ({
    medicationId,
    time: schedule.time,
    daysOfWeek: schedule.daysOfWeek,
  }));

  console.log(
    `[createMedicationSchedules] Dados para inserir no DB:`,
    JSON.stringify(dataToInsert, null, 2)
  );

  const createdSchedules = await prisma.medicationSchedule.createMany({
    data: dataToInsert,
  });

  console.log(
    `[createMedicationSchedules] ✅ ${createdSchedules.count} schedules criados com sucesso`
  );

  if (createdSchedules.count !== schedules.length) {
    throw new Error('Erro ao criar os agendamentos');
  }

  return createdSchedules;
};

/**
 * Gets all schedules for a medication
 */
export const getSchedulesByMedication = async (medicationId: string, isActive?: boolean) => {
  const where: Prisma.MedicationScheduleWhereInput = {
    medicationId,
  };

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  const schedules = await prisma.medicationSchedule.findMany({
    where,
    include: {
      medication: {
        select: {
          id: true,
          name: true,
          dosage: true,
        },
      },
    },
    orderBy: {
      time: 'asc',
    },
  });

  return schedules;
};

/**
 * Gets all active schedules for a user's medications
 */
export const getSchedulesByUser = async (userId: string, isActive?: boolean) => {
  const where: Prisma.MedicationScheduleWhereInput = {
    medication: {
      userId,
    },
  };

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  const schedules = await prisma.medicationSchedule.findMany({
    where,
    include: {
      medication: {
        select: {
          id: true,
          name: true,
          dosage: true,
          frequency: true,
        },
      },
    },
    orderBy: [
      {
        medication: {
          name: 'asc',
        },
      },
      {
        time: 'asc',
      },
    ],
  });

  return schedules;
};

/**
 * Gets a single schedule by ID
 */
export const getScheduleById = async (id: string) => {
  const schedule = await prisma.medicationSchedule.findUnique({
    where: { id },
    include: {
      medication: {
        select: {
          id: true,
          name: true,
          dosage: true,
        },
      },
    },
  });

  if (!schedule) {
    throw new Error('Agendamento não encontrado');
  }

  return schedule;
};

/**
 * Creates a custom schedule for a medication
 */
export const createCustomSchedule = async (data: CreateCustomScheduleInput) => {
  const { medicationId, time, daysOfWeek } = data;

  // Verify medication exists
  const medication = await prisma.medication.findUnique({
    where: { id: medicationId },
  });

  if (!medication) {
    throw new Error('Medicamento não encontrado');
  }

  const schedule = await prisma.medicationSchedule.create({
    data: {
      medicationId,
      time,
      daysOfWeek,
    },
    include: {
      medication: {
        select: {
          id: true,
          name: true,
          dosage: true,
        },
      },
    },
  });

  return schedule;
};

/**
 * Updates a schedule
 */
export const updateSchedule = async (id: string, data: UpdateScheduleInput['body']) => {
  const schedule = await prisma.medicationSchedule.findUnique({
    where: { id },
  });

  if (!schedule) {
    throw new Error('Agendamento não encontrado');
  }

  const updatedSchedule = await prisma.medicationSchedule.update({
    where: { id },
    data,
    include: {
      medication: {
        select: {
          id: true,
          name: true,
          dosage: true,
        },
      },
    },
  });

  return updatedSchedule;
};

/**
 * Toggles a schedule's active status
 */
export const toggleSchedule = async (id: string) => {
  const schedule = await prisma.medicationSchedule.findUnique({
    where: { id },
  });

  if (!schedule) {
    throw new Error('Agendamento não encontrado');
  }

  const updatedSchedule = await prisma.medicationSchedule.update({
    where: { id },
    data: {
      isActive: !schedule.isActive,
    },
    include: {
      medication: {
        select: {
          id: true,
          name: true,
          dosage: true,
        },
      },
    },
  });

  return updatedSchedule;
};

/**
 * Deletes a schedule
 */
export const deleteSchedule = async (id: string) => {
  const schedule = await prisma.medicationSchedule.findUnique({
    where: { id },
  });

  if (!schedule) {
    throw new Error('Agendamento não encontrado');
  }

  await prisma.medicationSchedule.delete({
    where: { id },
  });

  return { message: 'Agendamento excluído com sucesso' };
};

/**
 * Deletes all schedules for a medication
 */
export const deleteSchedulesByMedication = async (medicationId: string) => {
  const result = await prisma.medicationSchedule.deleteMany({
    where: { medicationId },
  });

  return result;
};

/**
 * Recreates schedules for a medication (useful when changing frequency)
 */
export const recreateSchedules = async (
  medicationId: string,
  frequency: Frequency,
  startTime?: string,
  intervalHours?: number | null
) => {
  // Delete existing schedules
  await deleteSchedulesByMedication(medicationId);

  // Create new schedules
  const schedules = await createMedicationSchedules(
    medicationId,
    frequency,
    startTime,
    intervalHours
  );

  return schedules;
};
